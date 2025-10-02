"use client";

import { JSX, SetStateAction, useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import InputField from "@/components/inputField";
import { Home } from "lucide-react";
import { Address } from "@/types/props/addressProp";
import { Noto_Sans_Thai_Looped, Rubik } from "next/font/google";
import Button from "./button";
import { CancelProp, CancelRefundProps, OrderDetail } from "@/types/props/orderProp";
import CancelReasonMaster from "../master/cancelReason.json";
import RefundReasonMaster from "../master/refundReason.json"
import { cancelOrder } from "@/utils/requestUtils/requestOrderUtils";
import { describe } from "node:test";

interface CancelOrderProps {
  isShowCancel: CancelRefundProps;
  email: string
  order: OrderDetail;
  reason: string;
  setReason: React.Dispatch<SetStateAction<string>>;
  detail: string;
  setDetail: React.Dispatch<SetStateAction<string>>;
  setIsShowCancel: React.Dispatch<SetStateAction<CancelRefundProps>>;
  handleOnCancel: () => void;
}

export const CancelOrder = ({
  isShowCancel,
  order,
  email,
  reason,
  setReason,
  detail,
  setDetail,
  setIsShowCancel,
  handleOnCancel,
}: CancelOrderProps) => {
  useEffect(() => {
    setCancelData({
        reason: CancelReasonMaster[reason].label,
        description: detail,
        contactEmail: email
    });
  },[reason, detail, email])
  const [cancelData, setCancelData] = useState<CancelProp>();
  const handleOnConfirm = async() => {
    if (!reason) return;
    console.log(cancelData)
    setIsShowCancel({...isShowCancel, ['shown']: false})
      if(cancelData){
        const updateCancelOrder = await cancelOrder(order.id , cancelData)
        if(updateCancelOrder.data){
            window.location.reload()
          }
      }
  };

  const handleSelectReson = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value);
  };
  const handleInputDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetail(e.target.value);
  };
  if (isShowCancel.shown)
    return (
      <div>
        <div className=" m-1 pt-2 bg-white border-t">
          <div>I want to cancel this order</div>
        </div>
        <div className="mb-3 px-4 rounded-md bg-white">
          <div>because</div>
          <select
            name="reason"
            value={reason}
            onChange={handleSelectReson}
            className="border border-gray-500 p-3 mt-2 rounded-2xl "
          >
            <option id="1" value="CC01" className="mx-3">
              I don&apos;t want this the order.
            </option>
            <option id="2" value="CC02" className="mx-3">
              I ordered the wrong item.
            </option>
            <option id="3" value="CC03" className="mx-3">
              I need to change the shipping address.
            </option>
            <option id="4" value="CC04" className="mx-3">
              I found a store with a better price.
            </option>
            <option id="5" value="CC05" className="mx-3">
              I found a better product.
            </option>
            <option id="6" value="CC00" className="mx-3">
              other
            </option>
          </select>
          <div
            className={`my-3 rounded-md bg-white`}
          >
            <div className="">
              <InputField
                label=""
                placeholder="cancel reason detail"
                name="detail"
                value={detail}
                className="h-auto"
                onChange={handleInputDetail}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end px-6">
          <Button
            size="sm"
            onClick={handleOnCancel}
            className=" bg-red-300  mx-2"
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleOnConfirm} color="bg-green-300">
            Confirm
          </Button>
        </div>
      </div>
    );
};
interface RefundOrderProps {
  isShowRefund: CancelRefundProps;
  setIsShowRefund: React.Dispatch<SetStateAction<CancelRefundProps>>;
  email: string,
  order: OrderDetail;
  reason: string;
  setReason: React.Dispatch<SetStateAction<string>>;
  detail: string;
  setDetail: React.Dispatch<SetStateAction<string>>;
  handleOnCancel: () => void;
}
export const RefundOrder = ({
  isShowRefund,
  setIsShowRefund,
  order,
  email,
  reason,
  setReason,
  detail,
  setDetail,
  handleOnCancel
}: RefundOrderProps) => {
  console.log('shown')
  const [refundData, setRefundData] = useState<CancelProp>();
  useEffect(() => {
    setRefundData({
      reason: RefundReasonMaster[reason].label,
      description: detail,
      contactEmail: email
    });
  },[reason, detail,email])
  const handleOnConfirm = async() => {
    if (!reason) return
    console.log(refundData)
    setIsShowRefund({ ...isShowRefund, ['shown']: false})
      if(refundData){
          const updateCancelOrder = await cancelOrder(order.id , refundData)
          if(updateCancelOrder.data){
              window.location.reload()
            }
        }
  };

  const handleSelectReson = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value);
  };
  const handleInputDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetail(e.target.value);
  };
  if(isShowRefund.shown)
    return (
      <div>
        <div className=" m-1 pt-2 bg-white border-t">
          <div>I want to refund this order</div>
        </div>
        <div className="mb-3 px-4 rounded-md bg-white">
          <div>because</div>
          <select
            name="reason"
            value={reason}
            onChange={handleSelectReson}
            className="border border-gray-500 p-3 mt-2 rounded-2xl "
          >
            <option id="1" value="RF01" className="mx-3">
              I don&apos;t want this the order.
            </option>
            <option id="2" value="RF02" className="mx-3">
              The item arrived damaged.
            </option>
            <option id="3" value="RF03" className="mx-3">
              The order is incomplete.
            </option>
            <option id="4" value="RF04" className="mx-3">
              I received the wrong item.
            </option>
            <option id="5" value="RF05" className="mx-3">
              The delivery was delayed.
            </option>
            <option id="6" value="RF06" className="mx-3">
              I am not satisfied with the product.
            </option>
            <option id="7" value="RF00" className="mx-3">
              other
            </option>
          </select>
          <div
            className={`my-3 rounded-md bg-white }`}
          >
            <div className="">
              <InputField
                label=""
                placeholder="refund reason detail"
                name="detail"
                value={detail}
                onChange={handleInputDetail}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end ">
          <Button
            size="sm"
            onClick={handleOnCancel}
            className=" bg-red-300  mx-2"
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleOnConfirm} color="bg-green-300">
            Confirm
          </Button>
        </div>
      </div>
    );
};
