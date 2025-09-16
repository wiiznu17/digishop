import axios from "@/lib/axios"
import crypto from 'crypto'
import { Order, OrderIdProps, OrderIdProp, ShoppingCartProps } from "@/types/props/orderProp"
import { ParamValue } from "next/dist/server/request/params"
import { resolve } from "path"
const endpoint = 'http://localhost:4003'
export const getShippingType = async() => {
    return await new Promise((resolve, reject) => {
        axios
            .get(`${endpoint}/api/order/shiptype`)
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
            .post(`${endpoint}/api/order/create/id`,data)
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
            .post(`${endpoint}/api/order/create/cart`,data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    }) 
    
}

export const createOrder = async(data:Order) => {
    console.log(data)
    return await new Promise((resolve, reject) => {
        axios   
            .post(`${endpoint}/api/order/create`,data)
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
            .get(`${endpoint}/api/order/${userId}/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const deleteCart = async(id: (number | undefined)[]) => {
    console.log('id in req', id)
    return await new Promise((resolve,reject) => {
        axios
            .post(`${endpoint}/api/order/cart/id`, id)
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
            .get(`${endpoint}/api/order/user/id/${id}`)
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
            .get(`${endpoint}/api/order/cart/user/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
export const updateOrderStatus = async(ref: string , status: boolean) => {
    return await new Promise((resolve,reject) => {
        axios
            .patch('/api/payment/callback', {ref,status})
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}