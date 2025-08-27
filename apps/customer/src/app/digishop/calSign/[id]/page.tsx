'use client'
import { Order } from '@/types/props/orderProp'
import { fetchOrders } from '@/utils/requestUtils/requestOrderUtils'
import crypto from 'crypto'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Copy } from "lucide-react";
export default function CalOrderid() {
    const {id} = useParams()
    const signKey = process.env.MERCHANRT_SIGN_KEY ?? '5LxvCzMEgCYb6kv+v23M3D1d4lnOHE1CiuA+uO8QTpM='
    const mid = process.env.MERCHANRT_MID ?? '0691001119'
    const [order, setOrder] = useState<Order>()
    const [conS, setConS] = useState()
    useEffect(() => {
        const fetchOrder = async() => {
            const res = await fetchOrders(id)
            setOrder(res.body)
        }
        fetchOrder()
    },[id])
    console.log(order)
    const orderId = 'DGS'+ Date.now() + '1' + '2' + '12'
    const copylink = (e) => {
        navigator.clipboard.writeText(conS)
    }
    useEffect(() => {
        if(!order?.id) return
        const contentSignature = (orderId: string,description:string, amount:number,url_re:string,url_noti:string) => {
            const payload = {mid,orderId,description,amount,url_re,url_noti}
            console.log('payload',payload)
            console.log('signKey',String(signKey))
            const hmac = crypto.createHmac('sha256', Buffer.from(signKey, 'base64'))
            return  hmac.update(JSON.stringify(payload)).digest('base64')
        }
        const con = contentSignature(String(order?.id),'2',Number(order?.totalPrice), 'http://localhost:3000/digishop', 'http://localhost:3000/digishop')
        setConS(con)
    },[order, mid , signKey,])
    if(!order) return
    return (

        <div className='text-3xl text-black p-4'>
            <div className='flex m-3'>
                <div className='mx-2'>Id {order.id}</div>
                <div className='w-[50px]'></div>
                <div>totalPrice {order.totalPrice}</div>
            </div>
            <div className='flex'>
                <div className='text-xs text-red-800 m-2 p-4 bg-amber-100'>
                {
                    conS
                }
                </div>
                <Copy onClick={copylink} size={100} className='relative cursor-pointer'/>
            </div>
            <div>{ orderId }</div>
        </div>
    )

}