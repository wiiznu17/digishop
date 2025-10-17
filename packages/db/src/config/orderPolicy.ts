export const OrderPolicy = {
  // Cancel ก่อนจ่าย
  cancelPendingHours: 24,

  // Cancel หลังจ่ายแต่ก่อน PROCESSING (ใช้กับ “cancel order” ไม่ใช่ refund)
  cancelAfterPaidBeforeProcessingMinutes: 30,

  // Refund request window (ใช้กับ delivered)
  refundFromDeliveredDays: 7,

  // Retry เฉพาะหลัง delivered
  refundMaxRetries: 3,
  refundRetryWindowDays: 7,
} as const;
