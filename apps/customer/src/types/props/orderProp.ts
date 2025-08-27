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
    id?:number
    customerId: number,
    storeId: number,
    totalPrice: number,
    productName:string,
    productId:number,
    quantity:number,
    unitPrice:number,
    shippingTypeId:number,
    shippingAddress:number,
    createdAt?: Date
    updatedAt?: Date
}
export interface Shipping {
    id?: number,
    name: string,
    description?: string,
    estimatedDays: number,
    price: string,
    isActive: boolean,
    createdAt?: Date
    updatedAt?: Date
}