import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";

export const customerProxy = createProxyMiddleware({
  target: config.services.merchant,
  changeOrigin: true,
  cookieDomainRewrite: "localhost",
  pathRewrite: { "^/api/customer": "/api/customer" },

  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Proxying request to: ${config.services.merchant}${req.url}`);

    // ส่ง body เฉพาะ POST, PUT, PATCH
    if (
      req.method !== "GET" &&
      req.method !== "HEAD" &&
      req.body &&
      Object.keys(req.body).length
    ) {
      const bodyData = JSON.stringify(req.body);

      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

      proxyReq.write(bodyData);
      // ไม่ต้อง proxyReq.end() ให้ middleware จัดการเอง
    }
  },

  onError: (err, req, res) => {
    console.error("[Gateway] Merchant proxy error:", err);
    if (!res.headersSent) {
      res.status(500).send("Proxy error");
    }
  }
});
