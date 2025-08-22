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
    createdAt: "2024-07-28T09:00:00Z",
    totalPrice: 1500,
    shippingCost: 50,
    tax: 105,
    status: "PENDING",
    statusHistory: ["PENDING"],
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
    createdAt: "2024-07-27T10:00:00Z",
    totalPrice: 2500,
    shippingCost: 80,
    tax: 175,
    status: "PAID",
    statusHistory: ["PENDING", "PAID"],
    paymentMethod: "Bank Transfer",
    orderitems: [
      { id: "2", name: "รองเท้าผ้าใบ", sku: "SH-002", quantity: 1, price: 2420 }
    ]
  },
  {
    id: "ORD-2024-003",
    customerName: "วิชัย ประเสริฐ",
    customerEmail: "vichai@email.com",
    customerPhone: "088-111-2222",
    shippingAddress: {
      recipientName: "วิชัย ประเสริฐ",
      phone: "0881112222",
      street: "45 ซอยอารีย์",
      district: "พญาไท",
      province: "กรุงเทพมหานคร",
      postalCode: "10400",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-26T14:30:00Z",
    totalPrice: 4800,
    shippingCost: 100,
    tax: 336,
    status: "PROCESSING",
    statusHistory: ["PENDING", "PAID", "PROCESSING"],
    paymentMethod: "Credit Card",
    orderitems: [
      {
        id: "3",
        name: "หูฟังไร้สาย Pro",
        sku: "HP-PRO-01",
        quantity: 1,
        price: 4700
      }
    ]
  },
  {
    id: "ORD-2024-004",
    customerName: "มานี รักเรียน",
    customerEmail: "manee@email.com",
    customerPhone: "085-555-4444",
    shippingAddress: {
      recipientName: "มานี รักเรียน",
      phone: "0855554444",
      street: "789 ถนนเชียงใหม่-ลำพูน",
      district: "เมือง",
      province: "เชียงใหม่",
      postalCode: "50000",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-25T11:00:00Z",
    totalPrice: 990,
    shippingCost: 45,
    tax: 69.3,
    status: "READY_TO_SHIP",
    statusHistory: ["PENDING", "PAID", "PROCESSING", "READY_TO_SHIP"],
    paymentMethod: "PromptPay",
    orderitems: [
      { id: "4", name: "กระเป๋าสะพาย", sku: "BG-005", quantity: 1, price: 945 }
    ]
  },
  {
    id: "ORD-2024-005",
    customerName: "ศิริพร สวยงาม",
    customerEmail: "siriporn@email.com",
    customerPhone: "086-333-2222",
    shippingAddress: {
      recipientName: "ศิริพร สวยงาม",
      phone: "0863332222",
      street: "12 ถนนลาดพร้าว",
      district: "จตุจักร",
      province: "กรุงเทพมหานคร",
      postalCode: "10900",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-24T12:00:00Z",
    totalPrice: 3200,
    shippingCost: 70,
    tax: 224,
    status: "SHIPPED",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED"
    ],
    trackingNumber: "TH123456789EX",
    paymentMethod: "Credit Card",
    orderitems: [
      {
        id: "5",
        name: "เครื่องปั่นน้ำผลไม้",
        sku: "BL-101",
        quantity: 1,
        price: 3130
      }
    ]
  },
  {
    id: "ORD-2024-006",
    customerName: "อนันต์ เก่งงาน",
    customerEmail: "anan@email.com",
    customerPhone: "089-777-6666",
    shippingAddress: {
      recipientName: "อนันต์ เก่งงาน",
      phone: "0897776666",
      street: "88 ถนนพระราม 9",
      district: "ห้วยขวาง",
      province: "กรุงเทพมหานคร",
      postalCode: "10310",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-23T15:00:00Z",
    totalPrice: 2100,
    shippingCost: 50,
    tax: 147,
    status: "DELIVERED",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED"
    ],
    trackingNumber: "TH555666777EX",
    paymentMethod: "PromptPay",
    orderitems: [
      { id: "6", name: "หนังสือเรียน", sku: "BK-301", quantity: 3, price: 650 }
    ]
  },
  {
    id: "ORD-2024-007",
    customerName: "กิตติชัย อุดม",
    customerEmail: "kitti@email.com",
    customerPhone: "091-123-4567",
    shippingAddress: {
      recipientName: "กิตติชัย อุดม",
      phone: "0911234567",
      street: "22 ถนนพหลโยธิน",
      district: "บางเขน",
      province: "กรุงเทพมหานคร",
      postalCode: "10220",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-22T13:00:00Z",
    totalPrice: 5900,
    shippingCost: 120,
    tax: 413,
    status: "COMPLETE",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "COMPLETE"
    ],
    trackingNumber: "TH888999000EX",
    paymentMethod: "Credit Card",
    orderitems: [
      {
        id: "7",
        name: "กล้องถ่ายรูป",
        sku: "CAM-501",
        quantity: 1,
        price: 5780
      }
    ]
  },
  {
    id: "ORD-2024-008",
    customerName: "สุดา รุ่งเรือง",
    customerEmail: "suda@email.com",
    customerPhone: "092-555-4444",
    shippingAddress: {
      recipientName: "สุดา รุ่งเรือง",
      phone: "0925554444",
      street: "99 ถนนวิภาวดี",
      district: "หลักสี่",
      province: "กรุงเทพมหานคร",
      postalCode: "10210",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-21T14:00:00Z",
    totalPrice: 1200,
    shippingCost: 40,
    tax: 84,
    status: "CUSTOMER_CANCELED",
    statusHistory: ["PENDING", "CUSTOMER_CANCELED"],
    paymentMethod: "Bank Transfer",
    notes: "ยกเลิกเนื่องจากสั่งผิดไซส์",
    orderitems: [
      { id: "8", name: "เสื้อกันหนาว", sku: "JK-202", quantity: 1, price: 1160 }
    ]
  },
  {
    id: "ORD-2024-009",
    customerName: "จิราพร ดวงดี",
    customerEmail: "jira@email.com",
    customerPhone: "093-888-7777",
    shippingAddress: {
      recipientName: "จิราพร ดวงดี",
      phone: "0938887777",
      street: "7 ถนนเจริญกรุง",
      district: "บางรัก",
      province: "กรุงเทพมหานคร",
      postalCode: "10500",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-20T16:00:00Z",
    totalPrice: 3400,
    shippingCost: 90,
    tax: 238,
    status: "MERCHANT_REJECT",
    statusHistory: ["PENDING", "PAID", "MERCHANT_REJECT"],
    paymentMethod: "PromptPay",
    notes: "ร้านค้าไม่สามารถจัดส่งสินค้าได้",
    orderitems: [
      { id: "9", name: "ทีวีสมาร์ท", sku: "TV-701", quantity: 1, price: 3310 }
    ]
  },
  {
    id: "ORD-2024-010",
    customerName: "ปรีชา พัฒนา",
    customerEmail: "preecha@email.com",
    customerPhone: "094-222-1111",
    shippingAddress: {
      recipientName: "ปรีชา พัฒนา",
      phone: "0942221111",
      street: "66 ถนนสุขสวัสดิ์",
      district: "บางขุนเทียน",
      province: "กรุงเทพมหานคร",
      postalCode: "10150",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-19T17:00:00Z",
    totalPrice: 4500,
    shippingCost: 100,
    tax: 315,
    status: "TRANSIT_LACK",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "TRANSIT_LACK"
    ],
    trackingNumber: "TH111222333EX",
    paymentMethod: "Credit Card",
    orderitems: [
      { id: "10", name: "จักรยาน", sku: "BI-401", quantity: 1, price: 4400 }
    ]
  },
  {
    id: "ORD-2024-011",
    customerName: "พิมพ์ใจ มั่งมี",
    customerEmail: "pimjai@email.com",
    customerPhone: "095-666-5555",
    shippingAddress: {
      recipientName: "พิมพ์ใจ มั่งมี",
      phone: "0956665555",
      street: "123 ถนนราชพฤกษ์",
      district: "ตลิ่งชัน",
      province: "กรุงเทพมหานคร",
      postalCode: "10170",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-18T18:00:00Z",
    totalPrice: 2800,
    shippingCost: 80,
    tax: 196,
    status: "RE_TRANSIT",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "TRANSIT_LACK",
      "RE_TRANSIT"
    ],
    trackingNumber: "TH444555666EX",
    paymentMethod: "Credit Card",
    orderitems: [
      {
        id: "11",
        name: "เครื่องดูดฝุ่น",
        sku: "VC-801",
        quantity: 1,
        price: 2720
      }
    ]
  },
  // refund
  {
    id: "ORD-2024-012",
    customerName: "สมปอง ตรงไป",
    customerEmail: "sompong@email.com",
    customerPhone: "096-123-9876",
    shippingAddress: {
      recipientName: "สมปอง ตรงไป",
      phone: "0961239876",
      street: "45 ถนนสาทร",
      district: "ยานนาวา",
      province: "กรุงเทพมหานคร",
      postalCode: "10120",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-17T19:00:00Z",
    totalPrice: 1990,
    shippingCost: 60,
    tax: 139.3,
    status: "REFUND_REQUEST",
    statusHistory: ["PENDING", "PAID", "REFUND_REQUEST"],
    paymentMethod: "Bank Transfer",
    refundReason: "สินค้าไม่ตรงตามที่สั่ง",
    refundAmount: 1990,
    orderitems: [
      { id: "12", name: "โต๊ะทำงาน", sku: "TB-601", quantity: 1, price: 1930 }
    ]
  },
  {
    id: "ORD-2024-020",
    customerName: "สมปอง ตรงไป",
    customerEmail: "sompong@email.com",
    customerPhone: "096-123-9876",
    shippingAddress: {
      recipientName: "สมปอง ตรงไป",
      phone: "0961239876",
      street: "45 ถนนสาทร",
      district: "ยานนาวา",
      province: "กรุงเทพมหานคร",
      postalCode: "10120",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-17T19:00:00Z",
    totalPrice: 1990,
    shippingCost: 60,
    tax: 139.3,
    status: "REFUND_REQUEST",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "REFUND_REQUEST"
    ],
    paymentMethod: "Bank Transfer",
    refundReason: "สินค้าไม่ตรงตามที่สั่ง",
    refundAmount: 1990,
    orderitems: [
      { id: "12", name: "โต๊ะทำงาน", sku: "TB-601", quantity: 1, price: 1930 }
    ]
  },
  // need to return product
  {
    id: "ORD-2024-013",
    customerName: "กมลวรรณ พิทักษ์",
    customerEmail: "kamol@email.com",
    customerPhone: "097-777-3333",
    shippingAddress: {
      recipientName: "กมลวรรณ พิทักษ์",
      phone: "0977773333",
      street: "22 ถนนเจริญนคร",
      district: "คลองสาน",
      province: "กรุงเทพมหานคร",
      postalCode: "10600",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-16T20:00:00Z",
    totalPrice: 990,
    shippingCost: 45,
    tax: 69.3,
    status: "AWAITING_RETURN",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "REFUND_REQUEST",
      "AWAITING_RETURN"
    ],
    paymentMethod: "PromptPay",
    refundReason: "สินค้าชำรุด",
    refundAmount: 990,
    orderitems: [
      {
        id: "13",
        name: "โคมไฟตั้งโต๊ะ",
        sku: "LP-201",
        quantity: 1,
        price: 945
      }
    ]
  },
  {
    id: "ORD-2024-021",
    customerName: "กมลวรรณ พิทักษ์",
    customerEmail: "kamol@email.com",
    customerPhone: "097-777-3333",
    shippingAddress: {
      recipientName: "กมลวรรณ พิทักษ์",
      phone: "0977773333",
      street: "22 ถนนเจริญนคร",
      district: "คลองสาน",
      province: "กรุงเทพมหานคร",
      postalCode: "10600",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-16T20:00:00Z",
    totalPrice: 990,
    shippingCost: 45,
    tax: 69.3,
    status: "AWAITING_RETURN",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "AWAITING_RETURN"
    ],
    paymentMethod: "PromptPay",
    refundReason: "สินค้าชำรุด",
    refundAmount: 990,
    orderitems: [
      {
        id: "13",
        name: "โคมไฟตั้งโต๊ะ",
        sku: "LP-201",
        quantity: 1,
        price: 945
      }
    ]
  },
  {
    id: "ORD-2024-022",
    customerName: "กมลวรรณ พิทักษ์",
    customerEmail: "kamol@email.com",
    customerPhone: "097-777-3333",
    shippingAddress: {
      recipientName: "กมลวรรณ พิทักษ์",
      phone: "0977773333",
      street: "22 ถนนเจริญนคร",
      district: "คลองสาน",
      province: "กรุงเทพมหานคร",
      postalCode: "10600",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-16T20:00:00Z",
    totalPrice: 990,
    shippingCost: 45,
    tax: 69.3,
    status: "AWAITING_RETURN",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "AWAITING_RETURN"
    ],
    paymentMethod: "PromptPay",
    refundReason: "สินค้าชำรุด",
    refundAmount: 990,
    orderitems: [
      {
        id: "13",
        name: "โคมไฟตั้งโต๊ะ",
        sku: "LP-201",
        quantity: 1,
        price: 945
      }
    ]
  },
  {
    id: "ORD-2024-014",
    customerName: "เจนจิรา รัตน์",
    customerEmail: "jane@email.com",
    customerPhone: "098-111-2222",
    shippingAddress: {
      recipientName: "เจนจิรา รัตน์",
      phone: "0981112222",
      street: "78 ถนนเพชรบุรี",
      district: "ราชเทวี",
      province: "กรุงเทพมหานคร",
      postalCode: "10400",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-15T21:00:00Z",
    totalPrice: 3000,
    shippingCost: 70,
    tax: 210,
    status: "RECIEVE_RETURN",
    statusHistory: [
      "PENDING",
      "PAID",
      "PROCESSING",
      "READY_TO_SHIP",
      "SHIPPED",
      "DELIVERED",
      "REFUND_REQUEST",
      "AWAITING_RETURN",
      "RECIEVE_RETURN"
    ],
    paymentMethod: "Credit Card",
    refundReason: "ลูกค้าส่งสินค้าคืน",
    refundAmount: 3000,
    orderitems: [
      {
        id: "14",
        name: "กาต้มน้ำไฟฟ้า",
        sku: "KT-102",
        quantity: 1,
        price: 2930
      }
    ]
  },
  {
    id: "ORD-2024-015",
    customerName: "วรพจน์ ยั่งยืน",
    customerEmail: "worapot@email.com",
    customerPhone: "099-555-4444",
    shippingAddress: {
      recipientName: "วรพจน์ ยั่งยืน",
      phone: "0995554444",
      street: "33 ถนนสีลม",
      district: "บางรัก",
      province: "กรุงเทพมหานคร",
      postalCode: "10500",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-14T22:00:00Z",
    totalPrice: 2200,
    shippingCost: 60,
    tax: 154,
    status: "RETURN_VERIFIED",
    statusHistory: [
      "PENDING",
      "PAID",
      "DELIVERED",
      "REFUND_REQUEST",
      "AWAITING_RETURN",
      "RECIEVE_RETURN",
      "RETURN_VERIFIED"
    ],
    paymentMethod: "PromptPay",
    refundReason: "ตรวจสอบสินค้าคืนเรียบร้อย",
    refundAmount: 2200,
    orderitems: [
      {
        id: "15",
        name: "ชุดเครื่องนอน",
        sku: "BD-401",
        quantity: 1,
        price: 2140
      }
    ]
  },
  {
    id: "ORD-2024-016",
    customerName: "ธวัชชัย ตรงดี",
    customerEmail: "thawat@email.com",
    customerPhone: "080-555-9999",
    shippingAddress: {
      recipientName: "ธวัชชัย ตรงดี",
      phone: "0805559999",
      street: "12 ถนนสาทร",
      district: "บางคอแหลม",
      province: "กรุงเทพมหานคร",
      postalCode: "10120",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-13T23:00:00Z",
    totalPrice: 1500,
    shippingCost: 50,
    tax: 105,
    status: "RETURN_FAIL",
    statusHistory: [
      "PENDING",
      "PAID",
      "DELIVERED",
      "REFUND_REQUEST",
      "AWAITING_RETURN",
      "RETURN_FAIL"
    ],
    paymentMethod: "Credit Card",
    refundReason: "ลูกค้าไม่ส่งสินค้าคืนภายในเวลา",
    refundAmount: 1500,
    orderitems: [
      {
        id: "16",
        name: "พัดลมตั้งพื้น",
        sku: "FN-601",
        quantity: 1,
        price: 1450
      }
    ]
  },
  {
    id: "ORD-2024-017",
    customerName: "ประภา พูนสุข",
    customerEmail: "prapa@email.com",
    customerPhone: "081-222-1111",
    shippingAddress: {
      recipientName: "ประภา พูนสุข",
      phone: "0812221111",
      street: "44 ถนนพระราม 4",
      district: "คลองเตย",
      province: "กรุงเทพมหานคร",
      postalCode: "10110",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-12T08:00:00Z",
    totalPrice: 3100,
    shippingCost: 90,
    tax: 217,
    status: "REFUND_APPROVED",
    statusHistory: [
      "PENDING",
      "PAID",
      "DELIVERED",
      "REFUND_REQUEST",
      "AWAITING_RETURN",
      "RECIEVE_RETURN",
      "RETURN_VERIFIED",
      "REFUND_APPROVED"
    ],
    paymentMethod: "PromptPay",
    refundReason: "ร้านค้าอนุมัติการคืนเงิน",
    refundAmount: 3100,
    orderitems: [
      { id: "17", name: "โน้ตบุ๊ก", sku: "NB-901", quantity: 1, price: 3010 }
    ]
  },
  {
    id: "ORD-2024-018",
    customerName: "เจริญศักดิ์ ตั้งมั่น",
    customerEmail: "charoen@email.com",
    customerPhone: "082-333-4444",
    shippingAddress: {
      recipientName: "เจริญศักดิ์ ตั้งมั่น",
      phone: "0823334444",
      street: "77 ถนนรามคำแหง",
      district: "บางกะปิ",
      province: "กรุงเทพมหานคร",
      postalCode: "10240",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-11T09:00:00Z",
    totalPrice: 890,
    shippingCost: 40,
    tax: 62.3,
    status: "REFUND_SUCCESS",
    statusHistory: [
      "PENDING",
      "PAID",
      "DELIVERED",
      "REFUND_REQUEST",
      "AWAITING_RETURN",
      "RECIEVE_RETURN",
      "RETURN_VERIFIED",
      "REFUND_APPROVED",
      "REFUND_SUCCESS"
    ],
    paymentMethod: "Bank Transfer",
    refundReason: "คืนเงินสำเร็จ",
    refundAmount: 890,
    orderitems: [
      {
        id: "18",
        name: "แก้วน้ำสแตนเลส",
        sku: "MG-101",
        quantity: 2,
        price: 425
      }
    ]
  },
  {
    id: "ORD-2024-019",
    customerName: "สุชาติ มั่งคั่ง",
    customerEmail: "suchat@email.com",
    customerPhone: "083-444-5555",
    shippingAddress: {
      recipientName: "สุชาติ มั่งคั่ง",
      phone: "0834445555",
      street: "11 ถนนนิมมานเหมินท์",
      district: "เมือง",
      province: "เชียงใหม่",
      postalCode: "50000",
      country: "ประเทศไทย"
    },
    createdAt: "2024-07-10T10:00:00Z",
    totalPrice: 5200,
    shippingCost: 120,
    tax: 364,
    status: "REFUND_FAIL",
    statusHistory: [
      "PENDING",
      "PAID",
      "DELIVERED",
      "REFUND_REQUEST",
      "AWAITING_RETURN",
      "RECIEVE_RETURN",
      "RETURN_VERIFIED",
      "REFUND_APPROVED",
      "REFUND_FAIL"
    ],
    paymentMethod: "Credit Card",
    refundReason: "การคืนเงินล้มเหลวเนื่องจากปัญหาธนาคาร",
    refundAmount: 5200,
    orderitems: [
      { id: "19", name: "เตาไมโครเวฟ", sku: "MW-301", quantity: 1, price: 5080 }
    ]
  }
]
