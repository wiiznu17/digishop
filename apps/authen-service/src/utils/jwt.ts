import jwt, { JwtPayload } from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables")
}

export const signToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "10M" })
}

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}
