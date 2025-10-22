import { createProxyMiddleware } from "http-proxy-middleware";
import { RequestHandler } from "express";
import { config } from "../config";

export const authProxy: RequestHandler = createProxyMiddleware({
  target: config.services.auth,
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "/api/auth" },
  // ทำให้ cookie เป็น host-only
  cookieDomainRewrite: "",
  logLevel: "debug",

  onProxyReq(proxyReq, req) {
    console.log(`[Gateway] Proxying request to: ${config.services.auth}${req.url}`);
  },

  onProxyRes(proxyRes) {
    const cookies = proxyRes.headers["set-cookie"];
    if (cookies) {
      proxyRes.headers["set-cookie"] = cookies.map((cookie) => {
        // ลบ domain ออก และบังคับ attributes ให้มือถือ
        return cookie
          .replace(/Domain=[^;]+;?/i, "") // remove domain
          .replace(/SameSite=[^;]+;?/i, "") // remove any SameSite
          .replace(/Secure;?/i, "") // remove old Secure if duplicated
          .replace(/HttpOnly;?/i, "") // remove old HttpOnly if duplicated
          + "; Path=/; Secure; HttpOnly; SameSite=None; Partitioned";
      });
      console.log("[Gateway] Rewrote Set-Cookie:", proxyRes.headers["set-cookie"]);
    }
  },

  onError(err, req, res) {
    console.error("[Gateway] Auth proxy error:", err);
    if (!res.headersSent) res.status(500).send("Proxy error");
  }
});
