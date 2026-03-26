import jwt, { JwtPayload } from "jsonwebtoken"
import { v4 as uuidv4 } from "uuid";
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables")
}

export const accessToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "10H" })
} 

export const refreshToken = () => {
  return uuidv4()
}