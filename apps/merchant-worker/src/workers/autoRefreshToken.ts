import { Worker, QueueEvents } from 'bullmq'
import IORedis from 'ioredis'
import { ENV } from '../env'
import { http, svcHeaders } from '../httpClient'
import { logger } from '../logger'

export type RefreshTokenJob = {
  userId: number
  refreshToken: string
}

export function startAutoRefreshToken(connection: IORedis) {
  const queueName = ENV.REFRESH_TOKEN
  const worker = new Worker<RefreshTokenJob>(
    queueName,
    async (job) => {
      console.log(`Refresh token expired and removed: ${job.data.refreshToken}`)
    },
    { connection, concurrency: ENV.CONCURRENCY }
  )

  const qe = new QueueEvents(queueName, { connection })
  qe.on('completed', ({ jobId, returnvalue }) =>
    logger.info({ jobId, returnvalue }, 'refresh-token completed')
  )
  qe.on('failed', ({ jobId, failedReason }) =>
    logger.error({ jobId, failedReason }, 'refresh-token failed')
  )

  return { worker, qe }
}
