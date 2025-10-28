"use client";
import {
  OrderDetail,
  CancelRefundProps,
  CancelProp,
} from "@/types/props/orderProp";
import Image from "next/image";
import Button from "./button";
import { CancelOrder, RefundOrder } from "./orderCancelCard";
import { SetStateAction, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Truck } from "lucide-react";
import OrderStatusConfig from "../master/statusOrderDetail.json";
import {
  updateOrderStatus,
  revokeCancelOrder,
} from "@/utils/requestUtils/requestOrderUtils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  formatAddress,
  formatSku,
  formatTime,
  formatTimeZoneTH,
} from "@/lib/function";
import {
  OrderStatus,
  RefundStatus,
} from "../../../../packages/db/src/types/enum";
import PaymentMethodMaster from "../master/paymentMethod.json";

interface OrderCard {
  item: OrderDetail;
  handleShowDetail: (item: OrderDetail) => void;
  selectShowDetail: OrderDetail | undefined;
  setIsShowCancel: React.Dispatch<SetStateAction<CancelRefundProps>>;
  setIsShowRefund: React.Dispatch<SetStateAction<CancelRefundProps>>;
  isShowCancel: CancelRefundProps;
  isShowRefund: CancelRefundProps;
  setSelectShowCancel: React.Dispatch<SetStateAction<CancelProp | undefined>>;
  selectShowCancel: CancelProp | undefined;
}

export default function OrderCard({
  item,
  isShowCancel,
  isShowRefund,
  setIsShowCancel,
  setIsShowRefund,
}: OrderCard) {
  const router = useRouter();
  const { user } = useAuth();
  const [reasonCancel, setReasonCancel] = useState<string>("CC01");
  const [reasonRefund, setReasonRefund] = useState<string>("RF01");
  const [detail, setDetail] = useState<string>("");
  const [isShow, setIsShow] = useState<boolean>(false);
  const [isShowRefundDetail, setIsShowRefundDetail] = useState<boolean>(false);
  const [refundId, setRefundId] = useState<number>(0);
  const [now, setNow] = useState<number | null>(null);
  const handleRevokeCancel = async (id: number) => {
    const data = (await revokeCancelOrder(id)) as { data: string }; //check return
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
    const data = (await updateOrderStatus(item.id)) as { data: string }; //check return
    if (data.data) {
      window.location.reload();
    }
  };

  const end = item.checkout.payment?.expiryAt
    ? new Date(item.checkout.payment.expiryAt).getTime()
    : null;
  const remaining: null | number =
    end !== null && now !== null ? end - now : null;
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  if (!user) return;
  return (
    <div className="px-4 py-2 mb-5 border w-2xl rounded-2xl">
      <div>
        {item.items[0].productItem && (
          <button
            className="flex items-center mb-3 hover:cursor-pointer w-full"
            onClick={() =>
              router.push(
                `/store/${item.items[0].productItem.product.store.uuid}`
              )
            }
          >
            <div className="pt-2 text-2xl font-medium">
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
                    `/product/${item.items[0].productItem.product.uuid}`
                  )
                }
              >
                <div className="flex gap-4 relative mb-2">
                  {item.items[0].productItem.productItemImage && (
                    <Image
                      alt={item.items[0].productItem.productItemImage.blobName}
                      src={item.items[0].productItem.productItemImage.url}
                      width={200}
                      height={200}
                      className="object-fill w-[120px] h-[120px] "
                    />
                  )}
                  <div>
                    <div className="flex-1">
                      <div className="flex justify-start mb-1 text-2xl font-medium">
                        {items.productItem.product.name}
                      </div>
                      <div className="flex justify-start font-ligth text-lg text-gray-500 ">
                        {formatSku(items.productItem.configurations)}
                      </div>
                      <div className="absolute bottom-0 right-0 text-lg  text-gray-500 ">
                        x {String(items.quantity)}
                      </div>
                      <div className="absolute bottom-7 right-0  text-gray-500 text-2xl">
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
        {item.grand_total_minor > 0 && (
          <>
            <div>
              <div className="flex justify-end items-center text-gray-500 text-2xl">
                <Truck size={25} className="mr-2"/>
                <div>
                  ฿ {(item.shippingInfo.shippingType.price / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}

                </div>
              
              </div>
            <div className=" flex justify-end text-2xl font-medium  my-2 pb-2">
            total ฿{" "}
            {(item.grand_total_minor / 100)
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </div>
            </div>
            
            
          </>
          
        )}

        {item.status !== "PENDING" && (
          <div className={`px-5 py-7 rounded-2xl  ${OrderStatusConfig[
                    item.status as keyof typeof OrderStatusConfig
                  ].color}`}>
            <div className="flex justify-between items-center">
              <div className="text-xl">
                {
                  OrderStatusConfig[
                    item.status as keyof typeof OrderStatusConfig
                  ].label
                }
              </div>
            </div>
          </div>
        )}
        {/* ราคาที่จ่าย */}
      </div>

      {item.status === "PENDING" &&
        item.checkout.payment?.pgw_status === "PENDING" && (
          <div>
            <div className="flex text-lg">
              <div className="mr-2">
                ref: {item.checkout.payment?.providerRef} paid in
              </div>
              <div className="">
                {remaining && formatTime(remaining / 1000)}
              </div>
            </div>
          </div>
        )}

      {item.checkout.payment === null && (
        <div className="flex justify-end mt-2 ">
          <Button
            className="mr-2 text-xl"
            onClick={() => router.push(`/order/${item.checkout.orderCode}`)
          }
          >
            continue order
          </Button>
          {/* <Button onClick={() =>  handleCustomerCancel(item.id)}>cancel order</Button>  */}
        </div>
      )}

      {isShow && (
        <div className="">
          <div className=" bg-amber-50 rounded-2xl mb-2 ">
            
          </div>
          <div className=" rounded-2xl mb-2">
            <div className="border-b w-fit py-2 text-2xl font-medium mb-2">Address</div>
            <div className="text-xl pl-3">
              <div className="font-medium">
              {item.shippingInfo.address.recipientName}
            </div>
            <div className="ml-5">
              <p>{formatAddress(item.shippingInfo.address)}</p>
              <p>{item.shippingInfo.address.phone}</p>
            </div>
            <div className="flex">
              <div className="font-medium">
              Shipping Type
            </div>
            <div className="ml-4">
              {item.shippingInfo.shippingType.name}
            </div>
            </div>
           
            </div>
            
          </div>
          <div className="">
            <div className="border-b py-2 text-2xl font-medium mb-2 w-fit">Payment</div>
            <div className="text-xl pl-2">
              <div >
              {typeof item.checkout.payment?.payment_method === "number" && (
                <div>
                  paid by{" "}
                  {
                    PaymentMethodMaster[
                      item.checkout.payment
                        ?.payment_method as keyof typeof PaymentMethodMaster
                    ].label
                  }
                </div>
              )}
            </div>
            <div className="my-2 ">
              transaction :{" "}
              {item.checkout.payment?.paidAt
                ? formatTimeZoneTH(item.checkout.payment.paidAt.toString())
                : item.status === OrderStatus.PENDING
                  ? "waiting to pay"
                  : "-"}
            </div>
            </div>
            
          </div>

          {item.refundOrders.length > 0 && (
            <div>
              <div>
                <div className="flex border-b py-2 text-2xl font-medium mb-2 w-fit">
                  <div>Refund</div>
                  <button
                    onClick={() => setIsShowRefundDetail(!isShowRefundDetail)}
                    className={`hover:cursor-pointer mx-3 hover:bg-gray-300 trtransition-transform duration-300 ${isShowRefundDetail ? "rotate-180" : ""} `}
                  >
                    <ChevronDown />
                  </button>
                </div>
                {isShowRefundDetail && (
                  <div className="relative text-xl">
                    <div className="absolute top-0 right-0">
                      {item.refundOrders[refundId].status}
                    </div>
                    <div>reason: {item.refundOrders[refundId].reason}</div>
                    {item.refundOrders[refundId].description && (
                      <div>
                        description: {item.refundOrders[refundId].description}
                      </div>
                    )}
                    <div className="flex">
                      {item.refundOrders[refundId].status ==
                        RefundStatus.REQUESTED && item.refundOrders.length < 3 &&
                        typeof item.refundOrders[item.refundOrders.length - 1]
                          .id == "number" && (
                          <Button
                            size="md"
                            className="text-lg mt-2 bg-red-500 text-white flex justify-end items-end"
                            onClick={() => {
                              const refundOrderId =
                                item.refundOrders[refundId].id;
                              if (typeof refundOrderId === "number") {
                                handleRevokeCancel(refundOrderId);
                              }
                            }}
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
                color="bg-red-500 text-white"
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
                color="bg-red-500 text-white "
                hidden={isShowRefund.shown}
                onClick={() => setIsShowRefund({ shown: true, id: item.id })}
              >
                Refund
              </Button>
              <Button
                color="bg-green-500 text-white"
                hidden={isShowRefund.shown}
                className="ml-4"
                onClick={handleConfirmed}
              >
                Confirmed
              </Button>
            </>
          )}
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
      <div className="flex justify-center items-center">
          <button
            onClick={() => setIsShow(!isShow)}
            hidden={item.checkout.payment === null}
            className={`hover:cursor-pointer hover:bg-gray-300 trtransition-transform duration-300 ${isShow ? "rotate-180" : ""} `}
          >
            <ChevronDown />
          </button>
        </div>
    </div>
  );
}
