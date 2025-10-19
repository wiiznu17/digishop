"use client";
import { useAuth } from "@/contexts/auth-context";
import { Address } from "@/types/props/addressProp";
import {
  Order,
  OrderDetail,
  Shipping,
  ShoppingCartProps
} from "@/types/props/orderProp";
import {
  createOrder,
  fetchOrders,
  getShippingType,
  deleteOrder,
  createWishList,
} from "@/utils/requestUtils/requestOrderUtils";
import { createAddress, getAddress } from "@/utils/requestUtils/requestUserUtils";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import ShippingCardDetail from "@/components/shippingCard";
import { DialogSelectAddress } from "@/components/dialogSelectAddress";
import { PaymentMethod } from "../../../../../../../packages/db/src/types/enum";
import InputField from "@/components/inputField";
import Button from "@/components/button";
import { ClipboardCheck} from "lucide-react";
import { useRouter } from "next/navigation";
import PaymentMethodMaster from "../../../../master/paymentMethod.json";
import creditMethodLogo from '../../../creaditMethod.png'
import qrLogo from '../../../qrLogo.png'
import Image from "next/image";
import { formatAddress, formatSku, sumPriceTotal, sumPrice } from "@/lib/function";
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
  // const [windows, setWindow] = useState<Window| null>();
  const [cart, setCart] = useState<ShoppingCartProps>()
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
      const res = (await createAddress(axiosData)) as {data: Address};
      if (res.data) {
        setIsShowAddress(false);
        window.location.reload()
      }
    };
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const resProduct = (await fetchOrders(orderCode, user.id)) as { body: OrderDetail[]};
      const resAddress = (await getAddress(user?.id)) as {data: Address[] };
      const resShipping = (await getShippingType()) as {data: Shipping[]};
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
    const productItemsId = orderDetail[0].items.map(item => item.productItem.id).filter((id): id is number => typeof id === 'number')
    const productItemsquatity = orderDetail[0].items.map(item => item.quantity).filter((id): id is number => typeof id === 'number')
    if(!productItemsId)return
    setCart({
      customerId: user.id,
      productItemId: productItemsId,
      quantity: productItemsquatity
    })
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
  ]);

//   useEffect(() => {
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
//   if (orderDetail &&firstOrder.checkout.payment?.pgw_status === "PENDING") {
//     const expiry = new Date(firstOrder.checkout.payment.expiry_at).getTime();
//     setEnd(expiry);
//   }
// }, [orderDetail]);

  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);
    const handlePopStateBeforePayment = () => {
      setShowModel(true);
      setNextPath("/");
    };
    
    if (!orderDetail) return;
    window.addEventListener("popstate", handlePopStateBeforePayment);
    // window.addEventListener("beforeunload", (e) => {
    //   e.preventDefault()
    //   deleteOrder(orderCode);
    // });
  }, [orderDetail, router, showModal,orderCode]);
  const handleCancel = () => {
    setShowModel(false);
  };
  const handleConfirmCancel = async() => {
    setShowModel(false);
    // del order
    if(!cart)return
    console.log(cart)
    const cancel = (await deleteOrder(orderCode)) as {data: string};
    const addCart = (await createWishList(cart)) as {data: {cartId: number,
            productItemId: number,
            quantity: number,
            unitPriceMinor: number }}
    if (nextPath && cancel.data && addCart.data) {
      router.push(nextPath);
    }
  };
  
  // useEffect(() => {
  //   if(windows?.close){
  //     console.log(orderCode, 'close')
  //   }
  // },[windows, orderCode])
  // const sumPrice = (
  //   items: [
  //     {
  //       quantity: number;
  //       unitPriceMinor: number;
  //       lineTotalMinor: number;
  //       productItem: ProductItemProps;
  //       productNameSnapshot: string;
  //     },
  //   ]
  // ) => {
  //   let sum = 0;
  //   for (let i = 0; i < items.length; i++) {
  //     sum += items[i].quantity * items[i].productItem.priceMinor;
  //   }
  //   return sum / 100;
  // };
  // const sumPriceTotal = (items: OrderDetail[]) => {
  //   let sum = 0;
  //   for (let i = 0; i < items.length; i++) {
  //     for (let j = 0; j < items[i].items.length; j++) {
  //       sum +=
  //         items[i].items[j].quantity * items[i].items[j].productItem.priceMinor;
  //     }
  //   }
  //   return sum / 100;
  // };

  const handleOrder = async () => {
    if (!order) return;
    console.log(order)
    const res = (await createOrder(order)) as {data: { redirect_url: string}};
    if (res.data.redirect_url) {
      router.push(res.data.redirect_url)
      // localStorage.setItem("openPayment", "true");
      // window.location.reload()
    }
  };

  // const paymentWeb = (url:string| undefined) => {
  //   if(!orderDetail ||  !firstOrder?.checkout?.payment) return
  //   const windowOpen = window.open(url,'_blank')
  //   setWindow(windowOpen)
  // }
  const handleOnClickSelectAddress = (): void => {
    setIsShowSelectAddress(true);
  };
  const handleOnCancelSelectAddress = (): void => {
    setIsShowSelectAddress(false);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNote(e.target.value);
  };
  const handlePayment = (e:string) => {
    setPaymentMethod(e);
  };
  if (!shipping || !user  ) return;

  if (!firstOrder) {
    //redirect('/', RedirectType.replace)
    //console.log('no first order')
    return
  }  
  return !firstOrder.checkout?.payment? (
    <div>
      {firstOrder.status == "PENDING" && (
        <div className="flex justify-center p-2 ">
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center z-100000">
              <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-xl font-bold mb-4">Confirm Navigation</h2>
                <p className="mb-4">This order will be canceled</p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={handleCancel}
                    className="px-4 pu-2 bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className="px-4 pu-2 bg-blue-500 text-white rounded"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
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
                              { values.items[0].productItem.productItemImage &&
                                <Image
                                src={values.items[0].productItem.productItemImage?.url}
                                alt={values.items[0].productItem.productItemImage?.blobName}
                                className="object-fill w-[100px] h-[100px] "
                              /> 
                              }
                              
                              <div>
                                <div className="flex-1">
                                  <div>{value.productItem.product.name}</div>
                                  <div className="absolute text-xs text-gray-500">
                                    { formatSku(value.productItem.configurations)}
                                  </div>
                                  <div className="absolute bottom-5 right-0  text-gray-500 ">
                                    ฿{" "}
                                    {(value.unitPriceMinor / 100)
                                      .toString()
                                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
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
                <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                  Address
                </div>
                <div className="rounded-lg shadow-md py-4 px-2">
                  {
                    addresses?.length === 0 && (
                      //address form
                      <div className="mb-4">
                        <Button className="mb-2" onClick={handleOnClickAddress} border="border-black" >create address</Button>
                        <p className='text-xs text-red-600'>* create shipping address</p>
                      </div>

                    )
                  }
                  {
                    selectAddress &&
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
                          color="bg-white"
                        >
                          change address
                        </Button>
                      </div>
                    </div>
                  </div>
                  }
                  
                  <div className="">select your shipping type </div>

                  {shipping?.map((item: Shipping, index: number) => (
                    <div
                      key={index}
                      className=""
                      onClick={() => {
                        if(typeof item.id === 'number'){
                          setSelectShippingTypeId(item.id)}
                        }
                      }
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
                <div className="border-b text-4xl mb-2 py-4 font-extrabold">
                  Payment
                </div>
                <div className="rounded-lg shadow-md py-4 px-2 ">
                  <div>select your payment method</div>
                  {Object.entries(PaymentMethodMaster).map(
                    ([payment, config]) => (
                      <div key={payment} className={`flex m-2 border p-3 rounded-xs w-1/2 items-start ${!config.valid ? 'border-gray-300': ''}`}>
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
                        <label htmlFor="config.label" className={`${!config.valid ? 'text-gray-300': ''}`}>
                          <div className="ml-2">
                            <div>{config.label}</div>
                            {
                              config.label === 'CREDIT CARD'&&
                              <Image src={creditMethodLogo} alt='credit method pricture' width={300} className="py-4"/>
                            }
                            {
                              config.label === 'PROMPT PAY'&&
                              <Image src={qrLogo} alt='qr method pricture' width={100} className="pt-4"/>

                            }
                          </div>
                          <p></p>
                        {
                          !config.valid && <p className=" text-red-600">* not available</p>
                        }
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
                  color={`${!selectAddress  ? "bg-gray-300 hover:bg-gray-300" : "bg-green-400 hover:bg-green-600"}`}
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
  ) 
  : (
    <div>
      {firstOrder.checkout.payment.pgw_status == "PENDING" && (
        <div className="w-full min-h-full p-6">
          <div className="flex justify-center items-center p-4 ">
            <div>
              <div className="flex mb-3">
                <div className="text-4xl m-3 p-3">Order is error</div>
                <p>Please order again</p>
              </div>
              <div className="flex justify-center">
                <div className="flex">
                  <Button
                    onClick={() => router.replace("/order/status")}
                    className="p-3  cursor-pointer text-black"
                  >
                    see order status
                  </Button>
                  <Button
                    onClick={() => router.replace("/")}
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
      {firstOrder.checkout.payment.pgw_status == "APPROVED" && (
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
                    onClick={() => router.replace("/order/status")}
                    className="p-3  cursor-pointer text-black"
                  >
                    see order status
                  </Button>
                  <Button
                    onClick={() => router.replace("/")}
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
      {firstOrder.checkout.payment.pgw_status == "CANCELED"  && (
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
                    onClick={() => router.replace("/order/status")}
                    className="p-3  cursor-pointer text-black"
                  >
                    see order status
                  </Button>
                  <Button
                    onClick={() => router.replace("/")}
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
      {firstOrder.checkout.payment.pgw_status == "FAILED" && (
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
                        `/product/${firstOrder.items[0].productItem.product.uuid}`
                      )
                    }
                    className="p-3  cursor-pointer text-black"
                  >
                    buy product again
                  </Button>
                  <Button
                    onClick={() => router.replace("/")}
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
