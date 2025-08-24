export type ShippingType = "STANDARD" | "EXPRESS"

export type OrderStatus =
  | "PENDING" // รอการชำระเงิน
  | "PAID" // ชำระเงินแล้ว
  | "PROCESSING" // กำลังเตรียมสินค้า
  | "READY_TO_SHIP" // พร้อมส่ง
  | "SHIPPED" // จัดส่งแล้ว
  | "DELIVERED" // ส่งถึงลูกค้าแล้ว
  | "COMPLETE" // ลูกค้ายืนยันรับสินค้า / ออเดอร์เสร็จสมบูรณ์
  | "CUSTOMER_CANCELED" // ลูกค้ายกเลิกก่อนจ่ายเงิน
  | "MERCHANT_REJECT" // ร้านค้าปฏิเสธ/ยกเลิกออเดอร์ หลังจากลูกค้าจ่ายเงิน
  // --- สถานะการขนส่งที่มีปัญหา ---
  | "TRANSIT_LACK" // การจัดส่งมีปัญหา
  | "RE_TRANSIT" // กำลังจัดส่งใหม่
  // --- สถานะการคืนเงิน/คืนสินค้า ---
  | "REFUND_REQUEST" // ลูกค้ากดยกเลิกหลังจากจ่ายเงินแล้ว, หรือหลังได้รับสินค้าแล้วขอคืนสินค้าและร้องขอคืนเงิน
  | "AWAITING_RETURN" // รอสินค้่าส่งคืนจากลูกค้า
  | "RECEIVE_RETURN" // ร้านค้าได้รับสินค้าคืนแล้ว (รอตรวจสอบ)
  | "RETURN_VERIFIED" // ร้านค้าตรวจสอบสินค้าคืนแล้ว ตอนนี้ยังไม่มีกรณีไม่ยอมรับสินค้า
  | "RETURN_FAIL" // การส่งคืนล้มเหลว เนื่องจากลูกค้าไม่ทำการจัดส่งภายในเวลากำหนด
  | "REFUND_APPROVED" // อนุมัติการคืนเงิน
  | "REFUND_SUCCESS" // คืนเงินสำเร็จ
  | "REFUND_FAIL" // การคืนเงินล้มเหลว

export interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
}
export interface ShippingAddress {
  recipientName: string
  phone: string
  address_number?: string
  building?: string
  subStreet?: string
  street: string
  subdistrict?: string
  district: string
  province: string
  postalCode: string
  country: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: ShippingAddress
  createdAt: string
  updatedAt?: string
  totalPrice: number
  shippingCost: number
  tax: number
  status: OrderStatus // สถานะปัจจุบัน
  statusHistory: OrderStatus[]
  paymentMethod: string
  shippingType?: ShippingType
  trackingNumber?: string
  orderitems: OrderItem[]
  notes?: string
  // --- ข้อมูลเกี่ยวกับการคืนเงิน ---
  refundReason?: string
  refundAmount?: number
}
