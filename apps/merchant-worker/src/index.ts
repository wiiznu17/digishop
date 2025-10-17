import express from "express";
import IORedis from "ioredis";
import { Queue } from "bullmq";
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

import { initDb } from "./db"; // เหมือนเดิม (checkDatabaseConnection/initModels)
import { ENV } from "./env";   // ต้องมี REDIS_URL, REFUND_QUEUE_NAME, CANCEL_QUEUE_NAME, COMPLETE_QUEUE_NAME

// Workers
import { startRefundWorker } from "./workers/autoApproveWorker";
import { startAutoCancelWorker } from "./workers/autoCancelWorker";
import { startAutoCompleteWorker } from "./workers/autoCompleteWorker";
import { startAutoRefreshToken } from "./workers/autoRefreshToken"

async function main() {
  await initDb();

  // Redis & Queues (ใช้ connection เดียว)
  const connection = new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null });

  const refundQueue   = new Queue(ENV.REFUND_QUEUE_NAME  || "refund-auto-approve", { connection });
  const cancelQueue   = new Queue(ENV.CANCEL_QUEUE_NAME  || "auto-cancel-unpaid",  { connection });
  const completeQueue = new Queue(ENV.COMPLETE_QUEUE_NAME|| "auto-complete",       { connection });
  const refreshTokenQueue = new Queue( ENV.REFRESH_TOKEN || "refresh-token", {connection})

  // Start workers 
  const refundW   = startRefundWorker(connection);
  // const cancelW   = startAutoCancelWorker(connection);
  const completeW = startAutoCompleteWorker(connection);
  const refreshW = startAutoRefreshToken(connection)

  // Bull Board
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [
      new BullMQAdapter(refundQueue),
      new BullMQAdapter(cancelQueue),
      new BullMQAdapter(completeQueue),
      new BullMQAdapter(refreshTokenQueue),
    ],
    serverAdapter,
  });

  const app = express();
  app.use("/admin/queues", serverAdapter.getRouter());
  app.get("/healthz", (_req, res) => res.json({ ok: true }));

  const port = Number(process.env.BULLBOARD_PORT || 3005);
  app.listen(port, () => {
    console.log(`Bull Board running on http://localhost:${port}/admin/queues`);
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────
  // const cw = await cancelW;
  async function shutdown() {
    try {
      // ปิด workers
      await Promise.allSettled([
        refundW.worker?.close(),  refundW.qe?.close(),
        // cw.worker?.close(),  cancelW.qe?.close(),
        completeW.worker?.close(),completeW.qe?.close(),
        refreshW.worker?.close(), refreshW.qe?.close()
      ]);
      // ปิด queues + redis
      await Promise.allSettled([
        refundQueue.close(),
        cancelQueue.close(),
        completeQueue.close(),
        refreshTokenQueue.close(),
        connection.quit(),
      ]);
    } finally {
      process.exit(0);
    }
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
