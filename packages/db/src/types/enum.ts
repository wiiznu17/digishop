export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
}

export enum ActorType {
  CUSTOMER = 'CUSTOMER',
  MERCHANT = 'MERCHANT',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM'
}

export enum AddressType {
  HOME = 'HOME',
  OFFICE = 'OFFICE',
}

export enum StoreStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BANNED = 'BANNED',
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  BANNED = 'BANNED',
}

/**
 * NOTE:
 * - เดิมโค้ดกำหนดค่าไม่ตรงชื่อคีย์ (APPROVED='VERIFIED', BANNED='FAILED')
 * - แก้ให้ค่าตรงคีย์ก่อน (ลด breaking change)
 * - แนะนำในอนาคตพิจารณาเปลี่ยนชื่อคีย์เป็น VERIFIED/FAILED ให้สื่อความหมายกว่า
 */
export enum BankAccountStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED'
}

export enum ShippingType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
}

export enum ProductStatus {
  // สำหรับสภาวะ "ขาย/ไม่ขาย" ของสินค้า
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum ProductReqStatus {
  // แก้ไข/เพิ่มสินค้า ต้องรอ admin approve
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECT = 'REJECT' // REJECTED soon
}

export enum OrderStatus {
  PENDING = 'PENDING',                   // ลูกค้ายังไม่จ่าย
  CUSTOMER_CANCELED = 'CUSTOMER_CANCELED',
  PAID = 'PAID',                         // จ่ายแล้ว (prepaid)
  MERCHANT_CANCELED = 'MERCHANT_CANCELED',

  PROCESSING = 'PROCESSING',             // ร้านเตรียมสินค้า
  READY_TO_SHIP = 'READY_TO_SHIP',       // พร้อมส่ง
  HANDED_OVER = 'HANDED_OVER',           // ส่งมอบให้ขนส่งแล้ว ShippingStatus.READY_TO_SHIP
  SHIPPED = 'SHIPPED',                   // ขนส่งรับของ ShippingStatus.IN_TRANSIT
  DELIVERED = 'DELIVERED',               // ลูกค้าได้รับแล้ว ShippingStatus.DELIVERED
  COMPLETE = 'COMPLETE',                // ออเดอร์จบ (ยืนยันแล้ว)

  TRANSIT_LACK = 'TRANSIT_LACK',         // ปัญหาระหว่างขนส่ง ShippingStatus.TRANSIT_ISSUE
  RE_TRANSIT = 'RE_TRANSIT',             // ส่งใหม่ ShippingStatus.RE_TRANSIT

  // Return/Refund lifecycle (ตามนโยบายตอนนี้ยังไม่ทำ partial)
  REFUND_REQUEST = 'REFUND_REQUEST',
  REFUND_REJECTED = 'REFUND_REJECTED',
  AWAITING_RETURN = 'AWAITING_RETURN', // ShippingStatus.RETURN_TO_SENDER_IN_TRANSIT
  RECEIVE_RETURN = 'RECEIVE_RETURN', // ShippingStatus.RETURNED_TO_SENDER
  RETURN_VERIFIED = 'RETURN_VERIFIED',
  RETURN_FAIL = 'RETURN_FAIL', // ShippingStatus.DELIVERY_FAILED

  REFUND_APPROVED = 'REFUND_APPROVED',
  REFUND_PROCESSING = 'REFUND_PROCESSING',
  REFUND_SUCCESS = 'REFUND_SUCCESS',
  REFUND_FAIL = 'REFUND_FAIL',
  REFUND_RETRY = 'REFUND_RETRY',
}

export enum ShippingStatus {
  PENDING = 'PENDING',                                   // ยังไม่ส่ง
  READY_TO_SHIP = 'READY_TO_SHIP',                       // พร้อมส่ง
  IN_TRANSIT = 'IN_TRANSIT',                             // ระหว่างขนส่ง
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',                 // กำลังออกไปส่ง
  DELIVERED = 'DELIVERED',                               // ส่งสำเร็จ

  DELIVERY_FAILED = 'DELIVERY_FAILED',                   // ส่งไม่สำเร็จ (เช่น ไม่พบผู้รับ)
  RETURN_TO_SENDER_IN_TRANSIT = 'RETURN_TO_SENDER_IN_TRANSIT', // ตีกลับระหว่างทาง
  RETURNED_TO_SENDER = 'RETURNED_TO_SENDER',             // กลับถึงผู้ส่งแล้ว

  TRANSIT_ISSUE = 'TRANSIT_ISSUE',                       // ปัญหาระหว่างขนส่ง (จับทุกกรณี)
  RE_TRANSIT = 'RE_TRANSIT',                             // ส่งใหม่ (ถ้าต้องเริ่มรอบใหม่)
  // CUSTOMER_REJECT
}

export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum RefundStatus {
  REQUESTED = 'REQUESTED',
  APPROVED = 'APPROVED',
  SUCCESS = 'SUCCESS',
  FAIL = 'FAIL',
  CANCELED = 'CANCELED',
}

export enum PaymentType {
  FULL = 'FULL',
  INSTALLMENT = 'INSTALLMENT',
  QR_PP_TAG30 = 'QR_PP_TAG30',
  QR_CS = 'QR_CS',
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  QR = 'QR',
  PROMPTPAY = 'PROMPTPAY',
  // CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}

export enum ReturnShipmentStatus {
  AWAITING_DROP = 'AWAITING_DROP',             // รอลูกค้าส่งของคืน/รอรับเข้าระบบขากลับ
  RETURN_IN_TRANSIT = 'RETURN_IN_TRANSIT',     // ระหว่างขนส่งขากลับ
  DELIVERED_BACK = 'DELIVERED_BACK',           // คืนถึงร้าน/คลังแล้ว
  RETURN_FAILED = 'RETURN_FAILED',             // ขากลับล้มเหลว
}
