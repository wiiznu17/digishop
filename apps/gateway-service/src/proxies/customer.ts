import { createProxyMiddleware } from "http-proxy-middleware"
import { config } from "../config"

export const customerProxy = createProxyMiddleware({
  target: config.services.customer,
  changeOrigin: true,
  pathRewrite: { "^/customer": "" }
})
