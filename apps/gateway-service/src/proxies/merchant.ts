import { createProxyMiddleware } from "http-proxy-middleware"
import { config } from "../config"

export const merchantProxy = createProxyMiddleware({
  target: config.services.merchant,
  changeOrigin: true,
  pathRewrite: { "^/api/merchant": "" }
})
