import cors from "cors";

const allowlist = (process.env.ALLOW_CORS ?? "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser (curl)
    if (allowlist.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 204,
});
