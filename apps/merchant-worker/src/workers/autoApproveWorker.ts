import { Worker, QueueEvents, Queue, JobsOptions } from 'bullmq'
import IORedis from 'ioredis'
import { http, svcHeaders } from '../httpClient'
import { ENV } from '../env'
import { logger } from '../logger'
import {
  OrderStatus,
  OrderStatusHistory,
  RefundOrder,
  RefundStatus,
  RefundStatusHistory,
  sequelize
} from '@digishop/db'

export type RefundJob = {
  orderId: number
  requestedAt: string
  correlationId?: string
  reason?: string
}

function isRetryable(err: any): boolean {
  const status = err?.response?.status
  if (!status) return true
  if (status >= 500) return true
  return false
}

export function startRefundWorker(connection: IORedis) {
  // const connection = new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null });
  const queueName = ENV.REFUND_QUEUE_NAME
  const dlqName = process.env.REFUND_DLQ_NAME || `${queueName}-dlq`
  const dlq = new Queue<RefundJob>(dlqName, { connection })
  const mainQueue = new Queue<RefundJob>(queueName, { connection })

  const worker = new Worker<RefundJob>(
    queueName,
    async (job) => {
      const { orderId, correlationId, reason } = job.data
      console.log('hi')
      console.log(
        'OSH.sequelize === db ?',
        OrderStatusHistory.sequelize === sequelize
      )
      console.log('OSH table:', OrderStatusHistory.getTableName?.())
      // console.log("hi", orderId)
      // ข้ามถ้าเคย DELIVERED
      const delivered = await OrderStatusHistory.findOne({
        where: { orderId, toStatus: OrderStatus.DELIVERED },
        order: [['created_at', 'DESC']]
      })
      if (delivered) return { skipped: true, reason: 'ALREADY_DELIVERED' }

      // ต้องอยู่ใน REFUND_REQUEST
      const last = await OrderStatusHistory.findOne({
        where: { orderId },
        order: [['created_at', 'DESC']]
      })
      if (!last || last.get('toStatus') !== OrderStatus.REFUND_REQUEST) {
        return { skipped: true, reason: 'NOT_REFUND_REQUEST' }
      }

      // เรียก merchant-service → REFUND_APPROVED
      try {
        const res = await http.patch(
          `/api/merchant/orders/${orderId}`,
          {
            status: 'REFUND_APPROVED',
            reason:
              reason ?? 'Auto-approve by worker (requested before delivery)'
          },
          { headers: svcHeaders(correlationId ?? String(job.id)) }
        )
        logger.info(
          { jobId: job.id, orderId, status: res.data?.data?.status },
          'refund auto-approved'
        )
        return res.data
      } catch (err: any) {
        if (isRetryable(err)) throw err // ให้ retry

        // non-retryable บันทึก history ไว้ให้ manual
        const refund = await RefundOrder.findOne({ where: { orderId } })
        if (refund) {
          await RefundStatusHistory.create({
            refundOrderId: refund.id,
            fromStatus: RefundStatus.REQUESTED,
            toStatus: RefundStatus.REQUESTED,
            reason: `Auto-approve failed (non-retryable): ${err?.response?.data?.error ?? err?.message}`,
            changedByType: 'SYSTEM',
            source: 'WORKER',
            correlationId: correlationId ?? String(job.id),
            metadata: { resp: err?.response?.data ?? null }
          } as any)
        }
        return {
          skipped: true,
          reason: 'NON_RETRYABLE',
          status: err?.response?.status
        }
      }
    },
    { connection, concurrency: ENV.CONCURRENCY }
  )

  const qe = new QueueEvents(queueName, { connection })

  qe.on('completed', ({ jobId }) =>
    logger.info({ jobId }, 'refund job completed')
  )
  qe.on('failed', async ({ jobId, failedReason }) => {
    const job = await mainQueue.getJob(jobId)
    if (!job) return
    const attemptsMade = job.attemptsMade ?? 0
    const maxAttempts = (job.opts as JobsOptions)?.attempts ?? 1
    if (attemptsMade >= maxAttempts) {
      await dlq.add('dead', job.data, {
        jobId: `dead-${job.id}`,
        removeOnComplete: true
      })
      logger.error({ jobId, failedReason }, 'refund job moved to DLQ')
    }
  })

  return { worker, qe }
}
