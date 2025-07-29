import { createProxyMiddleware } from "http-proxy-middleware"
import { config } from "../config"

export const merchantProxy = createProxyMiddleware({
  target: config.services.merchant,
  changeOrigin: true,
  pathRewrite: { "^/api/merchant": "/api/merchant" },
  onProxyReq: (proxyReq, req, res) => {
    if (req.body) {
      const bodyData = JSON.stringify(req.body)
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData))
      proxyReq.write(bodyData)
      proxyReq.end()
    }
  },
  onError: (err, req, res) => {
    console.error("[Gateway] Merchant proxy error:", err)
    res.status(500).send("Proxy error")
  }
})
