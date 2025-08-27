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
// export const payment = async(data:Order, id:string) => {
//     return await new Promise((resolve, reject) => {
//         axios

//     })
//     try {
//         const response =  await axios.request({
//             method: 'post',
//             url: 'http://localhost:4002/payment',
//             data: {
//                 mid: mid,
//                 order_id: id,
//                 description: data.productId,
//                 amount: data.totalPrice,
//                 url_redirect: 'http://localhost:3001/digishop',
//                 url_notify: 'http://localhost:4003/api/payment/notify' //web เรา
//             },
//             headers: {
//                 'X-API-ID': apiId,
//                 'X-API-Key': apiKey,
//                 'X-Partner-ID': partnerId,
//                 'X-Content-Signature': contentSignature(id, data.totalPrice)
//             }
//         })
//         console.log('Response data:', response.data)
//         return response.data
//     } catch (error) {
//         console.log('Error posting data:',error)
//     }
// }
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