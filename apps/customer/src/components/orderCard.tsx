"use client";
import { Orders } from "@/types/props/orderProp";
import Link from "next/link";
import Button from "./button";
import { CancelOrder, RefundOrder } from "./orderCancelCard";
import { SetStateAction, useState } from "react";
import { SquareChevronRight } from "lucide-react";
import OrderStatusConfig from '../master/statusOrderDetail.json'
import CancelReasonMaster from "../master/cancelReason.json";
interface OrderCard {
  item: Orders;
  handleShowDetail: (item:Orders) => void;
  selectShowDetail: Orders| undefined
}

export default function OrderCard({ item, handleShowDetail, selectShowDetail }: OrderCard) {
  const [isShowCancel, setIsShowCancel] = useState<boolean>(false);
  const [isShowRefund, setIsShowRefund] = useState<boolean>(false);
  const [reason, setReason] = useState<string>(CancelReasonMaster["CC01"].label);
  const [detail, setDetail] = useState<string>("");
  const handleOnCancel = () => {
    setIsShowCancel(false);
    setIsShowRefund(false);
    setReason("");
    setDetail("");
  };
  console.log('select',selectShowDetail?.id)
  return (
    <div className=" p-5 mb-5 border w-md rounded-2xl ">
      <div>
        {item.items.map((items, index) => (
          <div key={index}>
        <div className="flex items-center mb-3">
          <div className="mx-4 w-[70px] h-[70px] rounded-full bg-amber-300"></div>
          <div className="">{items.product.store.storeName}</div>
        </div>
            <div className="flex gap-4 relative mb-2">
              <div className="w-[100px] h-[100px] bg-amber-700"></div>
              <div>
                <div className="flex-1">
                  <div>{items.product.name}</div>
                  <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                    x {String(items.quantity)}
                  </div>
                  <div className="absolute bottom-5 right-0  text-gray-500 ">
                    price: {items.unit_price_minor / 100}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end">
          total price: {item.grand_total_minor / 100}
        </div>
      </div>
      <div className={`flex justify-end ${isShowCancel || isShowRefund ?'':'border-b'}  py-3 mb-2`}>
        {OrderStatusConfig[item.status].cancel == "cancel" && (
          <>
            <Button color="bg-red-300" hidden={isShowCancel} onClick={() => setIsShowCancel(true)}>
              Cancel
            </Button>
          </>
        )}
        {OrderStatusConfig[item.status].cancel == "refund" && (
          <>
            <Button color="bg-red-300" hidden={isShowRefund} onClick={() => setIsShowRefund(true)}>
              Refund
            </Button>
            <Button color="bg-green-300" hidden={isShowRefund} className="mx-4">
              Confirmed
            </Button>
          </>
        )}
      </div>
      <div className="flex justify-between">
        <div className="">{OrderStatusConfig[item.status].label}</div>
        <button onClick={() => handleShowDetail(item)} className={`hover:cursor-pointer hover:bg-gray-300 ${item == selectShowDetail? 'opacity-0': 'opacity-100'}`} >
          <div>{item.id}</div>
          <SquareChevronRight />
        </button>
      </div> 
       <CancelOrder
        isShowCancel={isShowCancel}
        order={item}
        setIsShowCancel={setIsShowCancel}
        reason={reason}
        setReason={setReason}
        detail={detail}
        setDetail={setDetail}
        handleOnCancel={handleOnCancel}
      />
      <RefundOrder
        isShowRefund={isShowRefund}
        order={item}
        setIsShowRefund={setIsShowRefund}
        reason={reason}
        setReason={setReason}
        detail={detail}
        setDetail={setDetail}
        handleOnCancel={handleOnCancel}
      />
      <div>hi</div>
    </div>
  );
}
