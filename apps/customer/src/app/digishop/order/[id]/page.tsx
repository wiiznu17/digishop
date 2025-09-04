"use client";
import { useAuth } from "@/contexts/auth-context";
import { Address } from "@/types/props/addressProp";
import { Order, Shipping } from "@/types/props/orderProp";
import { Product } from "@/types/props/productProp";
import { createOrder, getShippingType } from "@/utils/requestUtils/requestOrderUtils";
import { getProduct } from "@/utils/requestUtils/requestProduct";
import { getAddress } from "@/utils/requestUtils/requestUserUtils";
import Link from "next/link";
import { redirect, RedirectType, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddressCard from "@/components/addressCard";
import ShippingCardDetail from "@/components/shippingCard";
import { DialogSelectAddress } from "@/components/dialogSelectAddress";
import { PaymentMethod, PaymentType } from "../../../../../../../packages/db/src/types/enum";
import InputField from "@/components/inputField";

interface PaymentDetail {
  label: string,
  value: PaymentMethod
}
export default function OrderPage() {
  const { id } = useParams();
  const productName = String(id);
  const [processStatus, setProcessStatus] = useState<number>(1);
  const [amount, setAmount] = useState(1);
  const [price, setPrice] = useState(0);
  const [order, setOrder] = useState<Order>();
  const [note, setNote] = useState<string>("");
  const [product, setProduct] = useState<Product>();
  const [addresses, setAddresses] = useState<Address[]>();
  const [selectAddress, setSelectAddress] = useState<Address>();
  const [shipping, setShipping] = useState<Shipping[]>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentDetail>();
  const [selectShippingTypeId, setSelectShippingTypeId] = useState<number>(1)
  const [isShowSelectAddress, setIsShowSelectAddress] = useState(false);  
  const payments = {
    CERDIT_CARD : {
      label: 'CERDIT_CARD',
      value: PaymentMethod.CREDIT_CARD
    },
    QR : {
      label: 'QR',
      value: PaymentMethod.QR
    }
  }
  // const [linkPayment, setLinkPayment] = useState('/digishop');
  const { user } = useAuth();
  useEffect(() => {
    const fetchData = async () => {
      const resProduct = await getProduct(productName);
      const resAddress = await getAddress(user?.id);
      const resShipping = await getShippingType();
      setProduct(resProduct.data);
      setAddresses(resAddress.data);
      setShipping(resShipping.data);
    };
    fetchData();
  }, [productName, user]);
  useEffect(() => {
    const isMain = addresses?.filter((item) => item.isDefault === true);
    if(isMain) {
      setSelectAddress(isMain[0])
    }
  },[addresses])
  useEffect(() => {
    if(!shipping) return
    const sumprice = Number(shipping[selectShippingTypeId - 1].price) + Number(product?.price) * amount;    
    setPrice(sumprice);
  }, [amount, product?.price,selectShippingTypeId,shipping]);
  useEffect(() => {
    if (!user || !product || !selectAddress || !selectAddress.id || !paymentMethod ) return;
    setOrder({
      productName: product.name,
      customerId: user.id,
      storeId: product.store.id,
      grandTotalMinor: price,
      productId: product.id,
      quantity: amount,
      unitPrice: product.price,
      shippingTypeId: selectShippingTypeId,
      shippingAddress: selectAddress.id,
      paymentMethod: paymentMethod.value,
      orderNote: note
    });
  },[amount,user,product,selectAddress,price,selectShippingTypeId,note,paymentMethod])

  const handleOrder = async () => {
    if (!order) return
    const res = await createOrder(order);
    console.log('res re',res.data)
    if(res.data.redirect_url){
      redirect(res.data.redirect_url,RedirectType.replace)
    }
    console.log(order)
  };

  if (user == null || user.id <= 0) return;
  const handleOnClickSelectAddress = ():void => {
    setIsShowSelectAddress(true)
  };
  const handleOnCancelSelectAddress = ():void => {
    setIsShowSelectAddress(false)
  };
  const handleChange = (e:React.ChangeEvent<HTMLInputElement> ) => {
      setNote(e.target.value);
    };
  const handlePayment = (e: PaymentDetail) => {
    setPaymentMethod(e)
  }
  return (
    <>
      <div className="min-h-screen p-3">
        {processStatus === 1 && product && (
          <>
            {/* store info */}
            <div className="flex mb-3">
              <div className="h-[70px] w-[70px] rounded-[35px] bg-amber-800 "></div>
              <h1 className="text-2xl font-extrabold px-4">
                {product.store.storeName}
              </h1>
            </div>
            {/* product info */}
            <div className="mb-3">
              <div className=" h-[350px] flex">
                <div className="w-[500px] h-[350px] bg-amber-400">picture</div>
                <div className="">
                  <div className="font-extrabold text-6xl mb-5">
                    {product.name}
                  </div>
                  {/* add product */}
                  <div className="flex">
                    <div className="flex m-6">
                      <button
                        disabled ={amount == 1}
                        className={`px-3 rounded-xs  bg-red-400 ${amount == 1 ? "opacity-0" : "opacity-100"}`}
                        onClick={() => setAmount(amount - 1)}
                      >
                        {" "}
                        -{" "}
                      </button>
                      <div className="mx-8 ">{amount}</div>
                      <button
                        disabled ={amount == product?.stockQuantity}
                        className={`px-3 rounded-xs bg-green-300 ${amount == product?.stockQuantity ? "opacity-0" : "opacity-100"}`}
                        onClick={() => setAmount(amount + 1)}
                      >
                        {" "}
                        +{" "}
                      </button>
                    </div>
                    <div className="text-5xl mx-9">{product?.price/100}</div>
                  </div>
                </div>
                {/* price product */}
              </div>
            </div>
            {/* address info*/}
            {selectAddress && (
              <button onClick={handleOnClickSelectAddress}>
                <AddressCard item={selectAddress} />
              </button>
            )}
            {
              shipping?.map((item: Shipping, index: number) => (
                 <div key={index} className="m-3" onClick={() => setSelectShippingTypeId(item.id)}>
                   <ShippingCardDetail item={item} selected={selectShippingTypeId}/>
                 </div>
              ))
            }
            <div className="w-1/2 mb-3">
              <InputField 
                label="Order Note"
                name="note"
                value={note} 
                onChange={handleChange} 
              />
            </div>
            <div className="flex">
              <div className="mb-6 text-4xl">total price</div>
              <div className="mx-10 text-6xl">{price/100}</div>
            </div>
              {
                Object.entries(payments).map(([payment,config]) => (
                  <button key={payment} className={` m-4  flex p-4 rounded-xl border ${payment == paymentMethod?.label? 'border-amber-400': 'border-black'}`} onClick={()=> handlePayment(config)}>
                    {config.label}
                  </button>
                ))
              }
            {/* buttonb  */}
            <button
              onClick={handleOrder}
              hidden={(!user || !product || !selectAddress || !selectAddress.id )}
              className="bg-green-400 hover:bg-green-600 cursor-pointer p-4 rounded-2xl text-2xl"
            >
              confirm
            </button>
          </>
        )}
        <DialogSelectAddress 
          isShown={isShowSelectAddress}
          setIsShown={setIsShowSelectAddress}
          handleOnCancel={handleOnCancelSelectAddress}
          addresses={addresses}
          selectAddress={selectAddress}
          setSelectAddress={setSelectAddress}
        />
      </div>
    </>
  );
}
