import { createProxyMiddleware } from "http-proxy-middleware";
import { RequestHandler } from "express";
import { config } from "../config";

export const authProxy: RequestHandler = createProxyMiddleware({
  target: config.services.auth,
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "/api/auth" },
  cookieDomainRewrite: "localhost",
  logLevel: "debug",

  onProxyReq: (proxyReq, req) => {
    console.log(`[Gateway] Proxying request to: ${config.services.auth}${req.url}`);
    // ❌ ไม่ต้องเขียน body เอง
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
    console.error("[Gateway] Auth proxy error:", err);
    if (!res.headersSent) {
      res.status(500).send("Proxy error");
    }
  }
});
