"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct } from "@/utils/requestUtils/requestProduct";
import { Product, ProductItem } from "@/types/props/productProp";
import { useRouter } from "next/navigation";
import Button from "@/components/button";
import { createOrderId, createWishList} from "@/utils/requestUtils/requestOrderUtils";
import { OrderIdProp, ShoppingCartProps } from "@/types/props/orderProp";
import { useAuth } from "@/contexts/auth-context";
import { Minus, Plus } from "lucide-react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const productId = String(id);
  const router = useRouter();
  const [product, setProduct] = useState<Product>();
  const [wishList, setWishList] = useState<ShoppingCartProps>()
  const [data, setData] = useState<OrderIdProp>(
    {
      customerId: 0,
      orderData: []
    }
  );
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
          discountMinor: 0,
          lineTotalMinor: 0,
          productItem: {
            id: selected.id,
            productId: product.id,
            sku: selected.sku,
            stockQuantity: selected.stock_quantity,
            priceMinor: selected.price_minor,
            product: {
              id: product.id,
              uuid: product.uuid,
              name: product.name,
              description: product.description,
              storeId: product.store.id,
              store: product.store
            }
          }
        }
      ]
    });
    setWishList({
      customerId: user.id ,
      productItemId:  selected.id  ,
      quantity: amount
    })
  }, [user, product,amount,selected]);
  const handleBuy = async () => {
    if (!data) return;
    console.log('data',data)
    const res = await createOrderId(data);
    console.log(res.data)
    if (res) {
      router.push(`/digishop/order/${res.data}`);
    }
  };
  const handleAddShoppingCart = async() => {
    if(!wishList)return
    const res = await createWishList(wishList)
    if(res){
      alert('success')
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
            {product.items.map((item, index) => (
              <div key={index}>
                <button
                  className={`${selected == item ? "border-black text-black" : "border-gray-400 text-gray-400"} border-2 rounded-2xl p-5 m-3`}
                  onClick={() => setSelected(item)}
                >
                  {item.sku}
                </button>
              </div>
            ))}
            {selected && (
              <div>
                <div>{selected.price_minor/100}</div> 
                <div>{selected.stock_quantity}</div>
                  
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
                    disabled={amount == selected.stock_quantity}
                    className={`p-2 rounded-xs bg-green-300 ${amount ==  selected.stock_quantity? "opacity-0" : "opacity-100"}`}
                    onClick={() => setAmount(amount + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleAddShoppingCart}
                color="border-green-500"
                className="w-[200px]"
                disabled={
                  selected?.stock_quantity !== undefined &&
                  selected.stock_quantity < 0
                }
              >
                Add
              </Button>
              <Button
                size="lg"
                onClick={handleBuy}
                color="bg-green-500"
                className="w-[200px] mx-2"
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
