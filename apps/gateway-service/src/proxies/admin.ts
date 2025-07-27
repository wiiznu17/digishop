import { createProxyMiddleware } from "http-proxy-middleware"
import { config } from "../config"

export const adminProxy = createProxyMiddleware({
  target: config.services.admin,
  changeOrigin: true,
  pathRewrite: { "^/admin": "" }
})
