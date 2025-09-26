import axios from "@/lib/axios"
import crypto from 'crypto'
import { CancelProp, Order, OrderIdProp, ShoppingCartProps } from "@/types/props/orderProp"
import { ParamValue } from "next/dist/server/request/params"
import { resolve } from "path"
export const getShippingType = async() => {
    return await new Promise((resolve, reject) => {
        axios
            .get(`/api/order/shiptype`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

export const deleteOrder = async(orderCode: string) => {
    return await new Promise((resolve, reject) => {
        axios   
            .patch(`/api/order/delete/${orderCode}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}

export const createOrderId = async(data: OrderIdProp) => {
    return await new Promise((resolve, reject) => {
        axios   
            .post(`/api/order/create/id`,data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    }) 
    
}
export const createWishList = async(data: ShoppingCartProps) => {
    return await new Promise((resolve, reject) => {
        axios   
            .post(`/api/order/create/cart`,data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    }) 
    
}

export const createOrder = async(data:Order) => {
    return await new Promise((resolve, reject) => {
        axios   
            .post(`/api/order/create`,data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    }) 
    
}
export const fetchOrders = async(id:string, userId: number) => {
    return await new Promise((resolve,reject) => {
        axios
            .get(`/api/order/${userId}/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const deleteCart = async(id: (number | undefined)[]) => {
    return await new Promise((resolve,reject) => {
        axios
            .post(`/api/order/cart/id`, id)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const fetchUserOrders = async(id:number) => {
    return await new Promise((resolve,reject) => {
        axios
            .get(`/api/order/user/id/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const fetchUserChart = async(id:number) => {
    return await new Promise((resolve,reject) => {
        axios 
            .get(`/api/order/cart/user/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const updateOrderStatus = async(id: number) => {
    return await new Promise((resolve,reject) => {
        axios
            .patch(`/api/order/status/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const cancelOrder = async(id: number,data: CancelProp ) => {
    return await new Promise((resolve, reject) => {
        axios
            .patch(`/api/order/cancel/${id}`, data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const refundOrder = async(id: number) => {
    return await new Promise((resolve, reject) => {
        axios
            .patch(`/api/order/refund/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}