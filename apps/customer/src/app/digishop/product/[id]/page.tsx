"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct } from "@/utils/requestUtils/requestProduct";
import { Product, ProductItem } from "@/types/props/productProp";
import { useRouter } from "next/navigation";
import Button from "@/components/button";
import {
  createOrderId,
  createWishList,
} from "@/utils/requestUtils/requestOrderUtils";
import { OrderIdProp, ShoppingCartProps } from "@/types/props/orderProp";
import { useAuth } from "@/contexts/auth-context";
import { Minus, Plus } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const discountMinor = 0;
  const productId = String(id);
  const router = useRouter();
  const [product, setProduct] = useState<Product>();
  const [wishList, setWishList] = useState<ShoppingCartProps>();
  const [data, setData] = useState<OrderIdProp>({
    customerId: 0,
    orderData: [],
  });
  const [selected, setSelected] = useState<ProductItem>();
  const [amount, setAmount] = useState(1);
  useEffect(() => {
    const fetchData = async () => {
      const res = await getProduct(productId);
      setProduct(res.data);
    };
    fetchData();
  }, [productId]);
  useEffect(() => {
    setSelected(product?.items[0]);
  }, [product]);
  useEffect(() => {
    if (!user || !product || !selected) return;
    setData({
      customerId: user.id,
      orderData: [
        {
          productItemId: selected.id,
          quantity: amount,
          discountMinor: discountMinor,
          lineTotalMinor: selected.priceMinor * amount - discountMinor,
          productItem: {
            id: selected.id,
            productId: product.id,
            sku: selected.sku,
            stockQuantity: selected.stockQuantity,
            priceMinor: selected.priceMinor,
            product: {
              id: product.id,
              uuid: product.uuid,
              name: product.name,
              description: product.description,
              storeId: product.store.id,
              store: product.store,
            },
          },
        },
      ],
    });
    setWishList({
      customerId: user.id,
      productItemId: selected.id,
      quantity: amount,
    });
  }, [user, product, amount, selected]);
  const handleSelected = (item: ProductItem) => {
    setSelected(item);
    setAmount(1);
  };
  const handleBuy = async () => {
    if (!data) return;
    console.log("data", data);
    const res = await createOrderId(data);
    console.log(res.data);
    if (res) {
      router.push(`/digishop/order/${res.data}`);
    }
  };
  const handleAddShoppingCart = async () => {
    if (!wishList) return;
    console.log("res", wishList);
    const res = await createWishList(wishList);
    if (res.data) {
      alert("Item successfully added to cart");
    }
  };
  console.log(product)
  return product ? (
    <div className="flex justify-center">
      <div className="p-6">
        <div className="grid grid-cols-2 mb-6 gap-4 ">
          <div className="w-full h-full bg-pink-200 text-center">
            picture
          </div>
          <div className="mx-3 flex flex-col justify-between">
            <div>
              <div className="mb-3 text-5xl font-extrabold">{product.name}</div>
              <p className="text-gray-500 mb-2 border-b p-1">
                category: {product.category.name}
              </p>
              {product.items.map((item, index) => (
                <button
                  key={index}
                  className={` ${selected == item ? "border-black text-black" : "border-gray-400 text-gray-400"} border-1 rounded-md p-3 m-3`}
                  onClick={() => handleSelected(item)}
                >
                  {item.sku}
                </button>
              ))}
            </div>
            {selected && (
              <div className="flex items-center justify-center text-8xl">
                <div>
                  ฿ 
                  {(selected.priceMinor / 100)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                </div>
              </div>
            )}
            <div>
              {selected && (
                <div className="flex items-center justify-center mb-5">
                  <div>
                    <div className="flex my-4 ">
                      <button
                        disabled={amount == 1}
                        onClick={() => setAmount(amount - 1)}
                        className={`p-2 rounded-xs  bg-red-400 ${amount == 1 ? "opacity-0" : "opacity-100"}`}
                      >
                        <Minus className="w-7 h-7" />
                      </button>

                      <span className="w-20 text-2xl bg-gray-200 text-center font-medium text-gray-900">
                        {amount}
                      </span>

                      <button
                        disabled={amount == selected.stockQuantity}
                        className={`p-2 rounded-xs bg-green-300 ${amount == selected.stockQuantity ? "opacity-0" : "opacity-100"}`}
                        onClick={() => setAmount(amount + 1)}
                      >
                        <Plus className="w-7 h-7" />
                      </button>
                    </div>
                    {/* <div className="flex text-gray-400 text-[16px] items-end justify-end">
                    stock: {selected.stock_quantity}
                  </div> */}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center">
                <Button
                  size="lg"
                  onClick={handleAddShoppingCart}
                  color="border-gray-500"
                  className="w-[200px]"
                  disabled={
                    selected?.stockQuantity !== undefined &&
                    selected.stockQuantity < 0
                  }
                >
                  Add
                </Button>
                <Button
                  size="lg"
                  onClick={handleBuy}
                  color="bg-green-500"
                  className="w-[200px] ml-10"
                >
                  Buy
                </Button>
              </div>
            </div>
          </div>
          <div className="border p-4 rounded-2xl">
            <h2 className="text-2xl w-fit border-b">Description</h2>
            <h2 className="ml-5 my-5">{product.description}</h2>
          </div>
          <button className="flex p-6 rounded-2xl w-2xl bg-gray-200 border-b cursor-pointer" onClick={() =>
                        router.push(
                          `http://localhost:3000/digishop/store/${product.store.uuid}`
                        )
                      }>
            <div className="h-[100px] w-[100px] rounded-[50px] bg-amber-800 "></div>
            <div className="px-4">
              <h1 className="text-2xl font-extrabold">
                {product.store.storeName}
              </h1>
              <h6 className="mt-4">{product.store.description}</h6>
            </div>
          </button>
        </div>
      </div>
    </div>
  ) : (
    <h1 className="text-black">not found</h1>
  );
}
