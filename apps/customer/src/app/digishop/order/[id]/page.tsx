"use client";
import { useAuth } from "@/contexts/auth-context";
import { Address } from "@/types/props/addressProp";
import {
  Order,
  OrderDetail,
  ProductItemProps,
  Shipping,
} from "@/types/props/orderProp";
import {
  createOrder,
  fetchOrders,
  getShippingType,
} from "@/utils/requestUtils/requestOrderUtils";
import { getAddress } from "@/utils/requestUtils/requestUserUtils";
import Link from "next/link";
import { redirect, RedirectType, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddressCard from "@/components/addressCard";
import ShippingCardDetail from "@/components/shippingCard";
import { DialogSelectAddress } from "@/components/dialogSelectAddress";
import { PaymentMethod } from "../../../../../../../packages/db/src/types/enum";
import InputField from "@/components/inputField";
import Button from "@/components/button";
import { ClipboardCheck, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import PaymentMethodMaster from "../../../../master/paymentMethod.json";
export default function OrderPage() {
  const { id } = useParams();
  const orderCode = String(id);
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order>({
    orderCode: orderCode,
    customerId: 0,
    paymentMethod: PaymentMethod.CREDIT_CARD,
    shippingTypeId: 0,
    shippingAddress: 0,
    productprice: 0,
    shippingfee: 0,
  });
  const [price, setPrice] = useState<number[]>([]);
  const [note, setNote] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>();
  const [selectAddress, setSelectAddress] = useState<Address>();
  const [shipping, setShipping] = useState<Shipping[]>();
  const [paymentMethod, setPaymentMethod] = useState<string>();
  // const [totalProduct, Setprice] = useState<number>(0);
  const [selectShippingTypeId, setSelectShippingTypeId] = useState<number>(1);
  const [isShowSelectAddress, setIsShowSelectAddress] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail[]>();
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const resProduct = await fetchOrders(orderCode, user.id);
      const resAddress = await getAddress(user?.id);
      const resShipping = await getShippingType();
      setOrderDetail(resProduct.body);
      setAddresses(resAddress.data);
      setShipping(resShipping.data);
    };
    fetchData();
  }, [user, orderCode]);
  useEffect(() => {
    const isMain = addresses?.filter((item) => item.isDefault === true);
    if (isMain) {
      setSelectAddress(isMain[0]);
    }
  }, [addresses]);
  useEffect(() => {
    if (
      !user ||
      !selectAddress ||
      !selectAddress.id ||
      !paymentMethod ||
      !shipping ||
      !orderDetail
    )
      return;
    setOrder({
      orderCode: orderCode,
      customerId: user.id,
      shippingTypeId: selectShippingTypeId,
      shippingAddress: selectAddress.id,
      paymentMethod: paymentMethod,
      orderNote: note,
      productprice: sumPriceTotal(orderDetail) * 100,
      shippingfee: shipping[selectShippingTypeId - 1].price,
    });
  }, [
    orderCode,
    user,
    orderDetail,
    selectAddress,
    price,
    selectShippingTypeId,
    note,
    paymentMethod,
    shipping
  ]);
  const sumPrice = (
    items: [{
    quantity: number;
    unitPriceMinor: number;
    lineTotalMinor: number;
    productItem: ProductItemProps;
    product_name_snapshot: string;
  }]
  ) => {
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      sum += items[i].quantity * items[i].productItem.priceMinor;
    }
    return sum / 100;
  };
  const sumPriceTotal = (items: OrderDetail[]) => {
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].items.length; j++) {
        sum +=
          items[i].items[j].quantity * items[i].items[j].productItem.priceMinor;
      }
    }
    return sum / 100;
  };

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
    console.log(order)
    const res = await createOrder(order);
    if (res.data.redirect_url) {
      redirect(res.data.redirect_url, RedirectType.replace);
    }
  };

  const handleOnClickSelectAddress = (): void => {
    setIsShowSelectAddress(true);
  };
  const handleOnCancelSelectAddress = (): void => {
    setIsShowSelectAddress(false);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };
  const handlePayment = (e) => {
    setPaymentMethod(e);
  };
  if (!orderDetail || !shipping || !user) return;

  return !orderDetail[0].checkout.payment ? (
    <div>
      {orderDetail[0].status == "PENDING" && (
        <div className="flex justify-center p-2 ">
          <div className="min-h-screen p-3 ">
            <>
              {/* store info */}
              <div className="p-4">
                <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                  Product
                </div>

                <div className="rounded-lg shadow-md py-4 px-2">
                  <div>
                    {orderDetail.map((values, index) => (
                      <div key={index} className=" p-5 mb-4 border rounded-2xl">
                        <div className="flex items-center mb-2 ">
                          <div className="mx-4 w-[70px] h-[70px] rounded-full bg-amber-300"></div>
                          <div className="">
                            {
                              values.items[0].productItem.product.store
                                .storeName
                            }
                          </div>
                        </div>

                        <div className="border-b mb-2"></div>
                        {values.items?.map((value, index) => (
                          <div key={index}>
                            <div className="flex gap-4 relative mb-2">
                              <div className="w-[100px] h-[100px] bg-amber-700"></div>
                              <div>
                                <div className="flex-1">
                                  <div>{value.productItem.product.name}</div>
                                  <div className="absolute text-xs text-gray-500">
                                    {value.productItem.sku}
                                  </div>
                                  <div className="absolute bottom-5 right-0  text-gray-500 ">
                                    price: {value.unitPriceMinor / 100}
                                  </div>
                                  <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                                    x {String(value.quantity)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-end items-end">
                          <span className="flex justify-end items-end border-t w-fit">
                            total {sumPrice(values.items)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className=" p-4">
                {/* address info*/}
                <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                  Address
                </div>
                <div className="rounded-lg shadow-md py-4 px-2">
                  {selectAddress && (
                    <div>
                      <div className="bg-gray-200 p-3 rounded-2xl max-w-xl mb-2">
                        <div className="font-bold">
                          {selectAddress.recipientName}
                        </div>
                        <div className="mx-4">
                          <p>{formatAddress(selectAddress)}</p>
                          <p>{selectAddress.phone}</p>
                        </div>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            onClick={handleOnClickSelectAddress}
                          >
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
                      {sumPriceTotal(orderDetail)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex">
                      <span className="text-gray-600">Shipping</span>
                      <div
                        className={`ml-2 text-gray-400 ${orderDetail.length > 1 ? "opacity-100" : "opacity-0"}`}
                      >
                        x {orderDetail.length}
                      </div>
                    </div>
                    <div className=" font-medium">
                      {shipping[selectShippingTypeId - 1].price *
                        orderDetail.length / 100}
                    </div>
                  </div>
                  <div className=" border-gray-400 pt-2 flex justify-end items-center border-t">
                    <span className="text-lg font-semibold">
                      {shipping[selectShippingTypeId - 1].price *
                        orderDetail.length / 100 +
                        sumPriceTotal(orderDetail)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                  Payment
                </div>
                <div className="rounded-lg shadow-md py-4 px-2">
                  <div>select your payment method</div>
                  {Object.entries(PaymentMethodMaster).map(
                    ([payment, config]) => (
                      <button
                        key={payment}
                        className={` m-3  flex p-4 rounded-xl border ${payment == paymentMethod ? "border-black" : "border-gray-300 text-gray-300"}`}
                        onClick={() => handlePayment(config.value)}
                      >
                        {config.label}
                      </button>
                    )
                  )}
                </div>
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
      )}
    </div>
  ) : (
    <div>
      {orderDetail[0].checkout.payment.pgw_status == "PENDING" && (
        <div>
          <div className="flex justify-center items-center p-4 ">
            <div>
              <div className="flex mb-3">
                <div className="text-4xl m-3 p-3">Order is error</div>
                <p>Please order again</p>
              </div>
              <div className="flex justify-center">
                <div className="flex">
                  <Button
                    onClick={() => router.replace("/digishop/order/status")}
                    className="p-3  cursor-pointer text-black"
                  >
                    see order status
                  </Button>
                  <Button
                    onClick={() => router.replace("/digishop")}
                    className="ml-6 p-4 bg-blue-300 cursor-pointer"
                  >
                    back first page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      }
      {orderDetail[0].checkout.payment.pgw_status == "APPROVED" && (
        <div>
          <div className="flex justify-center items-center p-4 ">
            <div>
              <div className="flex mb-3">
                <ClipboardCheck size={100} color="green" />
                <div className="text-4xl m-3 p-3">Order is successful</div>
              </div>
              <div className="flex justify-center">
                <div className="flex">
                  <Button
                    onClick={() => router.replace("/digishop/order/status")}
                    className="p-3  cursor-pointer text-black"
                  >
                    see order status
                  </Button>
                  <Button
                    onClick={() => router.replace("/digishop")}
                    className="ml-6 p-4 bg-blue-300 cursor-pointer"
                  >
                    back first page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {orderDetail[0].checkout.payment.pgw_status == "CANCELED" && (
        <div>
          <div className="flex justify-center items-center p-4 ">
            <div>
              <div className="flex mb-3">
                <div className="text-4xl m-3 p-3">Order is failed</div>
                <p>you are cancel this order</p>
              </div>
              <div className="flex justify-center">
                <div className="flex">
                  <Button
                    onClick={() => router.replace("/digishop/order/status")}
                    className="p-3  cursor-pointer text-black"
                  >
                    see order status
                  </Button>
                  <Button
                    onClick={() => router.replace("/digishop")}
                    className="ml-6 p-4 bg-blue-300 cursor-pointer"
                  >
                    back first page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {orderDetail[0].checkout.payment.pgw_status == "FAILED" && (
        <div>
          <div className="flex justify-center items-center p-4 ">
            <div>
              <div className="flex mb-3">
                <div className="text-4xl m-3 p-3">Order is failed</div>
                <p>bank authorized failed</p>
              </div>
              <div className="flex justify-center">
                <div className="flex">
                  <Button
                    onClick={() =>
                      router.replace(
                        `/digishop/product/${orderDetail[0].items[0].productItem.product.uuid}`
                      )
                    }
                    className="p-3  cursor-pointer text-black"
                  >
                    buy product again
                  </Button>
                  <Button
                    onClick={() => router.replace("/digishop")}
                    className="ml-6 p-4 bg-blue-300 cursor-pointer"
                  >
                    back first page
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
