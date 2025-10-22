import { createProxyMiddleware } from "http-proxy-middleware";
import { RequestHandler } from "express";
import { config } from "../config";

function sanitizeSetCookie(raw: string): string {
  // แยก name=value ออกจาก attributes
  const parts = raw.split(";").map(s => s.trim()).filter(Boolean);
  const [nv, ...attrs] = parts;

  // เก็บ attrs ลง map (lowercase key)
  const map = new Map<string, string | true>();

  for (const a of attrs) {
    const i = a.indexOf("=");
    if (i === -1) {
      // flag attribute เช่น Secure, HttpOnly, Partitioned, SameSite=None (บางทีไม่มี =)
      map.set(a.toLowerCase(), true);
    } else {
      const k = a.slice(0, i).trim().toLowerCase();
      const v = a.slice(i + 1).trim();
      map.set(k, v);
    }
  }

  // ❌ ห้ามส่ง Domain (ทำให้ cross-site) → ลบออก
  map.delete("domain");

  // ✅ ต้องมี Path=/ เสมอ
  map.set("path", "/");

  // ✅ คง Max-Age/Expires ถ้ามี (อย่าแตะ ถ้าไม่มีไม่ต้องใส่)
  const maxAge = map.get("max-age");
  const expires = map.get("expires");

  // ✅ ต้องมี Secure, HttpOnly, SameSite=None, Partitioned
  map.set("secure", true);
  map.set("httponly", true);
  map.set("samesite", "None");
  map.set("partitioned", true);

  // ประกอบใหม่เรียงระเบียบ (เหลือครั้งละ 1 ชุด, ไม่มีซ้ำ/ช่องว่างประหลาด)
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

  // ปล่อยให้เราคุมใน onProxyRes เอง (จะได้ไม่ชน/ซ้ำกับของ lib)
  // cookieDomainRewrite: "",  // ← เอาออกเมื่อ sanitize เอง

  logLevel: "debug",

  onProxyReq(proxyReq, req) {
    console.log(`[Gateway] Proxying request to: ${config.services.auth}${req.url}`);
  },

  onProxyRes(proxyRes, req) {
    // กัน CDN/Browser cache response ของ /login /refresh (สำคัญมากบนมือถือ)
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
