"use client";
import {
  OrderDetail,
  CancelRefundProps,
  CancelProp,
} from "@/types/props/orderProp";
import Link from "next/link";
import Button from "./button";
import { CancelOrder, RefundOrder } from "./orderCancelCard";
import { SetStateAction, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Slash,
  SquareChevronRight,
} from "lucide-react";
import OrderStatusConfig from "../master/statusOrderDetail.json";
import CancelReasonMaster from "../master/cancelReason.json";
import {
  updateOrderStatus,
  revokeCancelOrder,
} from "@/utils/requestUtils/requestOrderUtils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Configurations } from "@/types/props/productProp";
import { formatAddress, formatSku, formatTime, formatTimeZoneTH } from "@/lib/function";
import { OrderStatus, RefundStatus } from "../../../../packages/db/src/types/enum";
import PaymentMethodMaster from "../master/paymentMethod.json";

interface OrderCard {
  item: OrderDetail;
  handleShowDetail: (item: OrderDetail) => void;
  selectShowDetail: OrderDetail | undefined;
  setIsShowCancel: React.Dispatch<SetStateAction<CancelRefundProps>>;
  setIsShowRefund: React.Dispatch<SetStateAction<CancelRefundProps>>;
  isShowCancel: CancelRefundProps;
  isShowRefund: CancelRefundProps;
  setSelectShowCancel: React.Dispatch<SetStateAction<CancelProp>>;
  selectShowCancel: CancelProp | undefined;
}

export default function OrderCard({
  item,
  handleShowDetail,
  selectShowDetail,
  isShowCancel,
  isShowRefund,
  setIsShowCancel,
  setIsShowRefund,
  setSelectShowCancel,
  selectShowCancel,
}: OrderCard) {
  const router = useRouter();
  const { user } = useAuth();
  const [reasonCancel, setReasonCancel] = useState<string>("CC01");
  const [reasonRefund, setReasonRefund] = useState<string>("RF01");
  const [detail, setDetail] = useState<string>("");
  const [isShow, setIsShow] = useState<boolean>(false);
  const [isShowRefundDetail, setIsShowRefundDetail] = useState<boolean>(false);
  const [refundId, setRefundId] = useState<number>(0);
  const [now, setNow] = useState<number|null>(null);
  // const [end, setEnd] = useState<number|null>(null);
  const handleRevokeCancel = async (id: number) => {
    const data = await revokeCancelOrder(id);
    if (data.data) {
      window.location.reload();
    }
  };
  const handleOnCancel = () => {
    setIsShowCancel({ shown: false, id: undefined });
    setIsShowRefund({ shown: false, id: undefined });
    setReasonCancel("CC01");
    setReasonRefund("RF01");
    setDetail("");
  };
  const handleConfirmed = async () => {
    const data = await updateOrderStatus(item.id);
    if (data.data) {
      window.location.reload();
    }
  };
 useEffect(() => {
//     if (!firstOrder) {
//       redirect('/', RedirectType.replace);
//       return ;
//     }
//     if (!orderDetail || !firstOrder?.checkout ) return;
//   const shouldOpen = localStorage.getItem("openPayment");
//   if (shouldOpen === "true" && orderDetail) {
//     paymentWeb(firstOrder.checkout.payment?.url_redirect)
//     localStorage.removeItem("openPayment");
//   }
  // if (orderDetail && firstOrder.checkout.payment?.pgw_status === "PENDING") {
  //   const expiry = new Date(item.checkout.payment.expiry_at).getTime();
  //   setEnd(expiry);
  // }
}, []);
  const end = item.checkout.payment?.expiryAt ? new Date(item.checkout.payment.expiryAt).getTime() : null;
  const remaining: null | number = (end !== null && now !== null) ? end - now : null;
  useEffect(() => {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
  }, []);
  if (!user) return;
  return (
    <div className="px-4 py-2 mb-5 border w-md rounded-2xl">
      <div>
        {item.items[0].productItem && (
          <button
            className="flex items-center mb-3 hover:cursor-pointer w-full"
            onClick={() =>
              router.push(
                `http://localhost:3000/store/${item.items[0].productItem.product.store.uuid}`
              )
            }
          >
            <div className="mx-4">
              {item.items[0].productItem.product.store.storeName}
            </div>
          </button>
        )}
        {item.items.map((items, index) => (
          <div key={index}>
            {!items.productItem && <div>{items.productNameSnapshot}</div>}
            {items.productItem && (
              <button
                className="w-full hover:cursor-pointer"
                onClick={() =>
                  router.push(
                    `http://localhost:3000/product/${item.items[0].productItem.product.uuid}`
                  )
                }
              >
                <div className="flex gap-4 relative mb-2">
                  <div className="w-[100px] h-[100px] bg-amber-700"></div>
                  <div>
                    <div className="flex-1">
                      <div className="flex justify-start mb-1">
                        {items.productItem.product.name}
                      </div>
                      <div className="flex justify-start text-xs text-gray-500 ">
                        {formatSku(items.productItem.configurations)}
                      </div>
                      <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                        x {String(items.quantity)}
                      </div>
                      <div className="absolute bottom-5 right-0  text-gray-500 ">
                        ฿{" "}
                        {(items.unitPriceMinor / 100)
                          .toString()
                          .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            )}
          </div>
        ))}
        {item.status !== "PENDING" && (
          <div>
            <div className="flex justify-end border-b mb-2 pb-2">
            total ฿{" "}
            {(item.grand_total_minor / 100)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </div>
          
          </div>
        )}
        {/* ราคาที่จ่าย */}
      </div>
      <div className="flex justify-between items-center">
        <div className="">
          {
            OrderStatusConfig[item.status as keyof typeof OrderStatusConfig]
              .label
          }
        </div>
      </div>
      {
        item.status === "PENDING" && (
          (
              <div>
                <div>{end}</div>
                {/* <div>{now}</div>  */}
                <div className="flex">
                  <div className="mr-2">
                    ref: {item.checkout.payment?.providerRef} paid in 
                  </div>
                  <div className="">
                  {
                    remaining && formatTime(remaining / 1000)
                  } 
                </div>
                </div>
                
              </div>
          )
        )
      }
      {isShow && (
        <div className="">
          <div className=" bg-amber-50 rounded-2xl mb-2 ">
            {/* <div className="font-bold flex justify-center">
              status : {OrderStatusConfig[item.status].label}
              </div> */}
          </div>
          <div className=" rounded-2xl mb-2">
            <div className="border-b py-2 text-2xl font-bold mb-2">Address</div>
            <div className="font-bold">
              {item.shippingInfo.address.recipientName}
            </div>
            <div className="ml-5">
              <p>{formatAddress(item.shippingInfo.address)}</p>
              <p>{item.shippingInfo.address.phone}</p>
            </div>
          </div>

          {/* <div className="bg-amber-50 rounded-2xl p-4 mb-2">
              <div className="border-b text-2xl mb-2 font-extrabold">
                Total
              </div>
              <div className="">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Product</span>
                  <span className="font-medium">
                    {(sumPriceProduct/100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">
                    <div>{order.shippingInfo.shippingType.name}</div>
                    <div className="ml-3">
                      <div className="text-sm ">estimatedDays: {order.shippingInfo.shippingType.estimatedDays}</div>
                    </div>
                  </span>
                  <span className="font-medium">{(order.shippingInfo.shippingType.price/100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                </div>
                <div className="border-t border-gray-400 pt-2 flex justify-end items-center">
                  <span className="text-lg font-semibold">฿ {(order.grand_total_minor/100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                </div>
              </div>
            </div> */}
          {item.checkout.payment?.paid_at && (
            <div className="">
              <div className="border-b py-2 text-2xl font-bold mb-2">
                Payment
              </div>
              {item.checkout.payment?.payment_method == "CREDIT_CARD" && (
                <div>paid by {PaymentMethodMaster["CREDIT_CARD"].label}</div>
              )}
              {item.checkout.payment?.payment_method == "QR" && (
                <div>paid by {PaymentMethodMaster["QR"].label}</div>
              )}
              
              <div className="my-2">
                transaction : {formatTimeZoneTH(item.checkout.payment.paid_at)}
              </div>
                
              
            </div>
          )}
          {item.refundOrders.length > 0 && (
            <div>
              <div>
                <div className="flex border-b py-2 text-2xl font-bold mb-2 ">
                  <div>Refund</div>
                  <button
                    onClick={() => setIsShowRefundDetail(!isShowRefundDetail)}
                    className={`hover:cursor-pointer mx-3 hover:bg-gray-300 trtransition-transform duration-300 ${isShowRefundDetail ? "rotate-180" : ""} `}
                  >
                    <ChevronDown />
                  </button>
                </div>
                {isShowRefundDetail && (
                  <div className="relative">
                    <div className="absolute top-0 right-0">
                      {item.refundOrders[refundId].status}
                    </div>
                    <div>reson: {item.refundOrders[refundId].reason}</div>
                    {item.refundOrders[refundId].description && (
                      <div>
                        description: {item.refundOrders[refundId].description}
                      </div>
                    )}
                    <div className="flex">
                      {item.refundOrders[refundId].status == RefundStatus.REQUESTED &&
                        typeof item.refundOrders[item.refundOrders.length - 1]
                          .id == "number" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleRevokeCancel(
                                item.refundOrders[refundId].id
                              )
                            }
                          >
                            cancel refund
                          </Button>
                        )}
                    </div>
                    <div className="flex justify-end">
                      <div className="flex items-center">
                        <button
                          onClick={() => setRefundId(refundId - 1)}
                          disabled={refundId === 0}
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <div>
                          {refundId + 1} / {item.refundOrders.length}
                        </div>
                        <button
                          onClick={() => setRefundId(refundId + 1)}
                          disabled={refundId === item.refundOrders.length - 1}
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div>
        <div className={`flex justify-end pt-2`}>
          {OrderStatusConfig[item.status as keyof typeof OrderStatusConfig]
            .cancel == "cancel" && (
            <>
              <Button
                color="bg-red-300"
                hidden={isShowCancel.shown}
                onClick={() => setIsShowCancel({ shown: true, id: item.id })}
              >
                Cancel
              </Button>
            </>
          )}
          {OrderStatusConfig[item.status as keyof typeof OrderStatusConfig]
            .cancel == "refund" && (
            <>
              <Button
                color="bg-red-300"
                hidden={isShowRefund.shown}
                onClick={() => setIsShowRefund({ shown: true, id: item.id })}
              >
                Refund
              </Button>
              <Button
                color="bg-green-300"
                hidden={isShowRefund.shown}
                className="ml-4"
                onClick={handleConfirmed}
              >
                Confirmed
              </Button>
            </>
          )}
        </div>
        <div className="flex justify-center items-center">
          <button
            onClick={() => setIsShow(!isShow)}
            className={`hover:cursor-pointer hover:bg-gray-300 trtransition-transform duration-300 ${isShow ? "rotate-180" : ""} `}
          >
            <ChevronDown />
          </button>
        </div>
      </div>
      {(item.id === isShowCancel.id || item.id === isShowRefund.id) && (
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
      )}
    </div>
  );
}
