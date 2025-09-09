"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct } from "@/utils/requestUtils/requestProduct";
import { Product } from "@/types/props/productProp";
import { useRouter } from "next/navigation";
import Button from "@/components/button";
import { createOrderId } from "@/utils/requestUtils/requestOrderUtils";
import { OrderIdProps } from "@/types/props/orderProp";
import { useAuth } from "@/contexts/auth-context";


export default function ProductDetailPage() {
  const { id } = useParams();
  const productId = String(id);
  const [product, setProduct] = useState<Product>();
  const router = useRouter();
  const [data, setData] = useState<OrderIdProps>()
  const {user} = useAuth()
  useEffect(() => {
    const fetchData = async () => {
      const res = await getProduct(productId);
      setProduct(res.data);
    };
    fetchData();
  }, [productId]);
  useEffect(()=>{
    if(!user || !product) return
    setData({
          customerId: user.id,
          storeId: product.store.id,
          productId: product.id,
          storeName: product.store.storeName
        })
  },[user,product])
  const handleBuy = async() => {
    if(!data)return
    const res = await createOrderId(data)
    if(res){
      router.push(`/digishop/order/${res.data}`);
    }
  };

  return product ? (
    <div className="flex justify-center">
      <div className="p-6">
        <div className="grid grid-cols-2 mb-6 ">
          <div className="w-[610px] h-[550px] bg-pink-200 text-center">
            picture
          </div>
          <div className="mx-3">
            <div className="mb-3 text-5xl font-extrabold">{product.name}</div>
            <p className="text-gray-500 mb-2 border-b p-1">
              category: {product.category.name}
            </p>
            <h4 className="flex justify-center items-center m-20 text-8xl font-extrabold">
              {product.price / 100}
            </h4>
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleBuy}
                color="bg-green-500"
                className="w-[200px]"
              >
                Buy
              </Button>
            </div>
          </div>
        </div>
        <h2 className="text-xl ">description</h2>
        <div className="flex justify-end right-0"></div>
        <h2 className="my-3 border-b pb-5">{product.description}</h2>
        <div className="flex p-6 rounded-2xl w-2xl bg-gray-200">
          <div className="h-[100px] w-[100px] rounded-[50px] bg-amber-800 "></div>
          <div className="px-4">
            <h1 className="text-2xl font-extrabold">
              {product.store.storeName}
            </h1>
            <h6 className="mt-4">{product.store.description}</h6>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <h1 className="text-black">not found</h1>
  );
}
