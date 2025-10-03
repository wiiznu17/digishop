import { startRefundWorker } from "./workers/autoApproveWorker";
import express from "express";
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { initDb } from "./db";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379");
const queue = new Queue("refund-auto-approve", { connection });

const serverAdapter = new ExpressAdapter();
// serverAdapter.setBasePath("/admin/queues");

async function main() {
  await initDb();
  startRefundWorker();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(queue)],
    serverAdapter,
  });

  const app = express();
  app.use("/admin/queues", serverAdapter.getRouter());

  app.listen(3005, () => {
    console.log("Bull Board running on http://localhost:3005/admin/queues");
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
