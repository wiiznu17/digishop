import express from 'express';
import cors from "cors"
import router from './iamRouter';
import './helpers/dotenv.helper';
import { checkDatabaseConnection, initModels } from '@digishop/db';
import { sequelize } from '@digishop/db/src/db';
const cookieParser = require("cookie-parser")

const PORT = Number(process.env.PORT);

async function main() {
  try {

    await checkDatabaseConnection();

    const app = express();
    app.use(express.json());
    app.use(cookieParser())
    app.use(cors({
      origin: ["http://localhost:4000"],
      credentials: true
    }))
    initModels(sequelize);
    app.use('/api', router);
    app.use((req, res, next) => {
      console.log('[MERCHANT] Incoming', req.method, req.url)
      next()
    })

    const server = app.listen(PORT, () => {
      console.log(`Merchant Service listening at: http://localhost:${PORT}`);
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
