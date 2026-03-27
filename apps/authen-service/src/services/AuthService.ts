import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { JWTPayload, signAccess, signRefresh, verifyRefresh } from "../lib/jwt";
import { UserRepository } from "../repositories/UserRepository";
import { SessionRepository, RefreshSession } from "../repositories/SessionRepository";
import { UnauthorizedError, NotFoundError } from "../errors/AppError";
import { toMillis } from "../lib/duration";

const REFRESH_TTL_MS = toMillis(process.env.REFRESH_TOKEN_TTL || "30d");

export class AuthService {
  static async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string
  ) {
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new UnauthorizedError("INVALID_CREDENTIALS");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedError("INVALID_CREDENTIALS");

    const jti = uuidv4();
    const access = signAccess({ sub: user.id, jti });
    const refresh = signRefresh({ sub: user.id, jti });

    const now = Date.now();
    const session: RefreshSession = {
      userId: user.id,
      jti,
      ip: ip || null,
      userAgent: userAgent || null,
      createdAt: now,
      expiresAt: now + REFRESH_TTL_MS,
    };

    await SessionRepository.setSession(user.id, jti, session);

    return {
      user: { id: user.id, email: user.email, role: user.role },
      tokens: { access, refresh },
    };
  }

  static async refresh(
    refreshToken: string,
    ip?: string,
    userAgent?: string
  ) {
    try {
      const payload = verifyRefresh<JWTPayload>(refreshToken);
      const session = await SessionRepository.getSession(payload.jti);

      if (!session) throw new UnauthorizedError("SESSION_REVOKED");
      if (String(session.userId) !== String(payload.sub)) throw new UnauthorizedError("SESSION_SUB_MISMATCH");
      if (session.expiresAt && session.expiresAt < Date.now()) throw new UnauthorizedError("SESSION_EXPIRED");

      const now = Date.now();
      const newJti = uuidv4();
      const newSession: RefreshSession = {
        userId: session.userId,
        jti: newJti,
        ip: ip || null,
        userAgent: userAgent || null,
        createdAt: now,
        expiresAt: now + REFRESH_TTL_MS,
      };

      await SessionRepository.setSession(session.userId, newJti, newSession);

      return {
        tokens: {
          access: signAccess({ sub: session.userId, jti: newJti }),
          refresh: signRefresh({ sub: session.userId, jti: newJti }),
        },
      };
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError("INVALID_REFRESH");
    }
  }

  static async logout(refreshToken: string) {
    try {
      const payload = verifyRefresh<JWTPayload>(refreshToken);
      await SessionRepository.revokeSession(payload.sub, payload.jti);
    } catch {
      // Silently ignore bad/expired tokens on logout
    }
  }

  static async getMe(userId: number) {
    const user = await UserRepository.findById(userId);
    if (!user) throw new NotFoundError("USER_NOT_FOUND");
    return { id: (user as any).id, email: (user as any).email, role: (user as any).role };
  }
}
