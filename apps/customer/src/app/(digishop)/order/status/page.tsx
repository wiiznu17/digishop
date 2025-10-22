"use client";

import OrderCard from "@/components/orderCard";
import { useAuth } from "@/contexts/auth-context";
import { CancelProp, CancelRefundProps, OrderDetail } from "@/types/props/orderProp";
import {
  fetchUserOrders,
} from "@/utils/requestUtils/requestOrderUtils";
import {  useEffect, useState } from "react";
import StateConfig from '@/master/statusOrderConfig.json'


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
    <div >
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {Object.entries(StateConfig).map(([state, config]) => {
              // const Icon = status.icon;
              const isActive = state === selectStatus;
              
              return (
                <button
                  key={state}
                  // onClick={() => setActiveStatus(status.id)}
                   onClick={() => handleChangeState(state as keyof typeof StateConfig)}
                  className={`
                    grid grid-cols-4 lg:grid-cols-8 items-center gap-2 px-15 py-6 font-medium text-sm whitespace-nowrap
                    border-b-2 transition-all duration-300
                    ${isActive 
                      ? "border-blue-600 text-blue-600 bg-blue-50" 
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                >
                  {/* <Icon className="w-4 h-4" /> */}
                  <span className="text-xl font-bold">{config.label}</span>
                  
                </button>
              );
            })}
          </div>
          </div>
        <div className="flex justify-center items-center mt-5">
           <div >
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
       
           
    </div>
  );
}
