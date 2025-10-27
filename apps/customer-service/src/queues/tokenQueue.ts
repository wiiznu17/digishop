import { delay, Queue } from "bullmq";
import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "";
const REFRESH_TOKEN = process.env.REFRESH_TOKEN || "sd";

export type RefreshTokenJob = {
 userId: number
 refreshToken: string
};

const connection = new IORedis(REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue<RefreshTokenJob>(REFRESH_TOKEN, { connection });

export async function enqueueRefreshToken(job: RefreshTokenJob) {
  return queue.add("refresh-token", job, {
    jobId: job.refreshToken ,
    backoff: { type: "exponential", delay: 5000 }, // delay retry after fail 5, 10, 15, ...
    removeOnComplete: true,
    removeOnFail: true,
    delay: 10 * 60 * 60 * 1000 // 10H
  });
}



