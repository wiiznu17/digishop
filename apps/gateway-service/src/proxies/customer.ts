import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";

export const customerProxy = createProxyMiddleware({
  target: config.services.customer,
  changeOrigin: true,
  cookieDomainRewrite: "localhost",
  pathRewrite: { "^/api/customer": "/api/customer" },
  logLevel: "debug",

  onProxyReq: (proxyReq, req) => {
    console.log(`[Gateway] Proxying request to: ${config.services.customer}${req.url}`);
    // ❌ ไม่ต้องเขียน body เอง
  },

  onError: (err, req, res) => {
    console.error("[Gateway] Customer proxy error:", err);
    if (!res.headersSent) {
      res.status(500).send("Proxy error");
    }
  }
});
