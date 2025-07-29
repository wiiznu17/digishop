import { createProxyMiddleware } from "http-proxy-middleware"
import { RequestHandler } from "express"
import { config } from "../config"

export const authProxy: RequestHandler = createProxyMiddleware({
  target: config.services.auth,
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "/api/auth" },
  cookieDomainRewrite: "localhost",
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Proxying request to: ${config.services.auth}${req.url}`)

    if (req.body) {
      const bodyData = JSON.stringify(req.body)
      // ตั้ง header content-length ใหม่
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData))
      // เขียน body data ลง proxy request
      proxyReq.write(bodyData)
      proxyReq.end()
    }
  },
  onProxyRes: (proxyRes) => {
    const cookies = proxyRes.headers["set-cookie"]
    if (cookies) {
      const newCookies = cookies.map(cookie =>
        cookie.replace(/Domain=.+?;/i, "Domain=localhost;")
      )
      proxyRes.headers["set-cookie"] = newCookies
    }
  },
  onError: (err, req, res) => {
    console.error("[Gateway] Proxy error:", err)
    res.status(500).send("Proxy error")
  }
})
