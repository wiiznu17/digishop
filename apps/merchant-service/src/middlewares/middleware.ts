import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  console.log("Authenticating request...");
  const token = req.cookies.token
  // console.log("Token from cookies:", token);
  if (!token) return res.status(401).json({ error: "Unauthorized jaaaaaa" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // console.log("Decoded token:", decoded);
    if (typeof decoded === "string") return res.status(401).json({ error: "Invalid token" });

    req.user = decoded;
    // console.log("Authenticated user:", req.user);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized ja" });
  }
};
