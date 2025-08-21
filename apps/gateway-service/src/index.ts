import express from "express"
// import cookieParser from "cookie-parser"
import { config } from "./config"
import { corsMiddleware } from "./middlewares/cors"
import { loggerMiddleware } from "./middlewares/logger"

import { authProxy } from "./proxies/auth"
import { merchantProxy } from "./proxies/merchant"
import { customerProxy } from "./proxies/customer"
import { adminProxy } from "./proxies/admin"
const cookieParser = require("cookie-parser")  // ใช้ require แทน

const app = express()

// Middlewares
app.use(corsMiddleware)
app.use(loggerMiddleware)
app.use(cookieParser())
// app.use(express.json())

// Health check
app.get("/healthz", (_, res) => res.send("OK"))

// Proxy routes
app.use("/api/auth", authProxy)
app.use("/api/merchant", merchantProxy)
app.use("/api/customer", customerProxy)
app.use("/api/admin", adminProxy)

// Start server
app.listen(config.port, () => {
  console.log(`🚀 Gateway running on http://localhost:${config.port}`)
})
