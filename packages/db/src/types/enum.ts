// src/models/enums.ts
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

export enum BankAccountStatus {
  PENDING = 'PENDING',
  APPROVED = 'VERIFIED',
  BANNED = 'FAILED',
}

export enum ShippingType {
  STANDARD = 'STANDARD',
  EXPRESS = 'EXPRESS',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  OUT_OF_STOCK = 'OUT_OF_STOCK'
}

export enum OrderStatus {
  PENDING = "PENDING",                  // รอการชำระเงิน (ลูกค้ายังไม่ได้จ่าย)
  CUSTOMER_CANCELED = "CUSTOMER_CANCELED", // ลูกค้ายกเลิกเองก่อนจ่าย
  PAID = "PAID",                        // ชำระเงินแล้ว (prepaid)
  MERCHANT_CANCELED = "MERCHANT_CANCELED", // ร้านค้าปฏิเสธ/ยกเลิกหลังชำระ
  PROCESSING = "PROCESSING",            // ร้านค้ากำลังเตรียมสินค้า
  READY_TO_SHIP = "READY_TO_SHIP",      // ร้านค้าเตรียมเสร็จ พร้อมส่ง
  HANDED_OVER = "HANDED_OVER",          // ร้านค้าส่งมอบพัสดุให้ขนส่งแล้ว
  SHIPPED = "SHIPPED",                  // บริษัทขนส่งรับของ / แสกนครั้งแรก
  DELIVERED = "DELIVERED",              // ลูกค้าได้รับสินค้า
  COMPLETE = "COMPLETE",                // ออเดอร์เสร็จสมบูรณ์ (ลูกค้ายืนยันแล้ว)

  TRANSIT_LACK = "TRANSIT_LACK",        // ปัญหาระหว่างขนส่ง
  RE_TRANSIT = "RE_TRANSIT",            // ส่งใหม่อีกครั้ง

  REFUND_REQUEST = "REFUND_REQUEST",    // ลูกค้าขอคืนเงิน
  REFUND_REJECTED = "REFUND_REJECTED",    // ร้านค้าปฏิเสธการคืนเงิน
  AWAITING_RETURN = "AWAITING_RETURN",  // รอการส่งสินค้าคืน
  RECEIVE_RETURN = "RECEIVE_RETURN",    // ร้านค้าได้รับสินค้าคืน
  RETURN_VERIFIED = "RETURN_VERIFIED",  // ร้านค้าตรวจสอบสินค้าคืนแล้ว
  RETURN_FAIL = "RETURN_FAIL",          // การคืนสินค้าล้มเหลว

  REFUND_APPROVED = "REFUND_APPROVED",  // ร้านค้าอนุมัติการคืนเงิน
  REFUND_PROCESSING = "REFUND_PROCESSING", // กำลังคืนเงิน (อยู่ระหว่างดำเนินการ)
  REFUND_SUCCESS = "REFUND_SUCCESS",    // คืนเงินสำเร็จ (API provider success)
  REFUND_FAIL = "REFUND_FAIL",          // คืนเงินล้มเหลว (API provider fail)
}


export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum RefundStatus {
  REQUESTED = "REQUESTED",
  APPROVED  = "APPROVED",
  SUCCESS   = "SUCCESS",
  FAIL      = "FAIL",
  CANCELED  = "CANCELED",
}


export enum ShippingStatus {
  PENDING = 'PENDING',
  RECIEVE_PARCEL = 'RECIEVE_PARCEL',
  IN_TRANSIT = 'IN_TRANSIT',
  CUSTOMER_REJECT = 'CUSTOMER_REJECT',
  TRANSIT_ISSUE = 'TRANSIT_ISSUE',
  RE_TRANSIT = 'RE_TRANSIT',
  DELIVERED = 'DELIVERED',
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
export enum paymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  QR = 'QR',
  PROMPTPAY = 'PROMPTPAY',
  // CASH_ON_DELIVERY = 'CASH_ON_DELIVERY'
}