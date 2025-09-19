"use client";
import { OrderDetail } from "@/types/props/orderProp";
import Link from "next/link";
import Button from "./button";
import { CancelOrder, RefundOrder } from "./orderCancelCard";
import { SetStateAction, useState } from "react";
import { SquareChevronRight } from "lucide-react";
import OrderStatusConfig from "../master/statusOrderDetail.json";
import CancelReasonMaster from "../master/cancelReason.json";
interface OrderCard {
  item: OrderDetail;
  handleShowDetail: (item: OrderDetail) => void;
  selectShowDetail: OrderDetail | undefined;
}

export default function OrderCard({
  item,
  handleShowDetail,
  selectShowDetail,
}: OrderCard) {
  const [isShowCancel, setIsShowCancel] = useState<boolean>(false);
  const [isShowRefund, setIsShowRefund] = useState<boolean>(false);
  const [reason, setReason] = useState<string>(
    CancelReasonMaster["CC01"].label
  );
  const [detail, setDetail] = useState<string>("");
  const handleOnCancel = () => {
    setIsShowCancel(false);
    setIsShowRefund(false);
    setReason("");
    setDetail("");
  };
  return (
    <div className=" px-4 py-2 mb-5 border w-md rounded-2xl ">
      <div>
        { item.items[0].productItem&& 
          <div className="flex items-center mb-3">
            <div className=" w-[70px] h-[70px] rounded-full bg-amber-300"></div>
            <div className="mx-4">
              {item.items[0].productItem.product.store.storeName}
            </div>
          </div>
        }
        {item.items.map((items, index) => (
          <div key={index}>
            {!items.productItem && <div>{items.product_name_snapshot}</div>}
            {items.productItem && (
              <div>
                <div className="flex gap-4 relative mb-2">
                  <div className="w-[100px] h-[100px] bg-amber-700"></div>
                  <div>
                    <div className="flex-1">
                      <div>{items.productItem.product.name}</div>
                      <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                        x {String(items.quantity)}
                      </div>
                      <div className="absolute bottom-5 right-0  text-gray-500 ">
                        {items.unitPriceMinor / 100 } {item.currency_code}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-end border-b mb-2 pb-2">
          total {item.grand_total_minor /100} {item.currency_code}
        </div>
        {/* ราคาที่จ่าย */}
      </div>
      <div className="flex justify-between">
        <div className="">{OrderStatusConfig[item.status].label}</div>
        <button
          onClick={() => handleShowDetail(item)}
          className={`hover:cursor-pointer hover:bg-gray-300 ${item == selectShowDetail ? "opacity-0" : "opacity-100"}`}
        >
          <SquareChevronRight />
        </button>
      </div>
      <div
        className={`flex justify-end pt-2`}
      >
        {OrderStatusConfig[item.status].cancel == "cancel" && (
          <>
            <Button
              color="bg-red-300"
              hidden={isShowCancel}
              onClick={() => setIsShowCancel(true)}
            >
              Cancel
            </Button>
          </>
        )}
        {OrderStatusConfig[item.status].cancel == "refund" && (
          <>
            <Button
              color="bg-red-300"
              hidden={isShowRefund}
              onClick={() => setIsShowRefund(true)}
            >
              Refund
            </Button>
            <Button color="bg-green-300" hidden={isShowRefund} className="ml-4">
              Confirmed
            </Button>
          </>
        )}
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
    </div>
  );
}
