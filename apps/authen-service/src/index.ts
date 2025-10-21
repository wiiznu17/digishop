import express from "express";
import cors from "cors";
import "./helpers/dotenv.helper";
import authRoutes from "./routes/authRouter";
import { checkDatabaseConnection, initModels, sequelize } from "@digishop/db";
import cookieParser from "cookie-parser";

async function main() {
  try {
    await checkDatabaseConnection();
    const app = express();
    app.set("trust proxy", 1);

    const allowlist = (process.env.ALLOW_CORS ?? "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    console.log("CORS allowlist:", allowlist);
    app.use(
      cors({
        origin(origin, callback) {
          // กรณีไม่มี Origin (เช่น curl/same-origin) ให้ผ่าน
          if (!origin) return callback(null, true);
          if (allowlist.includes(origin)) return callback(null, true);
          return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
        optionsSuccessStatus: 204
      })
    );

    // app.options("*", cors())

    app.use(cookieParser())
    app.use(express.json())

    app.use((req, _res, next) => {
      console.log("[AUTH] Incoming", req.method, req.url, "Origin:", req.headers.origin);
      next();
    });

    initModels(sequelize);

    app.use("/api/auth", authRoutes);

    const PORT = Number(process.env.PORT)
    app.listen(PORT, () => {
      console.log(`Auth Service running on port ${PORT}`);
      console.log("CORS allowlist:", allowlist);
    });
  } catch (err) {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Application failed:", err);
  process.exit(1);
});
