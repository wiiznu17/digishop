'use client'

import OrderCard from "@/components/orderCard"
import { useAuth } from "@/contexts/auth-context"
import { Orders } from "@/types/props/orderProp"
import {fetchUserOrders } from "@/utils/requestUtils/requestOrderUtils"
import { useEffect, useState } from "react"

export default function OrderStatus(){
    const {user} = useAuth()
    const [orders, setOrders] = useState()
    const [count, setCount] = useState<number>()
    useEffect(()=>{
        const fetchData = async() => {
            if(!user) return
            const data = await fetchUserOrders(user?.id)
            const {body, count} = data
            setOrders(body)
            setCount(count)
            console.log(body)
        }
        fetchData()
    },[user])
    if(!orders)return 
    return (
        <div className="p-3">
            {
                orders.map((order: Orders,index: number) => (
                    <div key={index}>
                        <OrderCard item={order} />
                    </div>
                ))
            }
        </div>
    )
}