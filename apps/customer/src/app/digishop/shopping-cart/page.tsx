"use client";
import { useAuth } from "@/contexts/auth-context";
import { OrderIdProp, ShoppingCartProps, ShoppingDetail } from "@/types/props/orderProp";
import { fetchUserChart } from "@/utils/requestUtils/requestOrderUtils";
import { SetStateAction, useEffect, useState } from "react";
import {
  createOrderId,
  deleteCart,
} from "@/utils/requestUtils/requestOrderUtils";
import { useRouter } from "next/navigation";
import Button from "@/components/button";
import { Minus, Plus } from "lucide-react";
import Link from "next/link";
import { Configurations } from "@/types/props/productProp";
import { formatSku } from "@/lib/function";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";

export default function ShoppingCart() {
  const [data, setData] = useState<ShoppingDetail[]>();
  const { user } = useAuth();
  const router = useRouter();
  const [select, setSelected] = useState<ShoppingDetail[]>([]);
  const [price, setPrice] = useState<number>(0);
  const [id, setId] = useState<number | null>();
  const [quantity, setQuantity] = useState<number[]>([]);
  const [deleteDialogItemId, setDeleteDialogItemId] = useState<number | null>(null)
  const [order, setOrder] = useState<OrderIdProp>({
    customerId: user?.id ?? 0,
    orderData: [],
  });
  const sumPrice = (items: ShoppingDetail[]) => {
    let sum = 0;
    for (let i = 0; i < items.length; i++) {
      sum += items[i].quantity * items[i].productItem.priceMinor;
    }
    return sum;
  };
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
  useEffect(() => {
    setPrice(sumPrice(select));
  }, [select]);
  const handleDelete = async(id: (number | undefined)[]) => {
    const del = await deleteCart(id)
    return del
  }
  const handleChangeAmount = (cal: string, id: number | undefined) => {
    if (!data && !id) return;
    setData((data) =>
      data?.map((item) =>
        item.id === id
          ? ({
              ...item,
              quantity: cal === "add" ? item.quantity + 1 : item.quantity - 1,
            })
          : item
      )
    );
  };
  const handleDeletCartItem = async(id: number | undefined) => {
    console.log('id cart',id)
    const del = await handleDelete([id]);
    if(del.message){
      window.location.reload()
    }
  }
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

  const handleDel = async () => {
    if (!user) return;
    order.customerId = user.id;
    order.orderData = select;
    const cardIds = select.map((item) => item.id);
    const del = await handleDelete(cardIds)
    if (del) {
      window.location.reload();
    }
  };
  const handleBuy = async () => {
    if (!user) return;
    order.customerId = user.id;
    order.orderData = select;
    const cardIds = select.map((item) => item.id);
    const res = await createOrderId(order);
    handleDelete(cardIds)
    if (res) {
      router.push(`/digishop/order/${res.data}`);
    }
  };
  
  const cartData = rawCartData();
  if (!data)
    return (
      <div className=" flex justify-center items-center text-gray-500  p-4">
        <div>no cart items </div>
      </div>
    );
  return data?.length > 0 ? (
    <div className="grid grid-cols-2">
      <div className="flex justify-center ">
        <div>
          {Object.entries(cartData).map(([key, values]) => (
            <div key={key} className=" px-5 py-3 mb-5 border w-md rounded-2xl">
              <div className="flex items-center mb-3">
                <div className="mx-4 w-[70px] h-[70px] rounded-full bg-amber-300"></div>
                <div className="">{key}</div>
              </div>
              {values &&
                values.map((value, index) => (
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
                          <Link
                            href={`/digishop/product/${value.productItem.product.uuid}`}
                            className="cursor-pointer hover:bg-gray-300 rounded-2xl"
                          >
                            {value.productItem.product.name}
                          </Link>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              {
                                formatSku(value.productItem.configurations)
                              }
                            </div>
                              <div className="flex gap-2 items-center absolute right-0 bottom-9">
                                <button
                                  onClick={() =>{
                                    if(value.quantity > 1){
                                      handleChangeAmount("sub", value.id)
                                    }else{
                                      setDeleteDialogItemId(value.id)
                                    }
                                  }}
                                  className={` rounded-xs hover:bg-gray-400 p-0.5 ${value.quantity == 0 || select.map((select) => select.id).includes(value.id)  ? "opacity-0" : "opacity-100"}`}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-8 text-center font-medium text-gray-900 bg-gray-200">
                                  {value.quantity}
                                </span>
                                <button
                                  disabled={
                                    value.quantity ==
                                    value.productItem.stockQuantity
                                  }
                                  className={`hover:bg-gray-400 p-0.5 rounded-xs ${value.quantity == value.productItem.stockQuantity || select.map((select) => select.id).includes(value.id)  ? "opacity-0" : "opacity-100"}`}
                                  onClick={() =>
                                    handleChangeAmount("add", value.id)
                                  }
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                          </div>

                          {/* <div className="absolute bottom-6 left-0 text-xs text-gray-500 ">
                            x {String(value.quantity)}
                            </div> */}

                          <div className="absolute bottom-0 right-0 ">
                            ฿ {(
                              (value.productItem.priceMinor * value.quantity) /
                              100
                            )
                            .toString()
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </div>
                        </div>
                      </div>
                    </div>
                    {
                      deleteDialogItemId === value.id && (
                        <DialogDeletShopingCartItem data={value} aleartDeletItem={deleteDialogItemId === value.id} setAleartDeletItem={(open) => setDeleteDialogItemId(open ? value.id : null)} handleDeletCartItem={handleDeletCartItem} />
                      )
                    }
                  </div>
                ))}
              {values && values.length > 1 && (
                <div className="border-t flex justify-between">
                  <div>total</div>
                  <div className="flex justify-end">
                    ฿ {(sumPrice(values) / 100)
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {select && (
        <div className="flex flex-col w-md">
          <div className=" p-5 mb-5 border w-md h-fit rounded-2xl">
            <div className="flex justify-center items-center">
              selected items
            </div>
            <div className={`border-t flex justify-end my-2`}></div>
            <div>
              {select.map((value, index) => (
                <div key={index}>
                  {value.id && (
                    <div className="flex gap-4 relative mb-2">
                      <div className="w-[100px] h-[100px] bg-amber-700"></div>
                      <div>
                        <div className="flex-1">
                          <div>{value.productItem.product.name}</div>
                          <div className="absolute text-xs text-gray-500">
                            {formatSku(value.productItem.configurations)}
                          </div>
                          <div className="absolute bottom-0 right-0 text-xs text-gray-500 ">
                            x {String(value.quantity)}
                          </div>
                          <div className="absolute bottom-5 right-0  text-gray-500 ">
                            ฿ {(value.productItem.priceMinor / 100)
                              .toString()
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className={`${price === 0 ? "opacity-0" : "opacity-100"} `}>
            <div className="flex justify-evenly items-center mb-6">
              <div>Total</div>
              <div>
                ฿ {(sumPrice(select) / 100)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </div>
            </div>
            <div className="mb-3">I want to </div>
            <div className="flex justify-between items-center">
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={handleDel}
                  color="bg-red-500"
                  className="w-[150px] "
                >
                  Delete
                </Button>
              </div>
              <div>or</div>
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={handleBuy}
                  color="bg-green-500"
                  className="w-[150px] "
                >
                  Buy
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className=" flex justify-center items-center text-gray-500  p-4">
      <div>no cart items </div>
    </div>
  );
}

const DialogDeletShopingCartItem = (
 {data,aleartDeletItem,setAleartDeletItem, handleDeletCartItem}: {data: ShoppingDetail,aleartDeletItem: boolean , setAleartDeletItem: React.Dispatch<SetStateAction<boolean>> , handleDeletCartItem: (id: number | undefined) => Promise<void> }
) => {
  if(!data)return
  return (
    <div className="flex justify-center ">
      <div>
            <Dialog
              open={aleartDeletItem}
              onClose={() => setAleartDeletItem(false)}
              className="relative z-100"
            >
              <DialogBackdrop
                transition
                className="fixed inset-0 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
              >
                <div className={`fixed inset-0 z-100 w-screen overflow-y-auto `}>
                  <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel 
                    transition
                    className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                    >
                      <div className="bg-gray-400 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div>
                          Do you want to delete {data.id}? 
                        </div>
                      </div>
                        <div className="bg-gray-700/25 px-4 py-1 sm:flex sm:flex-row-reverse sm:px-6">
                          <Button
                            size="sm"
                            className={`text-sm text-white bg-green-600 sm:ml-3 sm:w-auto`}
                            onClick={() => handleDeletCartItem(data.id)}
                          >
                            yes
                          </Button>
                          <Button
                            size="sm"
                            className=" bg-white"
                            onClick={()=> setAleartDeletItem(false)}
                          >
                            no
                          </Button>
                        </div>
                    </DialogPanel>
                  </div>
                </div>
              </DialogBackdrop>
            </Dialog>
          </div>
    </div>
  )
}