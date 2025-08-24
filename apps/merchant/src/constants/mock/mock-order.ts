// /constants/mock/mock-order.ts
import { Order, OrderStatus, ShippingType } from "@/types/props/orderProp"

/**
 * Mock Generator (deterministic)
 * - ใช้ PRNG แบบมี seed (mulberry32)
 * - ใช้ anchor date คงที่แทน Date.now()
 * - ตัด statusHistory หลังสถานะสิ้นสุด (รวม RETURN_FAIL)
 * - ครอบคลุม flows: A–G + variants (loops/retry)
 */

// ---------------------- deterministic helpers ----------------------
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(123456789) // 👈 seed คงที่

const ANCHOR = new Date("2025-08-01T00:00:00.000Z") // 👈 anchor date คงที่
const daysAgo = (d: number) =>
  new Date(ANCHOR.getTime() - d * 86400000).toISOString()

let idSeq = 2000
let liSeq = 1
const nextId = () => `ORD-${idSeq++}`
const nextLineId = () => `LI-${liSeq++}`

const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const THB = (n: number) => n

const names = [
  "Alice Lim",
  "Boonchai Prasert",
  "Chanida Wong",
  "Darin K.",
  "Ekachai S.",
  "Fon Mee",
  "Gawin Thep",
  "Hathai S.",
  "Ittipol K.",
  "Janya P.",
  "Korn P.",
  "Lalisa M.",
  "Monrudee C.",
  "Nirut J.",
  "Orawan P.",
  "Pranee T.",
  "Q Boon",
  "Ratchanon Y.",
  "Sasithorn K.",
  "Tanakorn V.",
  "Uthai R.",
  "Vasana L.",
  "Wanwisa J.",
  "X Chai",
  "Yupa N.",
  "Zara K."
]
const streets = [
  "Sukhumvit 11",
  "Rama 9 Rd.",
  "Ratchada",
  "Ladprao",
  "Phahonyothin",
  "Sri Ayutthaya",
  "Sathorn",
  "Rama 2",
  "Srinakarin",
  "Rattanathibet",
  "Pinklao",
  "Ratchaphruek",
  "Chiang Mai Rd.",
  "Khon Kaen Rd.",
  "Phuket Rd."
]

const items = [
  { name: "Notebook", sku: "NB-01", price: 1530 },
  { name: "Bluetooth Speaker", sku: "SPK-10", price: 2940 },
  { name: "Phone Case", sku: "CASE-XS", price: 850 },
  { name: "Robot Vacuum", sku: "VAC-ROBO", price: 15820 },
  { name: "Kettle", sku: "KET-01", price: 2130 },
  { name: "Air Fryer", sku: "AIR-01", price: 4500 },
  { name: "Printer", sku: "PRN-02", price: 3200 },
  { name: "Desk Lamp", sku: "LMP-01", price: 1259 },
  { name: "Router", sku: "RTR-AC", price: 2539 },
  { name: 'Monitor 24"', sku: "MON-24", price: 3440 },
  { name: "Gaming Chair", sku: "CHAIR-G", price: 5910 },
  { name: "Fitness Band", sku: "FIT-01", price: 1250 },
  { name: "Air Filter", sku: "FIL-AP", price: 1075 },
  { name: "Smart Plug", sku: "PLG-WF", price: 1450 },
  { name: "Dehumidifier", sku: "DH-12L", price: 3220 }
]

// คำนวณค่า order จาก line items
const calcTotals = (lines: { price: number; quantity: number }[]) => {
  const subtotal = lines.reduce((s, l) => s + l.price * l.quantity, 0)
  const shippingCost = subtotal > 3000 ? 0 : 50
  const tax = 0
  return { totalPrice: subtotal + shippingCost + tax, shippingCost, tax }
}

const makeLineItems = (max = 2) => {
  const count = 1 + Math.floor(rand() * max)
  return Array.from({ length: count }, () => {
    const it = pick(items)
    const qty = 1 + Math.floor(rand() * 2)
    return {
      id: nextLineId(),
      name: it.name,
      sku: it.sku,
      quantity: qty,
      price: it.price
    }
  })
}

const makeAddress = (customerName: string, phone: string) => ({
  recipientName: customerName,
  phone,
  street: `${Math.floor(rand() * 200) + 1} ${pick(streets)}`,
  district: "Mueang",
  province: "Bangkok",
  postalCode: "10110",
  country: "TH"
})

const trackNum = (type: ShippingType, id: string) =>
  `TH-${type === "EXPRESS" ? "EXP" : "STD"}-${id.slice(-6)}`

// ---------------------- flows ----------------------
// ทุกฟังก์ชันคืนค่า statusHistory พร้อม "สถานะปัจจุบัน" (ตัวสุดท้าย)
const flowA_CancelBeforePay = (): OrderStatus[] => [
  "PENDING",
  "CUSTOMER_CANCELED"
]

const flowB_Normal = (terminal = true): OrderStatus[] => {
  const path: OrderStatus[] = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED"
  ]
  return terminal ? [...path, "COMPLETE"] : path
}
// helper: cut timeline until a given stop status
const flowB_Until = (stop: OrderStatus): OrderStatus[] => {
  const base: OrderStatus[] = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED",
    "COMPLETE"
  ]
  const idx = base.indexOf(stop)
  return idx >= 0 ? base.slice(0, idx + 1) : base
}

const flowC_TransitLoop = (loops = 1, terminal = true): OrderStatus[] => {
  const base: OrderStatus[] = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "READY_TO_SHIP",
    "SHIPPED"
  ]
  for (let i = 0; i < loops; i++)
    base.push("TRANSIT_LACK", "RE_TRANSIT", "SHIPPED")
  return terminal
    ? [...base, "DELIVERED", "COMPLETE"]
    : [...base, "TRANSIT_LACK", "RE_TRANSIT"]
}

const flowD_MerchantReject = (retry = false): OrderStatus[] =>
  retry
    ? ["PENDING", "PAID", "MERCHANT_REJECT", "REFUND_FAIL", "REFUND_SUCCESS"]
    : ["PENDING", "PAID", "MERCHANT_REJECT", "REFUND_SUCCESS"]

const flowE_RefundFromPaid = (retry = false): OrderStatus[] =>
  retry
    ? [
        "PENDING",
        "PAID",
        "REFUND_REQUEST",
        "REFUND_APPROVED",
        "REFUND_FAIL",
        "REFUND_SUCCESS"
      ]
    : ["PENDING", "PAID", "REFUND_REQUEST", "REFUND_APPROVED", "REFUND_SUCCESS"]

const flowF_RefundAfterDelivered = (retry = false): OrderStatus[] =>
  retry
    ? [
        "PENDING",
        "PAID",
        "PROCESSING",
        "READY_TO_SHIP",
        "SHIPPED",
        "DELIVERED",
        "REFUND_REQUEST",
        "AWAITING_RETURN",
        "RECEIVE_RETURN",
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_FAIL",
        "REFUND_SUCCESS"
      ]
    : [
        "PENDING",
        "PAID",
        "PROCESSING",
        "READY_TO_SHIP",
        "SHIPPED",
        "DELIVERED",
        "REFUND_REQUEST",
        "AWAITING_RETURN",
        "RECEIVE_RETURN",
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_SUCCESS"
      ]

const flowF_ReturnFail = (): OrderStatus[] => [
  "PENDING",
  "PAID",
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "REFUND_REQUEST",
  "AWAITING_RETURN",
  "RETURN_FAIL"
]

const flowG_RefusedAtDoor = (
  retry = false,
  withTransitLoop = false,
  loops = 1
): OrderStatus[] => {
  const base: OrderStatus[] = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "READY_TO_SHIP",
    "SHIPPED"
  ]
  if (withTransitLoop) {
    for (let i = 0; i < loops; i++)
      base.push("TRANSIT_LACK", "RE_TRANSIT", "SHIPPED")
  }
  return retry
    ? [
        ...base,
        "AWAITING_RETURN",
        "RECEIVE_RETURN",
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_FAIL",
        "REFUND_SUCCESS"
      ]
    : [
        ...base,
        "AWAITING_RETURN",
        "RECEIVE_RETURN",
        "RETURN_VERIFIED",
        "REFUND_APPROVED",
        "REFUND_SUCCESS"
      ]
}

const flowG_ReturnFail = (
  withTransitLoop = false,
  loops = 1
): OrderStatus[] => {
  const base: OrderStatus[] = [
    "PENDING",
    "PAID",
    "PROCESSING",
    "READY_TO_SHIP",
    "SHIPPED"
  ]
  if (withTransitLoop) {
    for (let i = 0; i < loops; i++)
      base.push("TRANSIT_LACK", "RE_TRANSIT", "SHIPPED")
  }
  return [...base, "AWAITING_RETURN", "RETURN_FAIL"]
}

// ---------------------- order factory ----------------------
type FlowKind =
  | "A_CANCEL"
  | "B_OK"
  | "B_PROGRESS"
  | "B_UNTIL_PENDING"
  | "B_UNTIL_PAID"
  | "B_UNTIL_PROCESSING"
  | "B_UNTIL_READY_TO_SHIP"
  | "B_UNTIL_SHIPPED"
  | "C_LOOP_OK"
  | "C_LOOP_PROGRESS"
  | "D_REJECT_OK"
  | "D_REJECT_RETRY"
  | "E_REFUND_OK"
  | "E_REFUND_RETRY"
  | "F_REFUND_OK"
  | "F_REFUND_RETRY"
  | "F_RETURN_FAIL"
  | "G_DOOR_REFUND_OK"
  | "G_DOOR_REFUND_RETRY"
  | "G_DOOR_RETURN_FAIL"
  | "G_DOOR_LOOP_REFUND_OK"
  | "G_DOOR_LOOP_REFUND_RETRY"
  | "G_DOOR_LOOP_RETURN_FAIL"

interface BuildOpts {
  flow: FlowKind
  loops?: number
  shippingType?: ShippingType
  createdDaysAgo?: number
}

const TERMINALS: OrderStatus[] = [
  "COMPLETE",
  "CUSTOMER_CANCELED",
  "MERCHANT_REJECT",
  "REFUND_SUCCESS",
  "REFUND_FAIL",
  "RETURN_FAIL" // 👈 terminal ใหม่
]

// manual lastIndexWhere (รองรับ env ที่ไม่มี findLastIndex)
const lastIndexWhere = <T>(arr: T[], pred: (x: T) => boolean) => {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i
  return -1
}

function buildOrder(opts: BuildOpts): Order {
  const id = nextId()
  const customerName = pick(names)
  const phone = `08${String(Math.floor(10000000 + rand() * 89999999)).padStart(8, "0")}`
  const email = `${customerName.split(" ")[0].toLowerCase()}${id.slice(-3)}@example.com`
  const addr = makeAddress(customerName, phone)
  const lineItems = makeLineItems()
  const totals = calcTotals(lineItems)

  // เส้นทางตาม flow
  let history: OrderStatus[] = []
  switch (opts.flow) {
    case "A_CANCEL":
      history = flowA_CancelBeforePay()
      break
    case "B_OK":
      history = flowB_Normal(true)
      break
    case "B_PROGRESS":
      history = flowB_Normal(false)
      break
    // Build switch
    case "B_UNTIL_PENDING":
      history = flowB_Until("PENDING")
      break
    case "B_UNTIL_PAID":
      history = flowB_Until("PAID")
      break
    case "B_UNTIL_PROCESSING":
      history = flowB_Until("PROCESSING")
      break
    case "B_UNTIL_READY_TO_SHIP":
      history = flowB_Until("READY_TO_SHIP")
      break
    case "B_UNTIL_SHIPPED":
      history = flowB_Until("SHIPPED")
      break
    case "C_LOOP_OK":
      history = flowC_TransitLoop(opts.loops ?? 1, true)
      break
    case "C_LOOP_PROGRESS":
      history = flowC_TransitLoop(opts.loops ?? 1, false)
      break
    case "D_REJECT_OK":
      history = flowD_MerchantReject(false)
      break
    case "D_REJECT_RETRY":
      history = flowD_MerchantReject(true)
      break
    case "E_REFUND_OK":
      history = flowE_RefundFromPaid(false)
      break
    case "E_REFUND_RETRY":
      history = flowE_RefundFromPaid(true)
      break
    case "F_REFUND_OK":
      history = flowF_RefundAfterDelivered(false)
      break
    case "F_REFUND_RETRY":
      history = flowF_RefundAfterDelivered(true)
      break
    case "F_RETURN_FAIL":
      history = flowF_ReturnFail()
      break
    case "G_DOOR_REFUND_OK":
      history = flowG_RefusedAtDoor(false, false)
      break
    case "G_DOOR_REFUND_RETRY":
      history = flowG_RefusedAtDoor(true, false)
      break
    case "G_DOOR_RETURN_FAIL":
      history = flowG_ReturnFail(false)
      break
    case "G_DOOR_LOOP_REFUND_OK":
      history = flowG_RefusedAtDoor(false, true, opts.loops ?? 1)
      break
    case "G_DOOR_LOOP_REFUND_RETRY":
      history = flowG_RefusedAtDoor(true, true, opts.loops ?? 1)
      break
    case "G_DOOR_LOOP_RETURN_FAIL":
      history = flowG_ReturnFail(true, opts.loops ?? 1)
      break
  }

  // ⛔ ตัดประวัติหลัง terminal (กันลากต่อหลัง RETURN_FAIL และ terminal อื่น ๆ)
  const lastTerminalIdx = lastIndexWhere(history, (s) => TERMINALS.includes(s))
  if (lastTerminalIdx !== -1 && lastTerminalIdx < history.length - 1) {
    history = history.slice(0, lastTerminalIdx + 1)
  }

  // สถานะปัจจุบันหลังตัดแล้ว
  const status = history[history.length - 1]

  const shippingType: ShippingType =
    opts.shippingType ?? (rand() > 0.5 ? "EXPRESS" : "STANDARD")

  const createdAt = daysAgo(opts.createdDaysAgo ?? Math.floor(rand() * 12) + 1)

  // เติม fields ตามสถานะ
  const shippedOrBeyond = history.includes("SHIPPED")
  const anyRefund =
    history.includes("REFUND_REQUEST") ||
    history.includes("REFUND_APPROVED") ||
    history.includes("REFUND_SUCCESS") ||
    history.includes("REFUND_FAIL") // (ไม่ถือ RETURN_FAIL เป็น success)

  const refundFailThenSuccess =
    history.includes("REFUND_FAIL") && history.includes("REFUND_SUCCESS")

  const obj: Order = {
    id,
    customerName,
    customerEmail: email,
    customerPhone: phone,
    shippingAddress: addr,
    createdAt,
    totalPrice: THB(totals.totalPrice),
    shippingCost: THB(totals.shippingCost),
    tax: THB(totals.tax),
    status, // ✅ หลังตัด terminal
    statusHistory: history, // ✅ หลังตัด terminal
    paymentMethod: pick(["Credit Card", "PromptPay", "QR", "COD"]),
    shippingType: shippedOrBeyond ? shippingType : undefined,
    trackingNumber: shippedOrBeyond ? trackNum(shippingType!, id) : undefined,
    orderitems: lineItems,
    notes:
      status === "CUSTOMER_CANCELED"
        ? "Customer canceled before payment"
        : undefined
  }

  if (anyRefund) {
    obj.refundReason = pick([
      "Changed mind",
      "Wrong item",
      "Defective product",
      "Damaged on arrival",
      "Rejected at door",
      "Out of stock (merchant)"
    ])
    obj.refundAmount = obj.totalPrice
    if (refundFailThenSuccess) {
      obj.notes = (obj.notes ? obj.notes + " / " : "") + "Refund API retried"
    }
  }

  return obj
}

// ---------------------- generate many cases ----------------------
const config = {
  A_CANCEL: 6,
  B_OK: 8,
  B_PROGRESS: 5,
  B_UNTIL_PENDING: 3,
  B_UNTIL_PAID: 3,
  B_UNTIL_PROCESSING: 3,
  B_UNTIL_READY_TO_SHIP: 3,
  B_UNTIL_SHIPPED: 3,
  C_LOOP_OK_1: 4,
  C_LOOP_OK_2: 3,
  C_LOOP_PROGRESS_2: 3,
  D_REJECT_OK: 4,
  D_REJECT_RETRY: 3,
  E_REFUND_OK: 4,
  E_REFUND_RETRY: 3,
  F_REFUND_OK: 4,
  F_REFUND_RETRY: 3,
  F_RETURN_FAIL: 3,
  G_DOOR_REFUND_OK: 4,
  G_DOOR_REFUND_RETRY: 3,
  G_DOOR_RETURN_FAIL: 3,
  G_DOOR_LOOP_REFUND_OK_2: 3,
  G_DOOR_LOOP_REFUND_RETRY_2: 2,
  G_DOOR_LOOP_RETURN_FAIL_2: 2
}

const orders: Order[] = []

// A
for (let i = 0; i < config.A_CANCEL; i++)
  orders.push(buildOrder({ flow: "A_CANCEL" }))

// B
for (let i = 0; i < config.B_OK; i++) orders.push(buildOrder({ flow: "B_OK" }))
for (let i = 0; i < config.B_PROGRESS; i++)
  orders.push(buildOrder({ flow: "B_PROGRESS" }))
for (let i = 0; i < config.B_UNTIL_PENDING; i++)
  orders.push(buildOrder({ flow: "B_UNTIL_PENDING" }))
for (let i = 0; i < config.B_UNTIL_PAID; i++)
  orders.push(buildOrder({ flow: "B_UNTIL_PAID" }))
for (let i = 0; i < config.B_UNTIL_PROCESSING; i++)
  orders.push(buildOrder({ flow: "B_UNTIL_PROCESSING" }))
for (let i = 0; i < config.B_UNTIL_READY_TO_SHIP; i++)
  orders.push(buildOrder({ flow: "B_UNTIL_READY_TO_SHIP" }))
for (let i = 0; i < config.B_UNTIL_SHIPPED; i++)
  orders.push(buildOrder({ flow: "B_UNTIL_SHIPPED" }))

// C
for (let i = 0; i < config.C_LOOP_OK_1; i++)
  orders.push(buildOrder({ flow: "C_LOOP_OK", loops: 1 }))
for (let i = 0; i < config.C_LOOP_OK_2; i++)
  orders.push(buildOrder({ flow: "C_LOOP_OK", loops: 2 }))
for (let i = 0; i < config.C_LOOP_PROGRESS_2; i++)
  orders.push(buildOrder({ flow: "C_LOOP_PROGRESS", loops: 2 }))

// D
for (let i = 0; i < config.D_REJECT_OK; i++)
  orders.push(buildOrder({ flow: "D_REJECT_OK" }))
for (let i = 0; i < config.D_REJECT_RETRY; i++)
  orders.push(buildOrder({ flow: "D_REJECT_RETRY" }))

// E
for (let i = 0; i < config.E_REFUND_OK; i++)
  orders.push(buildOrder({ flow: "E_REFUND_OK" }))
for (let i = 0; i < config.E_REFUND_RETRY; i++)
  orders.push(buildOrder({ flow: "E_REFUND_RETRY" }))

// F
for (let i = 0; i < config.F_REFUND_OK; i++)
  orders.push(buildOrder({ flow: "F_REFUND_OK" }))
for (let i = 0; i < config.F_REFUND_RETRY; i++)
  orders.push(buildOrder({ flow: "F_REFUND_RETRY" }))
for (let i = 0; i < config.F_RETURN_FAIL; i++)
  orders.push(buildOrder({ flow: "F_RETURN_FAIL" }))

// G
for (let i = 0; i < config.G_DOOR_REFUND_OK; i++)
  orders.push(buildOrder({ flow: "G_DOOR_REFUND_OK" }))
for (let i = 0; i < config.G_DOOR_REFUND_RETRY; i++)
  orders.push(buildOrder({ flow: "G_DOOR_REFUND_RETRY" }))
for (let i = 0; i < config.G_DOOR_RETURN_FAIL; i++)
  orders.push(buildOrder({ flow: "G_DOOR_RETURN_FAIL" }))

// G + loop ขนส่งก่อน
for (let i = 0; i < config.G_DOOR_LOOP_REFUND_OK_2; i++)
  orders.push(buildOrder({ flow: "G_DOOR_LOOP_REFUND_OK", loops: 2 }))
for (let i = 0; i < config.G_DOOR_LOOP_REFUND_RETRY_2; i++)
  orders.push(buildOrder({ flow: "G_DOOR_LOOP_REFUND_RETRY", loops: 2 }))
for (let i = 0; i < config.G_DOOR_LOOP_RETURN_FAIL_2; i++)
  orders.push(buildOrder({ flow: "G_DOOR_LOOP_RETURN_FAIL", loops: 2 }))

// เรียงใหม่ตาม createdAt (ล่าสุดอยู่บนสุด) เพื่อให้ UI ดูสมจริงตอน paginate/filter
orders.sort(
  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
)

export const initialOrders: Order[] = orders
