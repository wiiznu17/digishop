import { createProxyMiddleware } from "http-proxy-middleware";
import { config } from "../config";

export const merchantProxy = createProxyMiddleware({
  target: config.services.merchant,
  changeOrigin: true,
  cookieDomainRewrite: "",
  pathRewrite: { "^/api/merchant": "/api/merchant" },
  logLevel: "debug", // full log

  onError: (err, req, res) => {
    console.error("[Gateway] Merchant proxy error:", err);
    if (!res.headersSent) {
      res.status(500).send("Proxy error");
    }
  }
});

