import axios from "@/lib/axios"
import { Order } from "@/types/props/orderProp"
import { resolve } from "path"

export const createOrder = async(data:Order) => {
    return await new Promise((resolve, reject) => {
        axios   
            .post('http://localhost:4002/api/order/create',data)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    }) 
}
export const fetchOrders = async(id:string) => {
    return await new Promise((resolve,reject) => {
        axios
            .get(`/api/order/${id}`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}
