"use client";
import { OrderDetail, CancelRefundProps } from "@/types/props/orderProp";
import Link from "next/link";
import Button from "./button";
import { CancelOrder, RefundOrder } from "./orderCancelCard";
import { SetStateAction, useState } from "react";
import { SquareChevronRight } from "lucide-react";
import OrderStatusConfig from "../master/statusOrderDetail.json";
import CancelReasonMaster from "../master/cancelReason.json";
import { updateOrderStatus } from "@/utils/requestUtils/requestOrderUtils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface OrderCard {
  item: OrderDetail;
  handleShowDetail: (item: OrderDetail) => void;
  selectShowDetail: OrderDetail | undefined;
  setIsShowCancel: React.Dispatch<SetStateAction<CancelRefundProps>>;
  setIsShowRefund: React.Dispatch<SetStateAction<CancelRefundProps>>;
  isShowCancel:CancelRefundProps
  isShowRefund:CancelRefundProps
}


export default function OrderCard({
  item,
  handleShowDetail,
  selectShowDetail,
  isShowCancel,
  isShowRefund,
  setIsShowCancel,
  setIsShowRefund,

}: OrderCard) {
  const router = useRouter()
  const {user} = useAuth()
  const [reasonCancel, setReasonCancel] = useState<string>("CC01");
  const [reasonRefund, setReasonRefund] = useState<string>("RF01");
  const [detail, setDetail] = useState<string>("");
  const handleOnCancel = () => {
    setIsShowCancel({shown: false, id: undefined});
    setIsShowRefund({shown: false, id: undefined});
    setReasonCancel("CC01");
    setReasonRefund("RF01")
    setDetail("");
  };
  console.log(isShowRefund)
  const handleConfirmed = async() => {
    const data = await updateOrderStatus(item.id)
    if(data.data){
      window.location.reload()
    }
  }
  if(!user)return
  return (
    <div className=" px-4 py-2 mb-5 border w-md rounded-2xl ">
      <div>{item.id}</div>
      <div>
        { item.items[0].productItem&& 
          <button className="flex items-center mb-3 hover:cursor-pointer w-full" onClick={() => router.push(`http://localhost:3000/digishop/store/${item.items[0].productItem.product.store.uuid}`)}>
            <div className=" w-[70px] h-[70px] rounded-full bg-amber-300"></div>
            <div className="mx-4" >
              {item.items[0].productItem.product.store.storeName}
            </div>
          </button>
        }
        {item.items.map((items, index) => (
          <div key={index}>
            {!items.productItem && <div>{items.productNameSnapshot}</div>}
            {items.productItem && (
              <button className="w-full hover:cursor-pointer"  onClick={() => router.push(`http://localhost:3000/digishop/product/${item.items[0].productItem.product.uuid}`)}>
                <div className="flex gap-4 relative mb-2">
                  <div className="w-[100px] h-[100px] bg-amber-700"></div>
                  <div>
                    <div className="flex-1">
                      <div >{items.productItem.product.name}</div>
                      <div className="text-xs text-gray-500 ">
                        {items.productItem.sku}
                      </div>
                      <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                        x {String(items.quantity)}
                      </div>
                      <div className="absolute bottom-5 right-0  text-gray-500 ">
                       ฿ { (items.unitPriceMinor / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") } 
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        ))}
        <div className="flex justify-end border-b mb-2 pb-2">
          total ฿ {(item.grand_total_minor /100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
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
              hidden={isShowCancel.shown}
              onClick={() => setIsShowCancel({ shown: true , id: item.id})}
            >
              Cancel
            </Button>
          </>
        )}
        {OrderStatusConfig[item.status].cancel == "refund" && (
          <>
            <Button
              color="bg-red-300"
              hidden={isShowRefund.shown}
              onClick={() => setIsShowRefund({ shown: true , id: item.id})}
            >
              Refund
            </Button>
            <Button color="bg-green-300" hidden={isShowRefund.shown} className="ml-4" onClick={handleConfirmed}>
              Confirmed
            </Button>
          </>
        )}
      </div>
      {
        (item.id === isShowCancel.id || item.id === isShowRefund.id) && (
          <div>
            <RefundOrder
              isShowRefund={isShowRefund}
              setIsShowRefund={setIsShowRefund}
              email={user.email}
              order={item}
              reason={reasonRefund}
              setReason={setReasonRefund}
              detail={detail}
              setDetail={setDetail}
              handleOnCancel={handleOnCancel}
            />
            <CancelOrder
              isShowCancel={isShowCancel}
              email={user.email}
              order={item}
              setIsShowCancel={setIsShowCancel}
              reason={reasonCancel}
              setReason={setReasonCancel}
              detail={detail}
              setDetail={setDetail}
              handleOnCancel={handleOnCancel}
            />
          </div>
        )
      }
    </div>
  );
}
