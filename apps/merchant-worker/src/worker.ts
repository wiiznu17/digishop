// apps/customer-service/src/worker/startRefundWorker.ts
import { Worker, QueueEvents, Queue, JobsOptions } from "bullmq";
import IORedis from "ioredis";
import { http, svcHeaders } from "./httpClient";
import { ENV } from "./env";
import { logger } from "./logger";

// DB
// import * as db from "@digishop/db";
import { OrderStatusHistory } from "@digishop/db/src/models/OrderStatusHistory";
import { RefundOrder } from "@digishop/db/src/models/RefundOrder";
import { RefundStatusHistory } from "@digishop/db/src/models/RefundStatusHistory";
import { OrderStatus, RefundStatus } from "@digishop/db/src/types/enum";
import { checkDatabaseConnection, initModels } from "@digishop/db";
import { sequelize } from "@digishop/db/src/db";

export type RefundJob = {
  orderId: number;
  requestedAt: string;
  correlationId?: string;
  reason?: string;
};

// ---------- Utils for logging ----------
const MAX_JSON = 800;
function safeJson(v: any) {
  try {
    const s = JSON.stringify(v);
    return s.length > MAX_JSON ? s.slice(0, MAX_JSON) + "…(truncated)" : s;
  } catch {
    return String(v);
  }
}
function redactHeaders(h: Record<string, any>) {
  const clone = { ...(h || {}) };
  if (clone.Authorization) clone.Authorization = "[redacted]";
  if (clone["X-API-Key"]) clone["X-API-Key"] = "[redacted]";
  if (clone["X-API-ID"]) clone["X-API-ID"] = "[redacted]";
  return clone;
}

export async function initDb() {
  logger.info(
    { scope: "initDb", node: process.version, env: { DB_URL: process.env.DB_URL ? "set" : "missing" } },
    "Connecting DB…"
  );
  await checkDatabaseConnection();
  initModels(sequelize);
  logger.info({ scope: "initDb" }, "DB connected");
}

function isRetryable(err: any): boolean {
  const status = err?.response?.status;
  if (!status) return true;       // network/timeout
  if (status >= 500) return true; // 5xx
  return false;                   // 4xx → ไม่ retry
}

function logHttpError(tag: string, err: any, ctx: Record<string, any> = {}) {
  const status = err?.response?.status;
  const data = err?.response?.data;
  const msg = err?.message || "unknown";
  logger.error(
    { tag, status, data: data ? safeJson(data) : null, msg, ...ctx },
    "HTTP error"
  );
}

export function startRefundWorker() {
  logger.info(
    {
      scope: "worker:start",
      ENV: {
        REDIS_URL: ENV.REDIS_URL,
        REFUND_QUEUE_NAME: ENV.REFUND_QUEUE_NAME,
        DLQ_NAME: process.env.REFUND_DLQ_NAME || `${ENV.REFUND_QUEUE_NAME}-dlq`,
        MERCHANT_BASE: ENV.MERCHANT_BASE,
        CONCURRENCY: ENV.CONCURRENCY
      }
    },
    "Starting refund worker"
  );

  const connection = new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null });
  connection.on("connect", () => logger.info({ scope: "redis" }, "Redis connected"));
  connection.on("error", (err) => logger.error({ scope: "redis", err: err?.message }, "Redis error"));
  connection.on("end", () => logger.error({ scope: "redis" }, "Redis connection ended"));

  const queueName = ENV.REFUND_QUEUE_NAME;

  // DLQ
  const dlqName = process.env.REFUND_DLQ_NAME || `${queueName}-dlq`;
  const dlq = new Queue<RefundJob>(dlqName, { connection });

  // ใช้ดึงรายละเอียด job ตอน failed
  const mainQueue = new Queue<RefundJob>(queueName, { connection });

  const worker = new Worker<RefundJob>(
    queueName,
    async (job) => {
      const startedAt = Date.now();
      const { orderId, correlationId, reason } = job.data;

      const attempt = job.attemptsMade + 1;
      const attempts = (job.opts as JobsOptions)?.attempts ?? 1;

      logger.info(
        {
          stage: "job:start",
          jobId: job.id,
          name: job.name,
          orderId,
          attempt,
          attempts,
          delay: job.delay,
          requestedAt: job.data?.requestedAt
        },
        "Job started"
      );

      // 1) ถ้าเคย DELIVERED แล้ว → ไม่ auto-approve
      logger.info({ stage: "query", query: "OrderStatusHistory.findOne(DELIVERED)", orderId }, "Query start");
      console.log("startttttt")
      const delivered = await OrderStatusHistory.findOne({
        where: { orderId, toStatus: OrderStatus.DELIVERED },
        order: [["created_at", "DESC"]],
      });
      console.log("query result = ", delivered)
      if (delivered) {
        console.log("query result = ", delivered) 
        const dt = Date.now() - startedAt;
        return { skipped: true, reason: "ALREADY_DELIVERED" };
      }

      // 2) ยืนยันว่าอยู่ใน REFUND_REQUEST จริง
      logger.info({ stage: "query", query: "OrderStatusHistory.findOne(last)", orderId }, "Query start");
      const last = await OrderStatusHistory.findOne({
        where: { orderId },
        order: [["created_at", "DESC"]],
      });
      const lastToStatus = (last?.get && last.get("toStatus")) || (last as any)?.toStatus || null;
      logger.info(
        {
          stage: "query:result",
          orderId,
          lastId: last?.get?.("id") ?? (last as any)?.id ?? null,
          lastToStatus
        },
        "Last status check"
      );
      if (!last || lastToStatus !== OrderStatus.REFUND_REQUEST) {
        const dt = Date.now() - startedAt;
        logger.info(
          { stage: "guard:return", jobId: job.id, orderId, dt, lastToStatus },
          "Skip (not in REFUND_REQUEST)"
        );
        return { skipped: true, reason: "NOT_REFUND_REQUEST" };
      }

      // 3) เรียก merchant-service เปลี่ยนเป็น REFUND_APPROVED
      try {
        const url = `/api/merchant/orders/${orderId}`;
        const headers = svcHeaders(correlationId ?? String(job.id));
        logger.info(
          {
            stage: "http:call",
            jobId: job.id,
            orderId,
            method: "PATCH",
            url,
            headers: redactHeaders(headers)
          },
          "Calling merchant-service"
        );

        const t0 = Date.now();
        const res = await http.patch(
          url,
          { status: "REFUND_APPROVED", reason: reason ?? "Auto-approve by worker (requested before delivery)" },
          { headers }
        );
        const t1 = Date.now();

        const dt = Date.now() - startedAt;
        logger.info(
          {
            stage: "http:ok",
            jobId: job.id,
            orderId,
            httpStatus: res.status,
            latencyMs: t1 - t0,
            totalMs: dt,
            resPreview: safeJson(res.data)
          },
          "Auto-approved OK"
        );
        return res.data;
      } catch (err: any) {
        const dt = Date.now() - startedAt;

        if (isRetryable(err)) {
          logHttpError("merchant-auto-approve-retryable", err, {
            stage: "http:error:retryable",
            jobId: job.id,
            orderId,
            totalMs: dt
          });
          // ให้ BullMQ retry ตาม attempts/backoff
          throw err;
        }

        // Non-retryable → log RefundStatusHistory เพื่อ manual follow-up
        logHttpError("merchant-auto-approve-non-retryable", err, {
          stage: "http:error:non-retryable",
          jobId: job.id,
          orderId,
          totalMs: dt
        });

        logger.info({ stage: "query", query: "RefundOrder.findOne", orderId }, "Query start");
        const refund = await RefundOrder.findOne({ where: { orderId } });
        logger.info({ stage: "query:result", refundId: refund?.get?.("id") ?? null, orderId }, "RefundOrder result");

        if (refund) {
          logger.info(
            {
              stage: "db:insert",
              table: "RefundStatusHistory",
              refundId: refund.id,
              orderId
            },
            "Create RefundStatusHistory (non-retryable)"
          );
          await RefundStatusHistory.create({
            refundOrderId: refund.id,
            fromStatus: RefundStatus.REQUESTED,
            toStatus: RefundStatus.REQUESTED, // คงสถานะเดิม แต่มี log
            reason: `Auto-approve failed (non-retryable): ${err?.response?.data?.error ?? err?.message}`,
            changedByType: "SYSTEM",
            source: "WORKER",
            correlationId: correlationId ?? String(job.id),
            metadata: { resp: err?.response?.data ?? null },
          } as any);
          logger.info({ stage: "db:insert:ok", refundId: refund.id, orderId }, "RefundStatusHistory created");
        }

        return { skipped: true, reason: "NON_RETRYABLE", status: err?.response?.status };
      }
    },
    { connection, concurrency: ENV.CONCURRENCY }
  );

  // ---------- Worker lifecycle logs ----------
  worker.on("active", (job) => {
    logger.info(
      { stage: "worker:event", event: "active", jobId: job.id, name: job.name, orderId: job.data?.orderId, attempt: job.attemptsMade + 1 },
      "Worker active"
    );
  });

  worker.on("completed", (job, result) => {
    logger.info({ stage: "worker:event", event: "completed", jobId: job.id, orderId: job.data?.orderId, result }, "Worker completed");
  });

  worker.on("failed", (job, err) => {
    logger.error(
      { stage: "worker:event", event: "failed", jobId: job?.id, orderId: job?.data?.orderId, err: err?.message },
      "Worker failed (will retry if attempts left)"
    );
  });

  worker.on("stalled", (jobId) => {
    logger.error({ stage: "worker:event", event: "stalled", jobId }, "Worker stalled");
  });

  worker.on("error", (err) => logger.error({ stage: "worker:event", event: "error", err }, "Worker error"));

  const qe = new QueueEvents(queueName, { connection });

  // ---------- QueueEvents logs (timeline of jobs) ----------
  qe.on("waiting", ({ jobId }) => logger.info({ stage: "queue:event", event: "waiting", jobId }, "Queue waiting"));
  qe.on("active", ({ jobId, prev }) => logger.info({ stage: "queue:event", event: "active", jobId, prev }, "Queue active"));
  qe.on("progress", ({ jobId, data }) => logger.info({ stage: "queue:event", event: "progress", jobId, data }, "Queue progress"));
  qe.on("delayed", ({ jobId, delay }) => logger.info({ stage: "queue:event", event: "delayed", jobId, delay }, "Queue delayed"));
  qe.on("completed", ({ jobId, returnvalue }) => logger.info({ stage: "queue:event", event: "completed", jobId, returnvalue }, "Queue completed"));

  // failed (รวม retry ครบ) → DLQ + เขียน history ว่าล้มเหลวถาวร
  qe.on("failed", async ({ jobId, failedReason, prev }) => {
    try {
      const job = await mainQueue.getJob(jobId);
      if (!job) {
        logger.error({ stage: "queue:event", event: "failed", jobId }, "Failed but job not found");
        return;
      }
      const attemptsMade = job.attemptsMade ?? 0;
      const maxAttempts = (job.opts as JobsOptions)?.attempts ?? 1;

      logger.error(
        { stage: "queue:event", event: "failed", jobId, orderId: job.data?.orderId, attemptsMade, maxAttempts, failedReason, prev },
        "Queue failed"
      );

      if (attemptsMade >= maxAttempts) {
        logger.error({ stage: "dlq", action: "move", jobId, attemptsMade, failedReason }, "Move to DLQ");
        await dlq.add("dead", job.data, {
          // ห้าม ':' ใน jobId
          jobId: `dead-${job.id}`,
          removeOnComplete: true,
        });

        const refund = await RefundOrder.findOne({ where: { orderId: job.data.orderId } });
        if (refund) {
          logger.info(
            { stage: "db:insert", table: "RefundStatusHistory", refundId: refund.id, orderId: job.data.orderId },
            "Create RefundStatusHistory (DLQ)"
          );
          await RefundStatusHistory.create({
            refundOrderId: refund.id,
            fromStatus: RefundStatus.REQUESTED,
            toStatus: RefundStatus.REQUESTED, // คง status เดิมไว้
            reason: `Auto-approve permanently failed after retries: ${failedReason ?? "unknown"}`,
            changedByType: "SYSTEM",
            source: "WORKER",
            correlationId: job.data.correlationId ?? String(jobId),
            metadata: { attemptsMade, prev, failedReason },
          } as any);
          logger.info({ stage: "db:insert:ok", refundId: refund.id, orderId: job.data.orderId }, "Logged DLQ history");
        }
      }
    } catch (e: any) {
      logger.error({ stage: "queue:event", event: "failed:handler-error", jobId, err: e?.message }, "failed-event handler error");
    }
  });

  // Graceful shutdown logs
  const close = async () => {
    logger.info({ scope: "worker:shutdown" }, "Shutting down…");
    await Promise.allSettled([
      worker.close(),
      qe.close(),
      mainQueue.close(),
      dlq.close(),
      connection.quit(),
    ]);
    logger.info({ scope: "worker:shutdown" }, "Shutdown complete");
  };

  process.on("SIGINT", () => { logger.info({ signal: "SIGINT" }, "Signal received"); close(); });
  process.on("SIGTERM", () => { logger.info({ signal: "SIGTERM" }, "Signal received"); close(); });

  return { worker, qe, close };
}
