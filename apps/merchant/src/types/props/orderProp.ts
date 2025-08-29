export type ShippingType = "STANDARD" | "EXPRESS"

export type OrderStatus =
  | "PENDING" // รอการชำระเงิน
  | "PAID" // จ่ายเงินแล้ว (prepaid)
  | "PROCESSING" // ร้านกำลังเตรียมสินค้า
  | "READY_TO_SHIP" // เตรียมเสร็จ พร้อมส่ง
  | "HANDED_OVER" // ส่งมอบให้ขนส่งแล้ว
  | "SHIPPED" // บริษัทขนส่งรับของ/สแกนครั้งแรก
  | "DELIVERED" // ลูกค้าได้รับสินค้า
  | "COMPLETE" // ออเดอร์เสร็จสมบูรณ์
  | "CUSTOMER_CANCELED" // ลูกค้ายกเลิก
  | "MERCHANT_CANCELED" // ร้านค้าปฏิเสธ/ยกเลิกหลังลูกค้าจ่าย
  | "TRANSIT_LACK" // ปัญหาระหว่างขนส่ง
  | "RE_TRANSIT" // ส่งใหม่
  | "REFUND_REQUEST" // ลูกค้าขอคืนเงิน
  | "REFUND_REJECTED" // ร้านปฏิเสธการคืนเงิน
  | "AWAITING_RETURN" // รอสินค้าคืน
  | "RECEIVE_RETURN" // ร้านค้าได้รับสินค้าคืน
  | "RETURN_VERIFIED" // ร้านตรวจสอบสินค้าคืนแล้ว
  | "RETURN_FAIL" // คืนสินค้าไม่สำเร็จ
  | "REFUND_APPROVED" // ร้านอนุมัติคืนเงิน
  | "REFUND_PROCESSING" // กำลังคืนเงิน
  | "REFUND_SUCCESS" // คืนเงินสำเร็จ
  | "REFUND_FAIL" // คืนเงินล้มเหลว

export interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
}

export interface ShippingAddress {
  recipientName?: string
  phone?: string
  address_number?: string
  building?: string
  subStreet?: string
  street?: string
  subdistrict?: string
  district?: string
  province?: string
  postalCode?: string
  country?: string
}

export interface Order {
  id: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: ShippingAddress | null
  createdAt: string
  updatedAt?: string
  totalPrice: number
  shippingCost?: number
  tax?: number
  status: OrderStatus
  statusHistory?: OrderStatus[]
  paymentMethod?: string
  shippingType?: ShippingType
  trackingNumber?: string | null
  orderItems?: OrderItem[] // optional → ป้องกัน undefined
  notes?: string | null
  refundReason?: string | null
  refundAmount?: number | null
}
