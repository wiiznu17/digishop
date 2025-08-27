import axios from "@/lib/axios"
import crypto from 'crypto'
import { Order } from "@/types/props/orderProp"
import { ParamValue } from "next/dist/server/request/params"
import { resolve } from "path"
const endpoint = 'http://localhost:4003'

export const createOrder = async(data:Order) => {
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
export const fetchOrders = async(id:ParamValue) => {
    return await new Promise((resolve,reject) => {
        axios
            .get(`${endpoint}/api/order/${id}`)
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
            .get(`${endpoint}/api/order/user/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
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