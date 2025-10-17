import { Request, Response } from "express"
import { accessToken, signToken, verifyToken } from "../utils/jwt"
import bcrypt from "bcrypt"
import { User } from "@digishop/db"

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" })
  }
  try {
    const user = await User.findOne({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" })
    }
    console.log("user: ", user)
    // ตรวจสอบ password (สมมติเป็น plain text, แนะนำใช้ bcrypt)
   
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role
    })
    const accesstoken = accessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // เปลี่ยนเป็น true ถ้าใช้ HTTPS
      sameSite: "none",
      path: "/"
    })

    res.json({ message: "Logged in", accessToken: accesstoken ,role: user.role, user: { id: user.id, email: user.email, role: user.role } })

  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

export const logout = (req: Request, res: Response) => {
  console.log("Logging out user")
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  }).json({ message: "Logged out" })
}

export const me = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.token
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" })
    }

    const payload = verifyToken(token)
    // console.log("Type of payload: ", typeof payload)
    // console.log("Payload: ", payload)
    if (!payload) {
      return res.status(401).json({ message: "Invalid token" })
    }

    let userId: string | number | undefined

    if (typeof payload === "string") {
      return res.status(401).json({ message: "Invalid token payload format" })
    } else {
      userId = payload.sub
    }

    if (!userId || (typeof userId !== "string" && typeof userId !== "number")) {
      return res.status(401).json({ message: "Invalid token payload" })
    }

    const user = await User.findByPk(userId, {
      attributes: ["id", "email", "role"]
    })
    // console.log("User that verify: ", user)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Me error:", error)
    res.status(500).json({ message: "Internal server error" })
  }
}

