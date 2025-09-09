"use client";

import Button from "@/components/button";
import OrderCard from "@/components/orderCard";
import OrderDetailPage from "@/components/orderDetail";
import { useAuth } from "@/contexts/auth-context";
import { Order, OrderDetail, Orders } from "@/types/props/orderProp";
import {CancelOrder} from "@/components/orderCancelCard";
import {
  fetchOrders,
  fetchUserOrders,
} from "@/utils/requestUtils/requestOrderUtils";
import { Rubik } from "next/font/google";
import { SetStateAction, useEffect, useState } from "react";
import StateConfig from './../../../../master/statusOrderConfig.json'

const rubik = Rubik({
  subsets: ["latin"],
  weight: "300"
})
export default function OrderStatus() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Orders[]>();
  const [count, setCount] = useState<number>();
  const [ isShowCancel ,setIsShowCancel] = useState<boolean>()
  const [selectShowDetail, setSelectShowDetail] = useState<
    Orders | undefined
  >();
  const [orderDetail, setOrderDetail] = useState<OrderDetail>();
  const [selectStatus, setSelectStatus] = useState<string>("PENDING");
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const data = await fetchUserOrders(user.id);
      const { body, count } = data;
      setOrders(body);
      setCount(count);
    };
    fetchData();
  }, [user]);
  useEffect(() => {
    if(!user)return
    const fetchOrder = async () => {
      const res = await fetchOrders(Number(selectShowDetail?.id),user.id);
      setOrderDetail(res.body);
    };
    fetchOrder();
  }, [selectShowDetail,user]);
  console.log(orderDetail);
  if (!orders) return;
  const getFilterOrder = () => {
    if (!orders) return;
    return orders.filter((order) =>
      StateConfig[selectStatus].status.includes(order.status)
    );
  };
  const findOrder = (findId:number) => {
    if (!orders) return;
    return orders.filter((order) => 
      order.id == findId
    )
  }
  const filterOrder = getFilterOrder();
  const handleChangeState = (state: string) => {
    setSelectStatus(state);
    setSelectShowDetail(undefined);
  };
  const handleShowDetail = (order: Orders) => {
    setSelectShowDetail(order);
  };
  return (
    <div className="mx-20">
      <div className="flex items-center justify-center space-x-20 p-3">
        {Object.entries(StateConfig).map(([state, config]) => (
          <div key={state}>
            <Button
              onClick={() => handleChangeState(state)}
              className={`${state == selectStatus ? "bg-blue-300" : "bg-green-200"} ${rubik.className}`}
            >
              {config.label}
            </Button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2">
        <div className="flex justify-center">
            <div className="flex flex-col">
                {filterOrder.length > 0 ? (
                filterOrder.map((order, index: number) => (
                    <div key={index} 
                    // onClick={() => handleShowDetail(order)}
                    >
                      <OrderCard item={order} handleShowDetail={handleShowDetail} selectShowDetail={selectShowDetail}/>
                    </div>
                ))
                ) : (
                <div>no info</div>
                )}
            </div>
        </div>
        <div >
          {selectShowDetail != undefined && (
            <OrderDetailPage order={orderDetail} />
          )}
        </div>
      </div>      
    </div>
  );
}
