"use client";
import { useAuth } from "@/contexts/auth-context";
import { OrderIdProp, ShoppingDetail } from "@/types/props/orderProp";
import { fetchUserChart } from "@/utils/requestUtils/requestOrderUtils";
import { useEffect, useState } from "react";
import { createOrderId, deleteCart} from "@/utils/requestUtils/requestOrderUtils";
import { useRouter } from "next/navigation";
import Button from "@/components/button";

export default function ShoppingCart() {
  const [data, setData] = useState<ShoppingDetail[]>();
  const { user } = useAuth();
  const router = useRouter();
  const [select, setSelected] = useState<ShoppingDetail[]>([]);
  const [price, setPrice] = useState<number>(0)
  const [order, setOrder] = useState<OrderIdProp>(
      {
        customerId: user?.id ?? 0,
        orderData: []
      }
    );
  const sumPrice = (items: ShoppingDetail[]) => {
    let sum = 0 ; 
    for (let i = 0; i < items.length; i++) {
      sum += items[i].quantity * items[i].productItem.priceMinor;
    }
    return sum
  }
  const rawCartData = () => {
    if (!data) return;
    return Object.groupBy(
      data,
      ({ productItem }) => productItem.product.store.storeName
    );
  };
  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        const cartData = await fetchUserChart(user.id);
        setData(cartData.data);
      }
    };
    fetchCart();
  }, [user]);
  console.log(data)
  useEffect(()=> {
      setPrice(sumPrice(select))
  },[select])

  const handleSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    if (!checked) {
      if (select) {
        setSelected(select.filter((item) => String(item.id) !== value));
      }
    } else {
      const filterData =
        data?.filter((item) => String(item.id) === value) ?? [];
      setSelected([...(select ?? []), ...filterData]);
    }
  };
  
  const handleBuy = async() => {
    if(!user)return 
    console.log('select',select)
    order.customerId = user.id
    order.orderData = select
    const cardIds = select.map(item => item.id)
    console.log(order)
    const res = await createOrderId(order);
    const del = await deleteCart(cardIds)    
    if (res) {
      router.push(`/digishop/order/${res.data}`);
    }
  };
  const cartData = rawCartData();
  if(!data) return
  return data?.length > 0 ? (
    <div className="grid grid-cols-2">
      <div className="flex justify-center items-center">
        <div>
          {Object.entries(cartData).map(([key, values]) => (
            <div key={key} className=" p-5 mb-5 border w-md rounded-2xl">
              <div className="flex items-center mb-3">
                <div className="mx-4 w-[70px] h-[70px] rounded-full bg-amber-300"></div>
                <div className="">{key}</div>
              </div>
              {values?.map((value, index) => (
                <div key={index}>
                  <div className="flex gap-4 relative mb-2">
                  <input
                    type="checkbox"
                    name="selected"
                    value={value.id}
                    onChange={handleSelected}
                    
                  />
                    <div className="w-[100px] h-[100px] bg-amber-700"></div>
                    <div>
                      <div className="flex-1">
                        <div>{value.productItem.product.name}</div>
                        <div className="absolute text-xs text-gray-500">
                          {value.productItem.sku}
                        </div>
                        <div className="absolute bottom-5 right-0  text-gray-500 ">
                          price: {value.productItem.priceMinor / 100}
                        </div>
                        <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                          x {String(value.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {
                select && (
                  <div className="flex justify-end border-t">{sumPrice(values)/100}</div>
                )
              }
            </div>
          ))}
        </div>
      </div>
      
      {select && (
        <div className=" p-5 mb-5 border w-md h-fit rounded-2xl">
          <div className="flex justify-center items-center">select want do you want</div>
            <div className={`border-t flex justify-end my-2`}>
            </div>
          <div>
            {select.map((value, index) => (
              <div key={index}>
                {
                  value.id && (
                  <div className="flex gap-4 relative mb-2">
                    <div className="w-[100px] h-[100px] bg-amber-700"></div>
                    <div>
                      <div className="flex-1">
                        <div>{value.productItem.product.name}</div>
                        <div className="absolute text-xs text-gray-500">
                          {value.productItem.sku}
                        </div>
                        <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                          x {String(value.quantity)}
                        </div>
                        <div className="absolute bottom-5 right-0  text-gray-500 ">
                          price: {value.productItem.priceMinor / 100}
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                }
              </div>
            ))}
            <div className={`${price === 0? 'opacity-0':'opacity-100'}`}>
              <div className="flex justify-end">total {sumPrice(select)/100}</div>
              <div className="flex justify-end mt-2 border-t pt-2">
                <Button
                    size="lg"
                    onClick={handleBuy}
                    color="bg-green-500"
                    className="w-[150px] mx-2 "
                  >
                    Buy
                  </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ):(
    <div className="flex justify-center items-center">
      <div className="text-5xl">no cart item</div>
    </div>
  )
}
