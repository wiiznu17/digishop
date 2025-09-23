"use client";

import { JSX, SetStateAction, useEffect, useState } from "react";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import InputField from "@/components/inputField";
import { Home } from "lucide-react";
import { Address } from "@/types/props/addressProp";
import { Noto_Sans_Thai_Looped, Rubik } from "next/font/google";
import Button from "./button";
import { OrderDetail } from "@/types/props/orderProp";
import CancelReasonMaster from "../master/cancelReason.json";
import RefundReasonMaster from "../master/refundReason.json"
interface CancelOrderProps {
  isShowCancel: boolean;
  order: OrderDetail;
  reason: string;
  setReason: React.Dispatch<SetStateAction<string>>;
  detail: string;
  setDetail: React.Dispatch<SetStateAction<string>>;
  setIsShowCancel: React.Dispatch<SetStateAction<boolean>>;
  handleOnCancel: () => void;
}

interface CancelProp {
  reason: string;
  description?: string;
}
export const CancelOrder = ({
  isShowCancel,
  order,
  setIsShowCancel,
  reason,
  setReason,
  detail,
  setDetail,
  handleOnCancel,
}: CancelOrderProps) => {
  const [cancelData, setCancelData] = useState<CancelProp>();
  const handleOnConfirm = () => {
    if (!reason) return;
    setCancelData({
      reason: CancelReasonMaster[reason].label,
      description: detail,
    });
  };

  const handleSelectReson = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value);
  };
  const handleInputDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetail(e.target.value);
  };
  if (isShowCancel)
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
            className={`my-3 rounded-md bg-white ${reason == "CC00" ? "opacity-100" : "opacity-0"}`}
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
  isShowRefund: boolean;
  order: OrderDetail;
  reason: string;
  setReason: React.Dispatch<SetStateAction<string>>;
  detail: string;
  setDetail: React.Dispatch<SetStateAction<string>>;
  setIsShowRefund: React.Dispatch<SetStateAction<boolean>>;
  handleOnCancel: () => void;
}
export const RefundOrder = ({
  isShowRefund,
  order,
  setIsShowRefund,
  reason,
  setReason,
  detail,
  setDetail,
  handleOnCancel,
}: RefundOrderProps) => {
  const [refundData, setRefundData] = useState<CancelProp>();
  const handleOnConfirm = () => {
    if (!reason) return
    setRefundData({
      reason: RefundReasonMaster[reason].label,
      description: detail,
    });
  };

  const handleSelectReson = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setReason(e.target.value);
  };
  const handleInputDetail = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetail(e.target.value);
  };
  if (isShowRefund)
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
            className={`my-3 rounded-md bg-white ${reason == "RF00" ? "opacity-100" : "opacity-0"}`}
          >
            <div className="">
              <InputField
                label=""
                placeholder="refund reason detail"
                name="detail"
                value={detail}
                className="h-auto"
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
