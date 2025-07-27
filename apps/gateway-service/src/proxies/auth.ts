// filepath: d:\Project\Learn\digishop\apps\gateway-service\src\proxies\auth.ts
import { createProxyMiddleware } from "http-proxy-middleware"
import { RequestHandler } from "express"
import { config } from "../config"

export const authProxy: RequestHandler = createProxyMiddleware({
  target: config.services.auth,
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "" },
  cookieDomainRewrite: "localhost",
  onProxyRes: (proxyRes) => {
    const cookies = proxyRes.headers["set-cookie"]
    if (cookies) {
      const newCookies = cookies.map(cookie =>
        cookie.replace(/Domain=.+?;/i, "Domain=localhost;")
      )
      proxyRes.headers["set-cookie"] = newCookies
    }
  }
})