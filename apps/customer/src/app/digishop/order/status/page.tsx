"use client";

import Button from "@/components/button";
import OrderCard from "@/components/orderCard";
import OrderDetailPage from "@/components/orderDetail";
import { useAuth } from "@/contexts/auth-context";
import { CancelRefundProps, Order, OrderDetail, Orders } from "@/types/props/orderProp";
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
  const [orders, setOrders] = useState<OrderDetail[]>();
  const [count, setCount] = useState<number>();
   const [isShowCancel, setIsShowCancel] = useState<CancelRefundProps>({shown: false, id: undefined });
  const [isShowRefund, setIsShowRefund] = useState<CancelRefundProps>({shown: false, id: undefined });
  const [selectShowDetail, setSelectShowDetail] = useState<
    OrderDetail | undefined
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
  console.log(orders)
  if (!orders) return;
  const getFilterOrder = () => {
    if (!orders) return;
    return orders.filter((order) =>
      StateConfig[selectStatus].status.includes(order.status)
    );
  };
  const filterOrder = getFilterOrder();
  const handleChangeState = (state: string) => {
    setIsShowCancel({shown: false, id: undefined})
    setIsShowRefund({shown: false, id: undefined})
    setSelectStatus(state);
    setSelectShowDetail(undefined);
  };
  const handleShowDetail = (order: OrderDetail) => {
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
                    >
                      <OrderCard item={order} handleShowDetail={handleShowDetail} selectShowDetail={selectShowDetail} setIsShowCancel={setIsShowCancel} setIsShowRefund={setIsShowRefund} isShowCancel={isShowCancel} isShowRefund={isShowRefund} />
                    </div>
                ))
                ) : (
                <div>no info</div>
                )}
            </div>
        </div>
        <div >
          {selectShowDetail != undefined && (
            <OrderDetailPage order={selectShowDetail} />
          )}
        </div>
      </div>      
    </div>
  );
}
