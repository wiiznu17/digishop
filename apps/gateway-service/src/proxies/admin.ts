import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";

export const adminProxy = createProxyMiddleware({
  target: config.services.admin,
  changeOrigin: true,
  cookieDomainRewrite: "localhost",
  pathRewrite: { "^/api/admin": "/api/admin" },
  logLevel: "debug", // จะได้เห็นว่า proxy ส่งอะไรไปบ้าง

  onProxyReq: (proxyReq, req) => {
    console.log(`[Gateway] Proxying request to: ${config.services.admin}${req.url}`);
    // ❌ ไม่ต้องเขียน body เอง ปล่อยให้ middleware จัดการ
  },

  onError: (err, req, res) => {
    console.error("[Gateway] Admin proxy error:", err);
    if (!res.headersSent) {
      res.status(500).send("Proxy error");
    }
  }
});
