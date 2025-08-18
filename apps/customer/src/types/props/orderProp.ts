export interface Orders {
    id: string,
    productName: string,
    customer: string,
    price: number,
    orderDate: '2024-01-12',
    status: 
    "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
}

export interface Order1 {
    pruductId: string,
    userId: string
}
export interface Order {
    customerId: number,
    storeId: number,
    totalPrice: number,
    productId:number,
    quantity:number,
    unitPrice:number,
    createdAt?: Date
    updatedAt?: Date
}