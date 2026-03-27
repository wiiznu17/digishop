import { AdminSystemLog } from '@digishop/db/src/models/portal/AdminSystemLog'

export async function writeAdminLog(
  req: any,
  action: string,
  targetEntity: string,
  targetId?: number,
  metadata?: any
) {
  const adminId = req.adminId ?? null
  await AdminSystemLog.create({
    adminId,
    action,
    targetEntity,
    targetId: targetId ?? null,
    correlationId: (req.headers['x-request-id'] as string) || null,
    ip: req.ip || null,
    userAgent: req.headers['user-agent'] || null,
    metadataJson: metadata ?? null,
    timestamp: new Date()
  } as any)
}
// in controller
// await writeAdminLog(req, 'PRODUCT.UPDATE', 'PRODUCT', product.id, { fieldsChanged });
