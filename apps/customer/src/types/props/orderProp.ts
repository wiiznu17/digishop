import {OrderStatus, PaymentMethod, PaymentType} from '../../../../../packages/db/src/types/enum'
export interface Orders {
    id: number,
    reference: string,
    status: OrderStatus,
    grand_total_minor: number,
    items:  [ {
        quantity: number,
        unit_price_minor: number,
        product : {
            name: string,
        }
    } ] ,
    store: {
        storeName: string,
    },
    payment: {
        urlRedirect: string
    }
}

export interface Order1 {
    pruductId: string,
    userId: string
}
export interface Order {
    orderId?:number
    customerId: number,
    grandTotalMinor: number,
    orderNote?: string,
    paymentMethod: PaymentMethod | string,
    storeId: number,
    productName:string,
    productId:number,
    quantity:number,
    unitPrice:number,
    shippingTypeId:number,
    shippingAddress:number,
    createdAt?: Date
    updatedAt?: Date
}
export interface OrderIdProps {
    customerId: number,
    storeId: number,
    productId: number,
    storeName: string
}

export interface OrderDetail {
    id: number,
    order_code: string,
    reference: string,
    status: string,
    grand_total_minor: number,
    created_at: Date,
    shippingInfo: {
        id: number,
        address: {
            id: number
            userId: number
            recipientName: string;
            phone: string;
            address_number: string;
            building: string;
            street: string;
            subStreet: string;
            district: string;
            subdistrict: string;
            country: string;
            province: string;
            postalCode: string;
            isDefault: boolean;
            addressType: string;
            createdAt?: Date
            updatedAt?: Date
        },
        shippingType: {
            name: string,
            description?: string,
            estimatedDays: number,
            price: number,
        }
    },
    items:  [ {
        quantity: number,
        unit_price_minor: number,
        product : {
            id:number,
            uuid: string,
            name: string,
            stockQuantity: number,
            images: [
                {
                    url: string,
                    blobName: string,
                    fileName: string
                }
            ]
        }
    }],
    store: {
        id: number,
        storeName: string
    },
    payment: {
        pgw_status: string,
        payment_method: string,
        updated_at: string
    }
}

export interface Shipping {
    id?: number,
    name: string,
    description?: string,
    estimatedDays: number,
    price: number,
    isActive: boolean,
    createdAt?: Date
    updatedAt?: Date
}