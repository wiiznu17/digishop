"use client";
import { useAuth } from "@/contexts/auth-context";
import { Address } from "@/types/props/addressProp";
import { Order, OrderDetail, Shipping } from "@/types/props/orderProp";
import { Product } from "@/types/props/productProp";
import {
  createOrder,
  fetchOrders,
  getShippingType,
} from "@/utils/requestUtils/requestOrderUtils";
import { getProduct } from "@/utils/requestUtils/requestProduct";
import { getAddress } from "@/utils/requestUtils/requestUserUtils";
import Link from "next/link";
import { redirect, RedirectType, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddressCard from "@/components/addressCard";
import ShippingCardDetail from "@/components/shippingCard";
import { DialogSelectAddress } from "@/components/dialogSelectAddress";
import {
  PaymentMethod,
  PaymentType,
} from "../../../../../../../packages/db/src/types/enum";
import InputField from "@/components/inputField";
import Button from "@/components/button";
import { ClipboardCheck, Minus, Plus } from "lucide-react";
import { useRouter } from 'next/navigation';
import PaymentMethodMaster from "../../../../master/paymentMethod.json"
// interface PaymentDetail {
//   label: string;
//   value: PaymentMethod;
// }
export default function OrderPage() {
  const { id } = useParams();
  const orderId = String(id);
  const [processStatus, setProcessStatus] = useState<number>(1);
  const [amount, setAmount] = useState(1);
  const [price, setPrice] = useState(0);
  const [order, setOrder] = useState<Order>();
  const [note, setNote] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>();
  const [selectAddress, setSelectAddress] = useState<Address>();
  const [shipping, setShipping] = useState<Shipping[]>();
  const [paymentMethod, setPaymentMethod] = useState<string>();
  const [selectShippingTypeId, setSelectShippingTypeId] = useState<number>(1);
  const [isShowSelectAddress, setIsShowSelectAddress] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail>();
  const router = useRouter()
  const { user } = useAuth();
  useEffect(() => {
    const fetchData = async () => {
      if(!user)return
      const resProduct = await fetchOrders(Number(orderId),user.id);
      const resAddress = await getAddress(user?.id);
      const resShipping = await getShippingType();
      setOrderDetail(resProduct.body);
      setAddresses(resAddress.data);
      setShipping(resShipping.data);
    };
    fetchData();
  }, [user,orderId]);
  
  useEffect(() => {
    const isMain = addresses?.filter((item) => item.isDefault === true);
    if (isMain) {
      setSelectAddress(isMain[0]);
    }
  }, [addresses]);
  useEffect(() => {
    if (!shipping) return;
    const sumprice =
      Number(shipping[selectShippingTypeId - 1].price) +
      Number(orderDetail?.items[0].unit_price_minor) * amount;
    setPrice(sumprice);
  }, [amount, selectShippingTypeId, shipping,orderDetail?.items]);
  useEffect(() => {
    if (
      !user ||
      !orderDetail ||
      !selectAddress ||
      !selectAddress.id ||
      !paymentMethod
    )
      return;
    setOrder({
      orderId: Number(orderId),
      productName: orderDetail.items[0].product.name,
      customerId: user.id,
      storeId: orderDetail.store.id,
      grandTotalMinor: price,
      productId: orderDetail.items[0].product.id,
      quantity: amount,
      unitPrice: orderDetail.items[0].unit_price_minor,
      shippingTypeId: selectShippingTypeId,
      shippingAddress: selectAddress.id,
      paymentMethod: paymentMethod,
      orderNote: note,
    });
  }, [
    orderId,
    amount,
    user,
    orderDetail,
    selectAddress,
    price,
    selectShippingTypeId,
    note,
    paymentMethod,
  ]);
  const formatAddress = (items: Address): string => {
    return [
      items.address_number,
      items.building,
      items.street,
      items.subStreet,
      items.district,
      items.subdistrict,
      items.province,
      items.postalCode,
      items.country,
    ]
      .filter(Boolean)
      .join(" ");
  };
  const handleOrder = async () => {
    if (!order) return;
    const res = await createOrder(order);
    console.log("res", res.data);
    if (res.data.redirect_url) {
      redirect(res.data.redirect_url, RedirectType.replace);
    }
    console.log(order);
  };

  if (user == null || user.id <= 0) return;
  const handleOnClickSelectAddress = (): void => {
    setIsShowSelectAddress(true);
  };
  const handleOnCancelSelectAddress = (): void => {
    setIsShowSelectAddress(false);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };
  const handlePayment = (e: string) => {
    setPaymentMethod(e);
  };
  if (!orderDetail || !shipping) return;
  return (
    <div>
    {
      orderDetail.payment.pgw_status == 'APPROVED' && 
      <div>
        <div className="flex justify-center items-center p-4 ">
              <div>
                <div className="flex mb-3">
                  <ClipboardCheck size={100} color="green"/>
                  <div className="text-4xl m-3 p-3">
                      Order is successful
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="flex">
                      <Button onClick={()=> router.replace('/digishop/order/status') } className="p-3  cursor-pointer text-black">see order status</Button>
                      <Button onClick={()=> router.replace('/digishop') } className="ml-6 p-4 bg-blue-300 cursor-pointer">back first page</Button>
                  </div>
                </div>
              </div>
            
        </div>
      </div>
    }
    {
      orderDetail.payment.pgw_status == 'CANCELED' && 
      <div>
        <div className="flex justify-center items-center p-4 ">
              <div>
                <div className="flex mb-3">                  
                  <div className="text-4xl m-3 p-3">
                      Order is failed
                  </div>                  
                  <p>you are cancel this order</p>                  
                </div>
                <div className="flex justify-center">
                  <div className="flex">
                      <Button onClick={()=> router.replace('/digishop/order/status') } className="p-3  cursor-pointer text-black">see order status</Button>
                      <Button onClick={()=> router.replace('/digishop') } className="ml-6 p-4 bg-blue-300 cursor-pointer">back first page</Button>
                  </div>
                </div>
              </div>
        </div>
      </div>
    }
    {
      orderDetail.payment.pgw_status == 'FAILED' && 
      <div>
        <div className="flex justify-center items-center p-4 ">
              <div>
                <div className="flex mb-3">                  
                  <div className="text-4xl m-3 p-3">
                      Order is failed
                  </div>                  
                  <p>bank authorized failed</p>                  
                </div>
                <div className="flex justify-center">
                  <div className="flex">
                      <Button onClick={()=> router.replace(`/digishop/product/${orderDetail.items[0].product.uuid}`) } className="p-3  cursor-pointer text-black">buy product again</Button>
                      <Button onClick={()=> router.replace('/digishop') } className="ml-6 p-4 bg-blue-300 cursor-pointer">back first page</Button>
                  </div>
                </div>
              </div>
        </div>
      </div>
    }
    {
      orderDetail.status == 'PENDING' && 
      <div className="flex justify-center p-2 ">
        <div className="min-h-screen p-3 ">
          <>
            {/* store info */}
            <div className="p-4">
              <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                Product
              </div>
              <div className="rounded-lg shadow-md py-4 px-2">
                <div className="flex mb-3 items-center">
                  <div className=" h-[50px] w-[50px] rounded-[35px] bg-amber-800 "></div>
                  <h1 className="text-2xl  px-4">{orderDetail.store.storeName}</h1>
                </div>
                {/* product info */}
                <div className="">
                  <div className="flex">
                    <div className="w-[200px] h-[150px] bg-amber-400">
                      picture
                    </div>
                    <div className="mx-4 flex-1">
                      <div className="text-3xl mb-5">{orderDetail.items[0].product.name}</div>
                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            disabled={amount == 1}
                            onClick={() => setAmount(amount - 1)}
                            className={`p-2 rounded-xs  bg-red-400 ${amount == 1 ? "opacity-0" : "opacity-100"}`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
  
                          <span className="w-8 text-center font-medium text-gray-900">
                            {amount}
                          </span>
  
                          <button
                            disabled={amount == orderDetail.items[0].product.stockQuantity}
                            className={`p-2 rounded-xs bg-green-300 ${amount == orderDetail.items[0].product.stockQuantity ? "opacity-0" : "opacity-100"}`}
                            onClick={() => setAmount(amount + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
  
                        {/* Price */}
                        <div className="text-right">
                          <div className="text-xl font-semibold text-gray-900">
                            {orderDetail.items[0].unit_price_minor / 100}
                          </div>
                          <div className="text-sm text-gray-500">
                            Total: {(orderDetail.items[0].unit_price_minor * amount) / 100}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* price product */}
              </div>
            </div>
            <div className=" p-4">
              {/* address info*/}
              <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                Address
              </div>
              <div className="rounded-lg shadow-md py-4 px-2">
  
              {selectAddress && (
                <div >
                  <div className="bg-gray-200 p-3 rounded-2xl max-w-xl ">
                    <div className="font-bold">{selectAddress.recipientName}</div>
                    <div className="mx-4">
                      <p>{formatAddress(selectAddress)}</p>
                      <p>{selectAddress.phone}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button size="sm" onClick={handleOnClickSelectAddress}>
                        change address
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="">select your shipping type</div>
              {shipping?.map((item: Shipping, index: number) => (
                <div
                key={index}
                className=""
                onClick={() => setSelectShippingTypeId(item.id)}
                >
                  <ShippingCardDetail
                    item={item}
                    selected={selectShippingTypeId}
                    />
                </div>
              ))}
              <div className="mb-3 w-full">
                <InputField
                  label="Order Note"
                  name="note"
                  placeholder="message for merchant or shipping"
                  value={note}
                  onChange={handleChange}
                  />
              </div>
                  </div>
            </div>
  
            <div className="p-2">
              <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                Total
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4  mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Product</span>
                  <span className="font-medium">
                    {(orderDetail.items[0].unit_price_minor * amount)/100}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">{shipping[selectShippingTypeId - 1].price/100}</span>
                </div>
                <div className="border-t border-gray-400 pt-2 flex justify-end items-center">
                  <span className="text-lg font-semibold">{price/100}</span>
                </div>
              </div>
            </div>
  
            <div className="p-2">
              <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                Payment
              </div>
              <div className="rounded-lg shadow-md py-4 px-2">
              <div>select your payment method</div>
              {Object.entries(PaymentMethodMaster).map(([payment, config]) => (
                <button
                  key={payment}
                  className={` m-3  flex p-4 rounded-xl border ${payment == paymentMethod?.label ? "border-black" : "border-gray-300 text-gray-300"}`}
                  onClick={() => handlePayment(config.value)}
                >
                  {config.label}
                </button>
              ))}</div>
            </div>
            {/* buttonb  */}
            <div className="flex justify-end">
              <Button
                onClick={handleOrder}
                color={`${!paymentMethod ? "bg-gray-300 hover:bg-gray-300" : "bg-green-400 hover:bg-green-600"}`}
                disabled={!paymentMethod}
              >
                confirm
              </Button>
            </div>
          </>
  
          <DialogSelectAddress
            isShown={isShowSelectAddress}
            setIsShown={setIsShowSelectAddress}
            handleOnCancel={handleOnCancelSelectAddress}
            addresses={addresses}
            selectAddress={selectAddress}
            setSelectAddress={setSelectAddress}
          />
        </div>
      </div> 
    }
    {
      
    }
    </div>
  );
}

