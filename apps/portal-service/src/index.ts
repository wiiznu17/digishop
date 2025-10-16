import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
// import cookieParser from 'cookie-parser';
import router from './iamRouter';
import './helpers/dotenv.helper';
import { checkDatabaseConnection, initModels, sequelize } from '@digishop/db';
import { ensureRedis } from './lib/redis';
const cookieParser = require('cookie-parser');
const PORT = Number(process.env.PORT) || 4001;

async function main() {
  try {

    await checkDatabaseConnection();
    await ensureRedis();
    const app = express();
    app.disable('x-powered-by');
    app.use(helmet({ crossOriginResourcePolicy: false }));
    app.use(express.json({ limit: '1mb' }));
    app.use(cookieParser());

    const allowedOrigins = [process.env.ALLOW_CORS];
    app.use(cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // อนุญาตเครื่องมือ health check
        if (allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error("Not allowed by CORS: " + origin));
      },
      credentials: true,
      methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 204,
    }));

    initModels(sequelize);
    app.use('/api', router);

    const server = app.listen(PORT, () => {
      console.log(`Portal Service listening at: http://localhost:${PORT}`);
    });

    // Server error handling
    server.on('error', (err) => {
      console.error('❌ Server error:', err);
    });

    server.on('listening', () => {
      console.log('✅ Server is actively listening');
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n🔄 ${signal} received, shutting down gracefully...`);
      server.close((err) => {
        if (err) {
          console.error('Error during server shutdown:', err);
          process.exit(1);
        }
        console.log('Server closed');
        sequelize.close();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Keep process alive - return promise ที่ไม่ resolve
    return new Promise((resolve, reject) => {
      server.on('error', reject);
      // ไม่ resolve เพื่อให้ process ทำงานต่อไป
    });

  } catch (err) {
    console.error('❌ Server failed to start:', err);
    throw err;
  }
}

main().catch((err) => {
  console.error('Application failed:', err);
  process.exit(1);
});
