'use client'

import OrderCard from "@/components/orderCard"
import OrderDetailPage from "@/components/orderDetail"
import { useAuth } from "@/contexts/auth-context"
import { Order, OrderDetail, Orders } from "@/types/props/orderProp"
import {fetchOrders, fetchUserOrders } from "@/utils/requestUtils/requestOrderUtils"
import { useEffect, useState } from "react"

export default function OrderStatus(){
    const {user} = useAuth()
    const [orders, setOrders] = useState<Orders[]>()
    const [count, setCount] = useState<number>()
    const [selectShowDetail, setSelectShowDetail] = useState<Orders|undefined>()
    const [orderDetail, setOrderDetail] = useState<OrderDetail>()
    const [selectStatus, setSelectStatus] = useState<string>('PENDING')
    useEffect(()=>{
        const fetchData = async() => {
            if(!user) return
            const data = await fetchUserOrders(user?.id)
            const {body, count} = data
            setOrders(body)
            setCount(count)
            console.log(body)
            console.log(orders)
        }
        fetchData()
    },[user, orders])
    useEffect(()=> {
        const fetchOrder = async() => {
                const res = await fetchOrders(selectShowDetail?.id)
                setOrderDetail(res.body)
        }
                fetchOrder()
                
    },[selectShowDetail])
    console.log(orderDetail)
    if(!orders)return 
    const stateConfig = {
        PENDING : {
            label: 'pending',
            value: 'PENDING',
            status: ['PAID']
        },
        PREPARE : {
            label: 'prepare',
            value: 'PREPARE',
            status: ["PROCESSING","READY_TO_SHIP","HANDED_OVER"]
        },
        TRANSIT : {
            label: 'transit',
            value: 'TRANSIT',
            status: ["SHIPPED","TRANSIT_LACK","RE_TRANSIT"]
        },
        COMPLETE:{
            label: 'complete',
            value: 'COMPLETE',
            status: ["RETURN_FAIL","REFUND_APPROVED","REFUND_SUCCESS","DELIVERED"]
        },
        CANCEL : {
            label: 'cancel',
            value: 'CANCEL',
            status:  [ "CUSTOMER_CANCELED" , "MERCHANT_CANCELED" ,]
        },
        CALM: {
            label: 'calm',
            value: 'CALM',
            status: ["REFUND_REQUEST","AWAITING_RETURN","RECEIVE_RETURN","RETURN_VERIFIED",]
        },
    }
    const getFilterOrder = () => {
        if(!orders)return
        return orders.filter((order) => stateConfig[selectStatus].status.includes(order.status) )
    }
    const filterOrder = getFilterOrder()
    const handleChangeState = (state:string) => {
        setSelectStatus(state)
        setSelectShowDetail(undefined)
    }
    const handleShowDetail = (order: Orders) => {
        setSelectShowDetail(order)
    }
    return (
        <div className="mx-20">
        <div className="flex items-center justify-center space-x-20 p-3">
            { Object.entries(stateConfig).map(([state,config]) => (
                <button key={state} className={` m-4  flex flex-col items-center p-4 rounded-xl ${state == selectStatus ? 'bg-blue-300':'bg-green-200'} justify-evenly `} onClick={()=> handleChangeState(state)}>
                    <div className="">
                        {config.label}
                    </div>
                </button>
            ))
        }
        </div>
        <div className="grid grid-cols-2">
        <div className="flex justify-center">
            <div>
        {
            filterOrder.length > 0 ? (
                filterOrder.map((order,index: number) => (
                    <button key={index} onClick={() => handleShowDetail(order)}>
                    <OrderCard item={order} />
                    </button>
                ))
            ):(
                <div>no info</div>
            )
            
        }
            </div>
        </div>
        <div className="bg-amber-100">
            {
                selectShowDetail != undefined && 
                <OrderDetailPage order={orderDetail}/>
            }
        </div>
        </div>
            </div>
    )
}