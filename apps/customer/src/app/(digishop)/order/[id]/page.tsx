"use client";
import { useAuth } from "@/contexts/auth-context";
import { Address } from "@/types/props/addressProp";
import {
  Order,
  OrderDetail,
  Shipping,
  ShoppingCartProps,
} from "@/types/props/orderProp";
import {
  createOrder,
  fetchOrders,
  getShippingType,
  deleteOrder,
  createWishList,
} from "@/utils/requestUtils/requestOrderUtils";
import {
  createAddress,
  getAddress,
} from "@/utils/requestUtils/requestUserUtils";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ShippingCardDetail from "@/components/shippingCard";
import { DialogSelectAddress } from "@/components/dialogSelectAddress";
import { PaymentMethod } from "../../../../../../../packages/db/src/types/enum";
import InputField from "@/components/inputField";
import Button from "@/components/button";
import {
  CircleCheck,
  ClipboardList,
  Home,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import PaymentMethodMaster from "../../../../master/paymentMethod.json";
import creditMethodLogo from "../../../creaditMethod.png";
import qrLogo from "../../../qrLogo.png";
import Image from "next/image";
import {
  formatAddress,
  formatSku,
  sumPriceTotal,
  sumPrice,
} from "@/lib/function";
import { DialogAddress } from "@/components/createAddress";
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
  const [note, setNote] = useState<string>("");
  const [addresses, setAddresses] = useState<Address[]>();
  const [selectAddress, setSelectAddress] = useState<Address>();
  const [shipping, setShipping] = useState<Shipping[]>();
  const [paymentMethod, setPaymentMethod] = useState<string>("CREDIT_CARD");
  const [selectShippingTypeId, setSelectShippingTypeId] = useState<number>(1);
  const [isShowSelectAddress, setIsShowSelectAddress] = useState(false);
  const [orderDetail, setOrderDetail] = useState<OrderDetail[]>();
  const [nextPath, setNextPath] = useState<string | null>("/");
  const [showModal, setShowModel] = useState(false);
  const [cart, setCart] = useState<ShoppingCartProps>();
  const [isShowAddress, setIsShowAddress] = useState(false);
  const [address, setAddress] = useState<Address>({
    recipientName: "",
    phone: "",
    province: "",
    address_number: "",
    building: "",
    subStreet: "",
    street: "",
    subdistrict: "",
    district: "",
    country: "",
    postalCode: "",
    isDefault: false,
    addressType: "HOME",
  });
  const handleOnClickAddress = (): void => {
    setIsShowAddress(true);
  };
  const handleOnCancelAddress = (): void => {
    setIsShowAddress(false);
    setAddress({
      recipientName: "",
      phone: "",
      address_number: "",
      building: "",
      subStreet: "",
      street: "",
      subdistrict: "",
      district: "",
      country: "",
      province: "",
      postalCode: "",
      isDefault: false,
      addressType: "HOME",
    });
  };
  const handleOnConfirmAddress = async (): Promise<void> => {
    const axiosData = { ...address, userId: user?.id };
    const res = (await createAddress(axiosData)) as { data: Address };
    if (res.data) {
      setIsShowAddress(false);
      window.location.reload();
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const resProduct = (await fetchOrders(orderCode, user.id)) as {
        body: OrderDetail[];
      };
      const resAddress = (await getAddress(user?.id)) as { data: Address[] };
      const resShipping = (await getShippingType()) as { data: Shipping[] };
      setOrderDetail(resProduct.body);
      setAddresses(resAddress.data);
      setShipping(resShipping.data);
    };
    fetchData();
  }, [user, orderCode]);
  const firstOrder = orderDetail?.[0];
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
    const productItemsId = firstOrder?.items
      .map((item) => item.productItem.id)
      .filter((id): id is number => typeof id === "number");
    const productItemsquatity = firstOrder?.items
      .map((item) => item.quantity)
      .filter((id): id is number => typeof id === "number");
    if (!productItemsId || !productItemsquatity) return;
    setCart({
      customerId: user.id,
      productItemId: productItemsId,
      quantity: productItemsquatity,
    });
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
    selectShippingTypeId,
    note,
    paymentMethod,
    shipping,
    firstOrder,
  ]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);
    const handlePopStateBeforePayment = () => {
      setShowModel(true);
      setNextPath("/");
    };

    if (!orderDetail) return;
    window.addEventListener("popstate", handlePopStateBeforePayment);

  }, [orderDetail, router, showModal, orderCode]);
  const handleCancel = () => {
    setShowModel(false);
  };
  const handleConfirmCancel = async () => {
    setShowModel(false);
    if (!cart) return;
    const cancel = (await deleteOrder(orderCode)) as { data: string };
    const addCart = (await createWishList(cart)) as {
      data: {
        cartId: number;
        productItemId: number;
        quantity: number;
        unitPriceMinor: number;
      };
    };
    if (nextPath && cancel.data && addCart.data) {
      router.push(nextPath);
    }
  };

  const handleOrder = async () => {
    if (!order) return;
    const res = (await createOrder(order)) as {
      data: { redirect_url: string };
    };
    if (res.data.redirect_url) {
      router.push(res.data.redirect_url);
      
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
  const handlePayment = (e: string) => {
    setPaymentMethod(e);
  };
  if (!shipping || !user) return;

  if (!firstOrder) return;
  return !firstOrder.checkout?.payment ? (
    <div className="">
      {firstOrder.status == "PENDING" && (
        <div className="flex justify-center p-2 bg-gradient-to-br from-blue-100 to-slate-100 ">
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center z-100000 bg-black/50">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Confirm Navigation</h2>
                <p className="mb-4">This order will be canceled</p>
                <div className="flex justify-end space-x-4">
                  <Button
                    size="sm"
                    onClick={handleCancel}
                    className=" bg-red-500 text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirmCancel}
                    className="bg-green-500 text-white"
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="w-4xl p-3 ">
            <>
              {/* store info */}
              <div className="p-4 ">
                <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                  Product
                </div>

                <div className="rounded-lg shadow-md p-6 bg-white">
                  <div>
                    {orderDetail.map((values, index) => (
                      <div key={index} className=" p-5 mb-4 border rounded-2xl">
                        <div className="flex items-center mb-2 ">
                          <div className="mx-4 w-[70px] h-[70px] rounded-full bg-amber-300"></div>
                          <div className="text-xl font-medium">
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
                              {values.items[0].productItem.productItemImage && (
                                <Image
                                  src={
                                    values.items[0].productItem.productItemImage
                                      ?.url
                                  }
                                  alt={
                                    values.items[0].productItem.productItemImage
                                      ?.blobName
                                  }
                                  height={100}
                                  width={100}
                                  className="object-fill w-[100px] h-[100px] "
                                />
                              )}

                              <div>
                                <div className="flex-1">
                                  <div className="text-xl font-medium">
                                    {value.productItem.product.name}
                                  </div>
                                  <div className="absolute text- font-light text-gray-500">
                                    {formatSku(
                                      value.productItem.configurations
                                    )}
                                  </div>
                                  <div className="absolute bottom-7 right-0 text-xl text-gray-500 ">
                                    ฿{" "}
                                    {(value.unitPriceMinor / 100)
                                      .toString()
                                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                  </div>
                                  <div className="absolute bottom-0 right-0 text-base text-gray-500 ">
                                    x {String(value.quantity)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-end items-end">
                          <span className="flex justify-end items-end text-xl font-medium border-t w-fit">
                            total ฿{" "}
                            {sumPrice(values.items)
                              .toString()
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className=" p-4">
                {/* address info*/}
                <div className="border-b text-4xl mb-2 p-4 font-extrabold">
                  Address
                </div>

                <div className="rounded-lg shadow-md p-6  bg-white">
                  <div className="text-xl font-medium pb-3 ">
                    select your shipping address{" "}
                  </div>
                  {addresses?.length === 0 && (
                    //address form
                    <div className="mb-4">
                      <Button
                        className="mb-2 text-lg"
                        onClick={handleOnClickAddress}
                        border="border-black"
                      >
                        create address
                      </Button>
                      <p className="text-base text-red-600">
                        * create shipping address
                      </p>
                    </div>
                  )}
                  {selectAddress && (
                    <div>
                      <div className="bg-gray-200 py-3 p-7  rounded-2xl text-xl max-w-xl mb-2">
                        <div className=" font-medium">
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
                            color="bg-white"
                          >
                            change address
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xl font-medium">
                    select your shipping type{" "}
                  </div>

                  {shipping?.map((item: Shipping, index: number) => (
                    <div
                      key={index}
                      className=""
                      onClick={() => {
                        if (typeof item.id === "number") {
                          setSelectShippingTypeId(item.id);
                        }
                      }}
                    >
                      <ShippingCardDetail
                        item={item}
                        selected={selectShippingTypeId}
                      />
                    </div>
                  ))}
                  <div className="mb-3 w-full text-lg">
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
                <div className="border-b text-4xl mb-2 p-6 font-extrabold">
                  Total
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 text-lg mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Product</span>
                    <span className="text-lg font-medium">
                      {sumPriceTotal(orderDetail)
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
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
                      {(shipping[selectShippingTypeId - 1].price *
                        orderDetail.length) /
                        100}
                    </div>
                  </div>
                  <div className=" border-gray-400 pt-2 flex justify-end items-center border-t">
                    <span className="text-lg font-semibold">
                      ฿
                      {(
                        (shipping[selectShippingTypeId - 1].price *
                          orderDetail.length) /
                          100 +
                        sumPriceTotal(orderDetail)
                      )
                        .toString()
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <div className="border-b text-4xl mb-2 p-6 font-extrabold">
                  Payment
                </div>
                <div className="rounded-lg shadow-md py-4 px-6 bg-white">
                  <div className="text-xl font-medium">
                    select your payment method
                  </div>
                  {Object.entries(PaymentMethodMaster).map(
                    ([payment, config]) => (
                      <div
                        key={payment}
                        className={`flex m-2 border p-3 rounded-xs w-1/2 items-start ${!config.valid ? "border-gray-300" : ""}`}
                      >
                        <input
                          type="radio"
                          id={config.label}
                          name={config.label}
                          value={config.value}
                          disabled={!config.valid}
                          checked={paymentMethod == config.value}
                          onChange={() => handlePayment(config.value)}
                          className=""
                        />
                        <label
                          htmlFor="config.label"
                          className={`${!config.valid ? "text-gray-300" : ""}`}
                        >
                          <div className="ml-2">
                            <div className="text-lg">{config.label}</div>
                            {config.label === "CREDIT CARD" && (
                              <Image
                                src={creditMethodLogo}
                                alt="credit method pricture"
                                width={300}
                                className="py-4"
                              />
                            )}
                            {config.label === "PROMPT PAY" && (
                              <Image
                                src={qrLogo}
                                alt="qr method pricture"
                                width={100}
                                className="pt-4"
                              />
                            )}
                          </div>
                          <p></p>
                          {!config.valid && (
                            <p className=" text-red-600">* not available</p>
                          )}
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>
              {/* buttonb  */}

              <div className=" flex justify-end ">
                <Button
                  onClick={handleOrder}
                  color={`${!selectAddress ? "bg-gray-300 hover:bg-gray-300" : "bg-green-400 hover:bg-green-600"}`}
                  disabled={!selectAddress}
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
          <DialogAddress
            isShowAddress={isShowAddress}
            setIsShowAddress={setIsShowAddress}
            handleOnCancel={handleOnCancelAddress}
            handleOnConfirm={handleOnConfirmAddress}
            address={address}
            setAddress={setAddress}
          />
        </div>
      )}
    </div>
  ) : (
    <div>
      {firstOrder.checkout.payment.pgw_status == "PENDING" && (

        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              {/* Animated Error Icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-100 rounded-full "></div>
                <div className="relative bg-red-500 rounded-full p-4">
                  <XCircle className="w-16 h-16 text-white" />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Order Error
              </h1>

              <p className="text-gray-600 mb-2 text-base">Please order again</p>

              <p className="text-lg text-gray-500 mb-8">
                We encountered an issue processing your order. Don&apos;t worry,
                no charges were made.
              </p>

              {/* Order ID */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-00 mb-1">Order Reference</p>
                <p className="text-sm font-mono text-gray-700">{orderCode}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.replace(`/product/${firstOrder.items[0].productItem.product.uuid}`)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" />
                  buy product again
                </button>

                <button
                  onClick={() => router.replace("/")}
                  className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:scale-105"
                >
                  <Home className="w-5 h-5" />
                  Back First Page
                </button>
              </div>
            </div>
 
          </div>
        </div>
      )}
      {firstOrder.checkout.payment.pgw_status == "APPROVED" && (
        <div className="min-h-screen bg- bg-green-500/40 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              {/* Animated Error Icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-100 rounded-full "></div>
                <div className="relative bg-green-500 rounded-full p-4">
                  <CircleCheck className="w-16 h-16 text-white" />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Order is successful
              </h1>

              <p className="text-lg text-gray-500 mb-8">
                Waiting merchant to approve your order. Order will be update in the status page.
              </p>

              {/* Order ID */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-00 mb-1">Order Reference</p>
                <p className="text-sm font-mono text-gray-700">{orderCode}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.replace("/order/status")}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ClipboardList className="w-5 h-5" />
                  See Order Status
                </button>

                <button
                  onClick={() => router.replace("/")}
                  className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:scale-105"
                >
                  <Home className="w-5 h-5" />
                  Back First Page
                </button>
              </div>
            </div>
        </div>
        </div>
      )}
      {firstOrder.checkout.payment.pgw_status == "CANCELED" && (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              {/* Animated Error Icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-100 rounded-full "></div>
                <div className="relative bg-red-500 rounded-full p-4">
                  <XCircle className="w-16 h-16 text-white" />
                </div>
              </div>

              {/* Error Message */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Order Error
              </h1>

              <p className="text-gray-600 mb-2 text-base">you are cancel this order</p>

              {/* <p className="text-lg text-gray-500 mb-8">
                We encountered an issue processing your order. Don&apos;t worry,
                no charges were made.
              </p> */}

              {/* Order ID */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-00 mb-1">Order Reference</p>
                <p className="text-sm font-mono text-gray-700">{orderCode}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.replace("/order/status")}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ClipboardList className="w-5 h-5" />
                  See Order Status
                </button>

                <button
                  onClick={() => router.replace("/")}
                  className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:scale-105"
                >
                  <Home className="w-5 h-5" />
                  Back First Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {firstOrder.checkout.payment.pgw_status == "FAILED" && (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Error Card */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
              {/* Animated Error Icon */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-100 rounded-full "></div>
                <div className="relative bg-red-500 rounded-full p-4">
                  <XCircle className="w-16 h-16 text-white" />
                </div>
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                Order Error
              </h1>

              <p className="text-gray-600 mb-2 text-base">Please order again</p>

              <p className="text-lg text-gray-500 mb-8">
                We encountered an issue processing your order. Don&apos;t worry,
                no charges were made.
              </p>

              {/* Order ID */}
              <div className="bg-gray-100 rounded-lg p-4 mb-6">
                <p className="text-xs text-gray-00 mb-1">Order Reference</p>
                <p className="text-sm font-mono text-gray-700">{orderCode}</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => router.replace(`/product/${firstOrder.items[0].productItem.product.uuid}`)}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" />
                  buy product again
                </button>

                <button
                  onClick={() => router.replace("/")}
                  className="w-full bg-white text-gray-700 py-3 px-6 rounded-xl cursor-pointer font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300 hover:scale-105"
                >
                  <Home className="w-5 h-5" />
                  Back First Page
                </button>
              </div>
            </div> 
          </div>
        </div>
      )}
    </div>
  );
}
