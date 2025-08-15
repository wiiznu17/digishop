import { Order } from "@/types/props/orderProp"

export const initialOrders: Order[] = [
  {
    id: "ORD-2024-001",
    customerName: "สมชาย ใจดี",
    customerEmail: "somchai@email.com",
    customerPhone: "081-234-5678",
    shippingAddress: {
      recipientName: "สมชาย ใจดี",
      phone: "0812345678",
      street: "123 ถนนสุขุมวิท",
      district: "คลองเตย",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      country: "ประเทศไทย"
    },
    createdAt: "2024-01-01T09:00:00Z",
    totalPrice: 1500,
    shippingCost: 50,
    tax: 105,
    status: "PENDING",
    paymentMethod: "Credit Card",
    orderitems: [
      { id: "1", name: "เสื้อยืดคอกลม", sku: "TS-001", quantity: 2, price: 700 }
    ]
  },
  {
    id: "ORD-2024-002",
    customerName: "พรทิพย์ พิพัฒน์",
    customerEmail: "pornthip@email.com",
    customerPhone: "081-999-8888",
    shippingAddress: {
      recipientName: "พรทิพย์ พิพัฒน์",
      phone: "0819998888",
      street: "55/88 ถนนงามวงศ์วาน",
      district: "เมืองนนทบุรี",
      province: "นนทบุรี",
      postalCode: "11000",
      country: "ประเทศไทย"
    },
    createdAt: "2024-01-02T10:00:00Z",
    totalPrice: 2500,
    shippingCost: 80,
    tax: 175,
    status: "CUSTOMER_CANCELED",
    paymentMethod: "Bank Transfer",
    orderitems: [
      { id: "2", name: "รองเท้าผ้าใบ", sku: "SH-002", quantity: 1, price: 2420 }
    ],
    notes: "ยกเลิกเนื่องจากสั่งผิดสี"
  },
  {
    id: "ORD-2024-003",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "080-111-2222",
    shippingAddress: {
      recipientName: "John Doe",
      phone: "0801112222",
      street: "456 ถนนพระราม 4",
      district: "คลองเตย",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      country: "Thailand"
    },
    createdAt: "2024-01-03T11:15:00Z",
    totalPrice: 999,
    shippingCost: 40,
    tax: 70,
    status: "PAID",
    paymentMethod: "PromptPay",
    orderitems: [
      { id: "3", name: "กระเป๋าผ้า", sku: "BG-003", quantity: 3, price: 320 }
    ]
  },
  {
    id: "ORD-2024-004",
    customerName: "สุชาติ รักดี",
    customerEmail: "suchat@email.com",
    customerPhone: "085-555-6666",
    shippingAddress: {
      recipientName: "สุชาติ รักดี",
      phone: "0855556666",
      street: "12/9 ถนนราชพฤกษ์",
      district: "ตลิ่งชัน",
      province: "กรุงเทพมหานคร",
      postalCode: "10170",
      country: "ประเทศไทย"
    },
    createdAt: "2024-01-04T12:00:00Z",
    totalPrice: 3200,
    shippingCost: 100,
    tax: 224,
    status: "PROCESSING",
    paymentMethod: "Credit Card",
    orderitems: [
      { id: "4", name: "โต๊ะทำงานไม้", sku: "TB-004", quantity: 1, price: 3200 }
    ]
  },
  {
    id: "ORD-2024-005",
    customerName: "Alice Wonderland",
    customerEmail: "alice@example.com",
    customerPhone: "081-000-1234",
    shippingAddress: {
      recipientName: "Alice Wonderland",
      phone: "0810001234",
      street: "999 ถนนสาทรเหนือ",
      district: "บางรัก",
      province: "กรุงเทพมหานคร",
      postalCode: "10500",
      country: "Thailand"
    },
    createdAt: "2024-01-05T13:00:00Z",
    totalPrice: 4500,
    shippingCost: 120,
    tax: 315,
    status: "READY_TO_SHIP",
    paymentMethod: "Cash on Delivery",
    orderitems: [
      {
        id: "5",
        name: "โคมไฟตั้งโต๊ะ",
        sku: "LP-005",
        quantity: 2,
        price: 2190
      }
    ]
  },
  {
    id: "ORD-2024-006",
    customerName: "ณัฐพล จันทร์สว่าง",
    customerEmail: "natthaphon@email.com",
    customerPhone: "082-333-4444",
    shippingAddress: {
      recipientName: "ณัฐพล จันทร์สว่าง",
      phone: "0823334444",
      street: "22/7 ถนนลาดพร้าว",
      district: "จตุจักร",
      province: "กรุงเทพมหานคร",
      postalCode: "10900",
      country: "ประเทศไทย"
    },
    createdAt: "2024-01-06T14:00:00Z",
    totalPrice: 1990,
    shippingCost: 60,
    tax: 140,
    status: "SHIPPED",
    paymentMethod: "Credit Card",
    trackingNumber: "TH555555555",
    orderitems: [
      {
        id: "6",
        name: "หม้อทอดไร้น้ำมัน",
        sku: "AF-006",
        quantity: 1,
        price: 1990
      }
    ]
  },
  {
    id: "ORD-2024-007",
    customerName: "Mark Smith",
    customerEmail: "mark@example.com",
    customerPhone: "080-333-2222",
    shippingAddress: {
      recipientName: "Mark Smith",
      phone: "0803332222",
      street: "123/1 ถนนจันทน์",
      district: "ยานนาวา",
      province: "กรุงเทพมหานคร",
      postalCode: "10120",
      country: "Thailand"
    },
    createdAt: "2024-01-07T15:00:00Z",
    totalPrice: 890,
    shippingCost: 30,
    tax: 62,
    status: "DELIVERED",
    paymentMethod: "PromptPay",
    orderitems: [
      {
        id: "7",
        name: "แก้วน้ำสแตนเลส",
        sku: "CU-007",
        quantity: 2,
        price: 445
      }
    ]
  },
  {
    id: "ORD-2024-008",
    customerName: "William Johnson",
    customerEmail: "william@example.com",
    customerPhone: "089-111-9999",
    shippingAddress: {
      recipientName: "William Johnson",
      phone: "0891119999",
      street: "5/55 ถนนพหลโยธิน",
      district: "บางเขน",
      province: "กรุงเทพมหานคร",
      postalCode: "10220",
      country: "Thailand"
    },
    createdAt: "2024-01-08T16:00:00Z",
    totalPrice: 2000,
    shippingCost: 50,
    tax: 140,
    status: "REFUND_REQUEST",
    paymentMethod: "Credit Card",
    orderitems: [
      {
        id: "8",
        name: "เครื่องชงกาแฟ",
        sku: "CF-008",
        quantity: 1,
        price: 2000
      }
    ],
    refundReason: "สินค้าไม่ตรงปก"
  },
  {
    id: "ORD-2024-009",
    customerName: "Olivia Lee",
    customerEmail: "olivia@example.com",
    customerPhone: "086-555-7777",
    shippingAddress: {
      recipientName: "Olivia Lee",
      phone: "0865557777",
      street: "777 ถนนพระราม 9",
      district: "ห้วยขวาง",
      province: "กรุงเทพมหานคร",
      postalCode: "10310",
      country: "Thailand"
    },
    createdAt: "2024-01-09T17:00:00Z",
    totalPrice: 1290,
    shippingCost: 40,
    tax: 90,
    status: "TRANSIT_LACK",
    paymentMethod: "Bank Transfer",
    orderitems: [
      { id: "9", name: "สายชาร์จเร็ว", sku: "CB-009", quantity: 3, price: 430 }
    ]
  },
  {
    id: "ORD-2024-0017",
    customerName: "Olivia Lee",
    customerEmail: "olivia@example.com",
    customerPhone: "086-555-7777",
    shippingAddress: {
      recipientName: "Olivia Lee",
      phone: "0865557777",
      street: "777 ถนนพระราม 9",
      district: "ห้วยขวาง",
      province: "กรุงเทพมหานคร",
      postalCode: "10310",
      country: "Thailand"
    },
    createdAt: "2024-01-09T17:00:00Z",
    totalPrice: 1290,
    shippingCost: 40,
    tax: 90,
    status: "RE_TRANSIT",
    paymentMethod: "Bank Transfer",
    orderitems: [
      { id: "9", name: "สายชาร์จเร็ว", sku: "CB-009", quantity: 3, price: 430 }
    ]
  },
  {
    id: "ORD-2024-010",
    customerName: "Liam Brown",
    customerEmail: "liam@example.com",
    customerPhone: "085-444-6666",
    shippingAddress: {
      recipientName: "Liam Brown",
      phone: "0854446666",
      street: "999 ถนนสุขุมวิท",
      district: "วัฒนา",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      country: "Thailand"
    },
    createdAt: "2024-01-10T18:00:00Z",
    totalPrice: 750,
    shippingCost: 25,
    tax: 53,
    status: "AWAITING_RETURN",
    paymentMethod: "PromptPay",
    orderitems: [
      { id: "10", name: "หมวกแก๊ป", sku: "CP-010", quantity: 1, price: 750 }
    ]
  },
  {
    id: "ORD-2024-011",
    customerName: "Noah Wilson",
    customerEmail: "noah@example.com",
    customerPhone: "084-888-7777",
    shippingAddress: {
      recipientName: "Noah Wilson",
      phone: "0848887777",
      street: "222 ถนนเพชรบุรี",
      district: "ราชเทวี",
      province: "กรุงเทพมหานคร",
      postalCode: "10400",
      country: "Thailand"
    },
    createdAt: "2024-01-11T19:00:00Z",
    totalPrice: 5000,
    shippingCost: 150,
    tax: 350,
    status: "RETURN_FAIL",
    paymentMethod: "Credit Card",
    orderitems: [
      {
        id: "11",
        name: "เก้าอี้สำนักงาน",
        sku: "CH-011",
        quantity: 2,
        price: 2500
      }
    ]
  },
  {
    id: "ORD-2024-012",
    customerName: "Emma Taylor",
    customerEmail: "emma@example.com",
    customerPhone: "083-222-1111",
    shippingAddress: {
      recipientName: "Emma Taylor",
      phone: "0832221111",
      street: "88 ถนนเจริญกรุง",
      district: "บางรัก",
      province: "กรุงเทพมหานคร",
      postalCode: "10500",
      country: "Thailand"
    },
    createdAt: "2024-01-12T20:00:00Z",
    totalPrice: 2990,
    shippingCost: 70,
    tax: 210,
    status: "RETURN_VERIFIED",
    paymentMethod: "Credit Card",
    orderitems: [
      { id: "12", name: "เตารีดไอน้ำ", sku: "IR-012", quantity: 1, price: 2990 }
    ]
  },
  {
    id: "ORD-2024-013",
    customerName: "Sophia Davis",
    customerEmail: "sophia@example.com",
    customerPhone: "082-555-9999",
    shippingAddress: {
      recipientName: "Sophia Davis",
      phone: "0825559999",
      street: "11 ถนนลาดพร้าว",
      district: "ห้วยขวาง",
      province: "กรุงเทพมหานคร",
      postalCode: "10310",
      country: "Thailand"
    },
    createdAt: "2024-01-13T21:00:00Z",
    totalPrice: 1800,
    shippingCost: 60,
    tax: 126,
    status: "REFUND_APPROVED",
    paymentMethod: "PromptPay",
    orderitems: [
      { id: "13", name: "หมอนหนุน", sku: "PL-013", quantity: 2, price: 900 }
    ],
    refundAmount: 1800
  },
  {
    id: "ORD-2024-014",
    customerName: "James Anderson",
    customerEmail: "james@example.com",
    customerPhone: "081-777-2222",
    shippingAddress: {
      recipientName: "James Anderson",
      phone: "0817772222",
      street: "44 ถนนสุขุมวิท",
      district: "คลองเตย",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      country: "Thailand"
    },
    createdAt: "2024-01-14T22:00:00Z",
    totalPrice: 2750,
    shippingCost: 80,
    tax: 192,
    status: "REFUND_FAIL",
    paymentMethod: "Credit Card",
    orderitems: [
      {
        id: "14",
        name: "ชุดเครื่องนอน",
        sku: "BS-014",
        quantity: 1,
        price: 2750
      }
    ]
  },
  {
    id: "ORD-2024-015",
    customerName: "Charlotte White",
    customerEmail: "charlotte@example.com",
    customerPhone: "080-999-5555",
    shippingAddress: {
      recipientName: "Charlotte White",
      phone: "0809995555",
      street: "101 ถนนพระราม 2",
      district: "บางขุนเทียน",
      province: "กรุงเทพมหานคร",
      postalCode: "10150",
      country: "Thailand"
    },
    createdAt: "2024-01-15T23:00:00Z",
    totalPrice: 3500,
    shippingCost: 90,
    tax: 245,
    status: "REFUND_SUCCESS",
    paymentMethod: "Bank Transfer",
    orderitems: [
      {
        id: "15",
        name: "กล้องถ่ายรูปดิจิตอล",
        sku: "CM-015",
        quantity: 1,
        price: 3500
      }
    ],
    refundAmount: 3500
  },
  {
    id: "ORD-2024-016",
    customerName: "Ethan Thomas",
    customerEmail: "ethan@example.com",
    customerPhone: "089-222-3333",
    shippingAddress: {
      recipientName: "Ethan Thomas",
      phone: "0892223333",
      street: "12 ถนนพระราม 6",
      district: "พญาไท",
      province: "กรุงเทพมหานคร",
      postalCode: "10400",
      country: "Thailand"
    },
    createdAt: "2024-01-16T09:00:00Z",
    totalPrice: 1200,
    shippingCost: 50,
    tax: 84,
    status: "COMPLETE",
    paymentMethod: "Credit Card",
    orderitems: [
      { id: "16", name: "สมุดโน้ตหนัง", sku: "NB-016", quantity: 4, price: 300 }
    ]
  }
]
