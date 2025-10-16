import express from "express"
import cors from "cors"
import './helpers/dotenv.helper';
import authRoutes from "./routes/authRouter"
import { checkDatabaseConnection, initModels, sequelize } from '@digishop/db';
const cookieParser = require("cookie-parser")  // ใช้ require แทน

async function main() {
  try {
    await checkDatabaseConnection();
    const app = express()
    console.log("JWT", process.env.JWT_SECRET)
    
    app.use(cors({
      origin: ["http://localhost:3000", "http://localhost:4000"],
      credentials: true
    }))
    app.use(cookieParser())
    app.use(express.json())
    initModels(sequelize);
    
    app.use("/api/auth", authRoutes)
    app.use((req, res, next) => {
      console.log('[MERCHANT] Incoming', req.url)
      next()
    })
    const PORT = process.env.PORT || 4001
    app.listen(PORT, () => {
      console.log(`Auth Service running on http://localhost:${PORT}`)
    })

  } catch (err) {
    console.error('❌ Server failed to start:', err);
    throw err;
  }
}

main().catch((err) => {
  console.error('Application failed:', err);
  process.exit(1);
});
