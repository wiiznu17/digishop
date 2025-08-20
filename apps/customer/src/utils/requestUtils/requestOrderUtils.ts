import axios from "@/lib/axios"
import crypto from 'crypto'
import { Order } from "@/types/props/orderProp"
import { redirect, RedirectType } from "next/navigation"
const endpoint = 'http://localhost:4002'
const signKey = process.env.MERCHANRT_SIGN_KEY ?? '0000'
const mid = process.env.MERCHANRT_MID ?? '0000'
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
                mid: '',
                order_id: id,
                description: data.productId,
                amount: data.totalPrice,
                url_redirect: '',
                url_notify: '' //web เรา
            },
            headers: {
                'X-API-ID': '000',
                'X-API-Key': '',
                'X-Partner-ID': '',
                'X-Content-Signature': contentSignature(id, String(data.totalPrice))
            }
        })
        return response
        console.log('Response data:', response.data)
    } catch (error) {
        console.log('Error posting data:',error)
    }



    
}
export const fetchOrders = async(id:string) => {
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
