import axios from "@/lib/axios"
import crypto from 'crypto'
import { Order } from "@/types/props/orderProp"
import { ParamValue } from "next/dist/server/request/params"
const endpoint = 'http://localhost:4002'
const signKey = process.env.MERCHANRT_SIGN_KEY ?? '5LxvCzMEgCYb6kv+v23M3D1d4lnOHE1CiuA+uO8QTpM='
const mid = process.env.MERCHANRT_MID ?? '0691001119'
const contentSignature = (orderId: string, amount:string) => {
    const payload = {mid,orderId,amount}
    const hmac = crypto.createHmac('sha256', Buffer.from(signKey, 'base64'))
    return  hmac.update(JSON.stringify(payload)).digest('base64')
}
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
export const payment = async(data:Order, id:string) => {
    // const contentSig = 
    try {
        const response =  await axios.request({
            method: 'post',
            url: '',
            data: {
                mid: mid,
                order_id: id,
                description: data.productId,
                amount: data.totalPrice,
                url_redirect: '',
                url_notify: '' //web เรา
            },
            headers: {
                'X-API-ID': process.env.MERCHANRT_API_ID ?? 'Etx4MmvXsHf9JeJ3ScaLqWrgWgnwUIGSwz_n_mF9q2w',
                'X-API-Key': process.env.MERCHANRT_API_KEY ?? 'ApFbpLSXApOHFB2fTlqn0zWg3HjqucQVChYmxtpOarw',
                'X-Partner-ID': process.env.MERCHANRT_PARTNER_ID ?? '1754627921',
                'X-Content-Signature': contentSignature(id, String(data.totalPrice))
            }
        })
        console.log('Response data:', response.data)
        return response.data
    } catch (error) {
        console.log('Error posting data:',error)
    }
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
export const getShippingType = async() => {
    return await new Promise((resolve, reject) => {
        axios
            .get(`${endpoint}/api/order/shippingType`)
            .then((res) => {
                resolve(res.data)
            })
            .catch((err) => {
                reject(err)
            })
    })
}