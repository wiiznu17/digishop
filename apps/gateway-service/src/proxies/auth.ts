import { createProxyMiddleware } from "http-proxy-middleware";
import { RequestHandler } from "express";
import { config } from "../config";

function sanitizeSetCookie(raw: string): string {
  const parts = raw.split(";").map(s => s.trim()).filter(Boolean);
  const [nv, ...attrs] = parts;

  const map = new Map<string, string | true>();
  for (const a of attrs) {
    const i = a.indexOf("=");
    if (i === -1) {
      map.set(a.toLowerCase(), true);
    } else {
      const k = a.slice(0, i).trim().toLowerCase();
      const v = a.slice(i + 1).trim();
      map.set(k, v);
    }
  }

  // ลบ Domain เพื่อให้เป็น first-party cookie
  map.delete("domain");
  // บังคับ Path=/
  map.set("path", "/");

  const maxAge = map.get("max-age");
  const expires = map.get("expires");

  // บังคับค่าสำคัญ
  map.set("secure", true);
  map.set("httponly", true);
  map.set("samesite", "None");
  map.set("partitioned", true);

  const out: string[] = [nv];
  if (maxAge) out.push(`Max-Age=${maxAge}`);
  if (expires) out.push(`Expires=${expires}`);
  out.push("Path=/");
  out.push("Secure");
  out.push("HttpOnly");
  out.push("SameSite=None");
  out.push("Partitioned");
  return out.join("; ");
}

export const authProxy: RequestHandler = createProxyMiddleware({
  target: config.services.auth,
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "/api/auth" },
  // อย่าใช้ cookieDomainRewrite ซ้ำกับ sanitize เอง
  logLevel: "debug",

  onProxyReq(proxyReq, req) {
    console.log(`[Gateway] Proxying request to: ${config.services.auth}${req.url}`);
  },

  onProxyRes(proxyRes, req) {
    if (req.url?.startsWith("/api/auth/login") || req.url?.startsWith("/api/auth/refresh")) {
      proxyRes.headers["cache-control"] = "no-store";
      proxyRes.headers["pragma"] = "no-cache";
    }
    const cookies = proxyRes.headers["set-cookie"];
    if (cookies && Array.isArray(cookies)) {
      const sanitized = cookies.map(sanitizeSetCookie);
      proxyRes.headers["set-cookie"] = sanitized;
      console.log("[Gateway] Rewrote Set-Cookie:", sanitized);
    }
  },

  onError(err, req, res) {
    console.error("[Gateway] Auth proxy error:", err);
    if (!res.headersSent) res.status(500).send("Proxy error");
  }
});
