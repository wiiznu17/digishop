"use client";
import { useAuth } from "@/contexts/auth-context";
import {
  OrderIdProp,
  ShoppingDetail,
} from "@/types/props/orderProp";
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
import { formatSku } from "@/lib/function";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import Image from "next/image";


export default function ShoppingCart() {
  const [data, setData] = useState<ShoppingDetail[]>();
  const { user } = useAuth();
  const router = useRouter();
  const [select, setSelected] = useState<ShoppingDetail[]>([]);
  const [price, setPrice] = useState<number>(0);
  const [deleteDialogItemId, setDeleteDialogItemId] = useState<number | null>(
    null
  );
  
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
        const cartData = (await fetchUserChart(user.id)) as {
          data: ShoppingDetail[];
        };
        setData(cartData.data);
      }
    };
    fetchCart();
  }, [user]);
  useEffect(() => {
    setPrice(sumPrice(select));
  }, [select]);
  const handleDelete = async (id: (number | undefined)[]) => {
    const del = await deleteCart(id);
    return del;
  };
  const handleChangeAmount = (cal: string, id: number | undefined) => {
    if (!data && !id) return;
    setData((data) =>
      data?.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: cal === "add" ? item.quantity + 1 : item.quantity - 1,
            }
          : item
      )
    );
  };
  const handleDeletCartItem = async (id: number | undefined) => {
    const del = (await handleDelete([id])) as { message: string };
    if (del.message) {
      window.location.reload();
    }
  };
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
    const cardIds = select.map((item) => item.id);
    const del = await handleDelete(cardIds);
    if (del) {
      window.location.reload();
    }
  };
  const handleBuy = async () => {
    if (!user) return;
    order.customerId = user.id;
    order.orderData = select;
    setOrder(prev => ({
    ...prev,
    customerId: user.id,
    orderData: select
    }));

    const cardIds = select.map((item) => item.id);
    const res = (await createOrderId(order)) as { data: string };
    handleDelete(cardIds);
    if (res) {
      router.push(`/order/${res.data}`);
    }
  };

  const cartData = rawCartData() ? rawCartData() : "null";
  if (!data || !cartData)
    return (
      <div className=" flex justify-center items-center text-gray-500  p-4">
        <div>no cart items </div>
      </div>
    );
  return data?.length > 0 ? (
    <div className={`pt-5 grid grid-cols-2 `}>
      <div className="flex justify-center ">
        <div>
          {Object.entries(cartData).map(([key, values]) => (
            <div key={key} className=" px-5 py-3 mb-5 border w-2xl rounded-2xl">
              <Link href={`/store/${values[0].productItem.product.store.uuid}`}>
                <div className="flex items-center mb-3">
                  <div className="mx-4 w-[60px] h-[60px] rounded-full bg-amber-300"></div>
                  <div className="text-2xl font-bold">{key}</div>
                </div>
              </Link>
              
              {values &&
                values.map((value: ShoppingDetail, index: number) => (
                  <div key={index}>
                    <div className="flex gap-4 relative mb-2">
                      <input
                        type="checkbox"
                        name="selected"
                        value={value.id}
                        onChange={handleSelected}
                        className={`${value.quantity > value.productItem.stockQuantity || (select[0] && select[0].productItem.product.storeId !== value.productItem.product.storeId) ? "opacity-0" : ""}`}
                        disabled={
                          value.quantity > value.productItem.stockQuantity
                        }
                      />
                      {value.productItem.productItemImage && (
                        <Image
                          src={value.productItem.productItemImage.url}
                          alt={value.productItem.productItemImage.blobName}
                          height={200}
                          width={200}
                          className="object-fill w-[150px] h-[150px] "
                        />
                      )}

                      <div>
                        <div className="flex-1">
                          <Link
                            href={`/product/${value.productItem.product.uuid}`}
                            className="cursor-pointer hover:bg-gray-300 rounded-2xl text-xl font-medium"
                          >
                            {value.productItem.product.name}
                          </Link>
                          <div className="flex justify-between items-center">
                            <div className="pt-3  text-gray-500 font-ligth text-base">
                              {formatSku(value.productItem.configurations)}
                            </div>
                            <div className="flex gap-2 items-center absolute right-0 bottom-12 text-base font-normal">
                              <button
                                onClick={() => {
                                  if (value.quantity > 1) {
                                    handleChangeAmount("sub", value.id);
                                  } else if(value.quantity === 1 && value.id){
                                    setDeleteDialogItemId(value.id);
                                  }
                                }}
                                className={` rounded-xs hover:bg-gray-400 p-0.5 ${value.quantity == 0 || select.map((select) => select.id).includes(value.id) ? "opacity-0" : "opacity-100"}`}
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
                                className={`hover:bg-gray-400 p-0.5 rounded-xs ${value.quantity == value.productItem.stockQuantity || select.map((select) => select.id).includes(value.id) ? "opacity-0" : "opacity-100"}`}
                                onClick={() =>
                                  handleChangeAmount("add", value.id)
                                }
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {value.quantity >
                              value.productItem.stockQuantity && (
                              <div className="absolute bottom-5  text-red-400 text-[14px]">
                                * product has only{" "}
                                {value.productItem.stockQuantity}
                              </div>
                            )}
                          </div>

                          <div className="absolute bottom-0 right-0 text-xl ">
                            ฿{" "}
                            {(
                              (value.productItem.priceMinor * value.quantity) /
                              100
                            )
                              .toString()
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </div>
                        </div>
                      </div>
                    </div>
                    {deleteDialogItemId === value.id && (
                      <DialogDeletShopingCartItem
                        data={value}
                        aleartDeletItem={deleteDialogItemId === value.id}
                        setAleartDeletItem={(open) => {
                          if(typeof value.id !== 'undefined'){
                            setDeleteDialogItemId(open ? value.id : null)
                          }
                        }
                          
                        }
                        handleDeletCartItem={handleDeletCartItem}
                      />
                    )}
                  </div>
                ))}
              {values && values.length > 1 && (
                <div className="border-t pt-2 flex justify-between text-2xl">
                  <div >Total</div>
                  <div className="flex justify-end font-medium">
                    ฿{" "}
                    {(sumPrice(values) / 100)
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
        <div className="flex justify-center items-start">
          <div className=" flex flex-col w-2xl">
          <div className=" p-5 mb-5 border w-2xl h-fit rounded-2xl">
            <div className="flex justify-center  text-2xl ">
              selected items
            </div>
            <div className={`border-t flex justify-end my-2`}></div>
            <div>
              {select.map((value, index) => (
                <div key={index}>
                  {value.id && (
                    <div className="flex gap-4 relative mb-2">
                      {/* <div className="w-[100px] h-[100px] bg-amber-700"></div> */}
                      {
                        value.productItem.productItemImage && (
                          <Image
                          src={value.productItem.productItemImage.url}
                          alt={value.productItem.productItemImage.blobName}
                          height={120}
                          width={120}
                          className="object-fill w-[120px] h-[120px] "
                        />
                        )
                      }
                      <div>
                        <div className="flex-1">
                          <div className="text-xl font-medium">{value.productItem.product.name}</div>
                          <div className="absolute text-gray-500 pt-2 text-base ">
                            {formatSku(value.productItem.configurations)}
                          </div>
                          <div className="absolute bottom-0 right-0 text-base text-gray-500 ">
                            x {String(value.quantity)}
                          </div>
                          <div className="absolute bottom-7 right-0 text-xl  text-gray-500 ">
                            ฿{" "}
                            {(value.productItem.priceMinor / 100)
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
              <div className="text-2xl">Total</div>
              <div className="text-2xl font-medium">
                ฿{" "}
                {(sumPrice(select) / 100)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              </div>
            </div>
            <div className="flex justify-between items-center">
            <div className="mb-3 text-2xl ">I want to </div>
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={handleDel}
                  color="bg-red-500"
                  className="w-[150px] text-white"
                >
                  Delete
                </Button>
              </div>
              <div className="text-2xl ">or</div>
              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={handleBuy}
                  color="bg-green-500"
                  className="w-[150px] text-white"
                >
                  Buy
                </Button>
              </div>
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

const DialogDeletShopingCartItem = ({
  data,
  aleartDeletItem,
  setAleartDeletItem,
  handleDeletCartItem,
}: {
  data: ShoppingDetail;
  aleartDeletItem: boolean;
  setAleartDeletItem: React.Dispatch<SetStateAction<boolean>>;
  handleDeletCartItem: (id: number | undefined) => Promise<void>;
}) => {
  if (!data) return;
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
            className="fixed inset-0 bg-black/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
          >
            <div className={`fixed inset-0 z-100 w-screen overflow-y-auto `}>
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <DialogPanel
                  transition
                  className="relative transform overflow-hidden rounded-lg  text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                >
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="text-black text-lg">Do you want to delete {data.productItem.product.name} ?</div>
                    <div className="text-black text-base pt-2 ">detail {formatSku(data.productItem.configurations) ?? '-'}</div>
                  </div>
                  <div className="bg-white px-4 py-1 sm:flex sm:flex-row-reverse sm:px-6">
                    <Button
                      size="sm"
                      className={`text-sm text-white bg-green-500 sm:ml-3 sm:w-auto`}
                      onClick={() => handleDeletCartItem(data.id)}
                    >
                      Confirm
                    </Button>
                    <Button
                      size="sm"
                      className=" text-white bg-red-500"
                      onClick={() => setAleartDeletItem(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </DialogBackdrop>
        </Dialog>
      </div>
    </div>
  );
};
