"use client";

import Button from "@/components/button";
import OrderCard from "@/components/orderCard";
import { useAuth } from "@/contexts/auth-context";
import { CancelProp, CancelRefundProps, OrderDetail } from "@/types/props/orderProp";
import {
  fetchUserOrders,
} from "@/utils/requestUtils/requestOrderUtils";
import { Rubik } from "next/font/google";
import {  useEffect, useState } from "react";
import StateConfig from '@/master/statusOrderConfig.json'

const rubik = Rubik({
  subsets: ["latin"],
  weight: "300"
})
export default function OrderStatus() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderDetail[]>();
  const [isShowCancel, setIsShowCancel] = useState<CancelRefundProps>({shown: false, id: undefined });
  const [isShowRefund, setIsShowRefund] = useState<CancelRefundProps>({shown: false, id: undefined });
  const [selectShowDetail, setSelectShowDetail] = useState<
    OrderDetail | undefined
  >();
  const [selectShowCancel, setSelectShowCancel] = useState<
    CancelProp | undefined
  >();

  const [selectStatus, setSelectStatus] = useState<keyof typeof StateConfig>("PENDING");
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const data = (await fetchUserOrders(user.id)) as ({ body: OrderDetail[], count: number });
      const { body } = data;
      setOrders(body);
    };
    fetchData();
  }, [user]);
  console.log(orders)
  if (!orders) return;
  const getFilterOrder = () => {
    if (!orders) return;
    return orders
      .map(order => ({
        ...order,
        timeStamp: Date.parse(order.created_at)
      }))
      .filter((order) => {
        const cfg = StateConfig[selectStatus];
        const statuses = Array.isArray(cfg.status) ? cfg.status : [cfg.status];
        return statuses.includes(order.status);
      });
  };
  const handleChangeState = (state: keyof typeof StateConfig) => {
    setIsShowCancel({shown: false, id: undefined})
    setIsShowRefund({shown: false, id: undefined})
    setSelectStatus(state);
    setSelectShowDetail(undefined);
    setSelectShowCancel(undefined);
  };
   const filterOrder = getFilterOrder() ? getFilterOrder() : null;
   const handleShowDetail = (order: OrderDetail) => {
    setSelectShowDetail(order);
  };
  return (
    <div className="">
      <div className="flex sticky top-0 items-center bg-white justify-between space-x-20 py-3 px-60 z-100 border-b mb-5">
        {Object.entries(StateConfig).map(([state, config]) => (
          <div key={state}>
            <Button
              onClick={() => handleChangeState(state as keyof typeof StateConfig)}
              className={`${state == selectStatus ? "bg-blue-300" : "bg-green-200"} ${rubik.className} `}
            >
              {config.label}
            </Button>
          </div>
        ))}
      </div>   


        <div className="flex justify-center">
            {filterOrder ? (
              filterOrder.map((order, index: number) => (
                  <div key={index} 
                  >
                    <OrderCard item={order} handleShowDetail={handleShowDetail} selectShowDetail={selectShowDetail} setIsShowCancel={setIsShowCancel} setIsShowRefund={setIsShowRefund} setSelectShowCancel={setSelectShowCancel} selectShowCancel={selectShowCancel} isShowCancel={isShowCancel} isShowRefund={isShowRefund} />
                  </div>
              ))
              ) : (
              <div>no info</div>
              )}
        </div>
           
    </div>
  );
}
