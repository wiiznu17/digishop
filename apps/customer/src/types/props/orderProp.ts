import {OrderStatus} from '../../../../../packages/db/src/types/enum'
export interface Orders {
    quantity: number,
    order: {
        id: number,
        reference: number,
        status: OrderStatus,
        total_price: string,
        store_name: string
    },
    product: {
        name: string,
    }
    // urlPayment: string,
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