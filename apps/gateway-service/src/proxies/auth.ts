import { createProxyMiddleware } from "http-proxy-middleware";
import { RequestHandler } from "express";
import { config } from "../config";

export const authProxy: RequestHandler = createProxyMiddleware({
  target: config.services.auth,
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "/api/auth" },
  cookieDomainRewrite: "localhost",
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Gateway] Proxying request to: ${config.services.auth}${req.url}`);

    // ส่ง body เฉพาะ POST, PUT, PATCH เท่านั้น
    if (req.method !== "GET" && req.method !== "HEAD" && req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);

      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));

      proxyReq.write(bodyData);
      // ไม่ต้อง proxyReq.end() ให้ middleware จัดการเอง
    }
  },
  onProxyRes: (proxyRes) => {
    const cookies = proxyRes.headers["set-cookie"];
    if (cookies) {
      proxyRes.headers["set-cookie"] = cookies.map(cookie =>
        cookie.replace(/Domain=.+?;/i, "Domain=localhost;")
      );
    }
  },
  onError: (err, req, res) => {
    console.error("[Gateway] Proxy error:", err);
    if (!res.headersSent) {
      res.status(500).send("Proxy error");
    }
  }
});
