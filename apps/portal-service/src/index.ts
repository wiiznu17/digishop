import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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

    // ต้องมาก่อน middleware อื่นๆ ที่อ่าน req.ip / ใช้ rate-limit
    // ถ้ามี 1 hop (LB/CDN ตัวเดียว) ใช้ 1 ได้; ถ้าไม่แน่ใจใช้ true
    app.set('trust proxy', 1);

    app.disable('x-powered-by');
    app.use(helmet({ crossOriginResourcePolicy: false }));
    app.use(express.json({ limit: '1mb' }));
    app.use(cookieParser());

    // CORS: รองรับหลาย origin จาก env (คั่นด้วย comma)
    const allowedOrigins = (process.env.ALLOW_CORS ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const corsMiddleware = cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // อนุญาต health check / curl
        if (allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error('Not allowed by CORS: ' + origin));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept', 'X-Requested-With'],
      optionsSuccessStatus: 204
    });

    app.use((req, res, next) => {
      // ช่วยให้ CDN/proxy cache แยกตาม Origin ได้ถูกต้อง
      res.header('Vary', 'Origin');
      next();
    });

    app.use(corsMiddleware);
    app.options('*', corsMiddleware);

    // ติดตั้ง rate limiter หลังจาก set('trust proxy', ...)
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,     // 15 นาที
      max: 300,                     // ปรับตามทราฟฟิก
      standardHeaders: true,
      legacyHeaders: false
      // ไม่ต้อง config อื่น ๆ ก็พอ—express-rate-limit จะใช้ req.ip ที่ถูกต้องแล้ว
    });
    app.use(limiter);

    initModels(sequelize);
    app.use('/api', router);

    const server = app.listen(PORT, () => {
      console.log(`Portal Service listening at: http://localhost:${PORT}`);
    });

    server.on('error', (err) => {
      console.error('❌ Server error:', err);
    });

    server.on('listening', () => {
      console.log('✅ Server is actively listening');
    });

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
