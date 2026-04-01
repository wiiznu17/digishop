import bcrypt from 'bcrypt'
import { OAuth2Client } from 'google-auth-library'
import { v4 as uuidv4 } from 'uuid'
import { JWTPayload, signAccess, signRefresh, verifyRefresh } from '../lib/jwt'
import { UserRepository } from '../repositories/UserRepository'
import {
  SessionRepository,
  RefreshSession
} from '../repositories/SessionRepository'
import { UnauthorizedError, NotFoundError } from '../errors/AppError'
import { toMillis } from '../lib/duration'

const REFRESH_TTL_MS = toMillis(process.env.REFRESH_TOKEN_TTL || '30d')
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export class AuthService {
  static async login(
    email: string,
    password: string,
    ip?: string,
    userAgent?: string
  ) {
    const user = await UserRepository.findByEmail(email)
    if (!user) throw new UnauthorizedError('INVALID_CREDENTIALS')

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new UnauthorizedError('INVALID_CREDENTIALS')

    const jti = uuidv4()
    const access = signAccess({ sub: user.id, jti })
    const refresh = signRefresh({ sub: user.id, jti })

    const now = Date.now()
    const session: RefreshSession = {
      userId: user.id,
      jti,
      ip: ip || null,
      userAgent: userAgent || null,
      createdAt: now,
      expiresAt: now + REFRESH_TTL_MS
    }

    await SessionRepository.setSession(user.id, jti, session)

    return {
      user: { id: user.id, email: user.email, role: user.role },
      tokens: { access, refresh }
    }
  }

  static async googleLogin(
    token: string,
    ip?: string,
    userAgent?: string
  ) {
    let email: string | undefined
    let googleId: string | undefined
    let given_name: string | undefined
    let family_name: string | undefined

    const isJWT = token.split('.').length === 3

    if (isJWT) {
      // Handle ID Token (JWT)
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      })
      const payload = ticket.getPayload()
      if (!payload) throw new UnauthorizedError('INVALID_GOOGLE_TOKEN')
      email = payload.email
      googleId = payload.sub
      given_name = payload.given_name
      family_name = payload.family_name
    } else {
      // Handle Access Token (Implicit Flow)
      try {
        const tempClient = new OAuth2Client()
        tempClient.setCredentials({ access_token: token })
        const userInfo = await tempClient.request<{
          email: string
          sub: string
          given_name?: string
          family_name?: string
        }>({
          url: 'https://www.googleapis.com/oauth2/v3/userinfo'
        })
        email = userInfo.data.email
        googleId = userInfo.data.sub
        given_name = userInfo.data.given_name
        family_name = userInfo.data.family_name
      } catch (err) {
        console.error('[AuthService] Google UserInfo error:', err)
        throw new UnauthorizedError('INVALID_ACCESS_TOKEN_OR_USERINFO_FAILED')
      }
    }

    if (!email || !googleId) {
      throw new UnauthorizedError('GOOGLE_AUTH_FAILED_NO_EMAIL_OR_SUB')
    }

    const payload = { email, sub: googleId, given_name, family_name }

    let user = await UserRepository.findByGoogleId(googleId)

    if (!user) {
      // Check if user exists by email but not linked to google
      user = await UserRepository.findByEmail(email)
      if (user) {
        // Link googleId to existing user
        await UserRepository.update(user.id, { googleId })
      } else {
        // Create new user with default role CUSTOMER
        user = (await UserRepository.create({
          email,
          googleId,
          firstName: given_name || '',
          lastName: family_name || '',
          middleName: '',
          password: uuidv4(), // Random password for oauth users
          role: 'CUSTOMER' as any
        })) as any
      }
    }

    if (!user) throw new UnauthorizedError('USER_CREATION_FAILED')

    const jti = uuidv4()
    const access = signAccess({ sub: user.id, jti })
    const refresh = signRefresh({ sub: user.id, jti })

    const now = Date.now()
    const session: RefreshSession = {
      userId: user.id,
      jti,
      ip: ip || null,
      userAgent: userAgent || null,
      createdAt: now,
      expiresAt: now + REFRESH_TTL_MS
    }

    await SessionRepository.setSession(user.id, jti, session)

    return {
      user: { id: user.id, email: user.email, role: user.role },
      tokens: { access, refresh }
    }
  }

  static async refresh(refreshToken: string, ip?: string, userAgent?: string) {
    try {
      const payload = verifyRefresh<JWTPayload>(refreshToken)
      const session = await SessionRepository.getSession(payload.jti)

      if (!session) throw new UnauthorizedError('SESSION_REVOKED')
      if (String(session.userId) !== String(payload.sub))
        throw new UnauthorizedError('SESSION_SUB_MISMATCH')
      if (session.expiresAt && session.expiresAt < Date.now())
        throw new UnauthorizedError('SESSION_EXPIRED')

      const now = Date.now()
      const newJti = uuidv4()
      const newSession: RefreshSession = {
        userId: session.userId,
        jti: newJti,
        ip: ip || null,
        userAgent: userAgent || null,
        createdAt: now,
        expiresAt: now + REFRESH_TTL_MS
      }

      await SessionRepository.setSession(session.userId, newJti, newSession)

      return {
        tokens: {
          access: signAccess({ sub: session.userId, jti: newJti }),
          refresh: signRefresh({ sub: session.userId, jti: newJti })
        }
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err
      throw new UnauthorizedError('INVALID_REFRESH')
    }
  }

  static async logout(refreshToken: string) {
    try {
      const payload = verifyRefresh<JWTPayload>(refreshToken)
      await SessionRepository.revokeSession(payload.sub, payload.jti)
    } catch {
      // Silently ignore bad/expired tokens on logout
    }
  }

  static async getMe(userId: number) {
    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('USER_NOT_FOUND')
    return {
      id: (user as any).id,
      email: (user as any).email,
      role: (user as any).role
    }
  }
}
