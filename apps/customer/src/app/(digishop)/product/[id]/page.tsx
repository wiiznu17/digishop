"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProduct } from "@/utils/requestUtils/requestProduct";
import {
  Choices,
  Product,
  ProductItem,
} from "@/types/props/productProp";
import { useRouter } from "next/navigation";
import Button from "@/components/button";
import {
  createOrderId,
  createWishList,
} from "@/utils/requestUtils/requestOrderUtils";
import { OrderIdProp, ShoppingCartProps } from "@/types/props/orderProp";
import { useAuth } from "@/contexts/auth-context";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";


export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const discountMinor = 0;
  const productId = String(id);
  const router = useRouter();
  const [product, setProduct] = useState<Product>();
  const [choices, setChoices] = useState<Choices>();
  const [wishList, setWishList] = useState<ShoppingCartProps>();
  const [data, setData] = useState<OrderIdProp>({
    customerId: 0,
    orderData: [],
  });
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<ProductItem | null>();
  const [amount, setAmount] = useState(1);
  useEffect(() => {
    const fetchData = async () => {
      const res = (await getProduct(productId)) as {
        data: Product;
        choices: Choices;
      };
      setProduct(res.data);
      setChoices(res.choices);
    };
    fetchData();
    // setSelected()
  }, [productId]);
  console.log("product", product);
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
            configurations: selected.configurations,
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
      productItemId: [selected.id],
      quantity: [amount],
    });
  }, [user, product, amount, selected]);
  useEffect(() => {
    if (!product) return;
    const firstProduct = product.items.filter((item) => item.stockQuantity > 0);
    console.log("firstProduct", firstProduct);
    setSelected(firstProduct?.[0]);
    setOptions(filterOption(product.items)[0]);
  }, [product]);
  // check session
  useEffect(() => {
    const isFilter = (choices: string[]) => {
      //Object.values(options) = ['black']
      console.log(options);
      return options.every((option) => choices.includes(option));
    };
    if (!product) return;
    const filterChoice = allOption(product.items);
    //find index ไม่ได้เพราะเกิดปัญหากรณีมี stock 0
    const productIndex = filterChoice.findIndex((option) => isFilter(option));
    setSelected(product.items[productIndex]);
  }, [options, product]);
  // {color: "black"}
  useEffect(() => {
    setOptions(options);
    console.log("option in use", options);
  }, [options]);
  const handleOption = (index: number, value: string) => {
    //create new option
    const newOption = [...options];
    newOption[index] = value;
    setOptions(newOption);
  };
  console.log("options", options);
  // ['black','blue']
  const filterOption = (items: ProductItem[]) => {
    const data = items
      .filter((item) => item.stockQuantity > 0)
      .map((item) =>
        item.configurations.map((config) => config.variationOption.value)
      );
    return data;
  };
  const allOption = (items: ProductItem[]) => {
    const data = items.map((item) =>
      item.configurations.map((config) => config.variationOption.value)
    );
    return data;
  };
  const handleBuy = async () => {
    if (!user) {
      alert("Please log in before order product");
    } else {
      if (!data) return;
      console.log(data);
      const res = (await createOrderId(data)) as { data: string };
      if (res) {
        // window.open(`/order/${res.data}`,'_blank')
        router.push(`/order/${res.data}`);
      }
    }
  };
  const handleAddShoppingCart = async () => {
    if (!user) {
      alert("Please log in before add cart");
    } else {
      if (!wishList) return;
      const res = (await createWishList(wishList)) as {
        data: {
          cartId: number;
          productItemId: number;
          quantity: number;
          unitPriceMinor: number;
        };
      };
      if (res.data) {
        alert("Item successfully added to cart");
      }
    }
  };
  return product ? (
    <div className="flex justify-center">
      <div className="p-6">
        <div className="grid grid-cols-2 mb-6 gap-4 ">
          {selected === undefined && (
            <div className="w-full h-full bg-pink-200 text-center">
              {/* {product.images} */}
            </div>
          )}
          {selected?.productItemImage && (
            <div className="flex items-center justify-center">

              <Image
                src={selected.productItemImage.url}
                alt={selected.productItemImage.fileName}
                className="object-contain w-[500px] h-[600px] "
              />
            </div>
          )}
          <div className="mx-3 flex flex-col justify-between">
            <div>
              <div className="mb-3 text-5xl font-extrabold">{product.name}</div>
              <p className="text-gray-500 mb-2 border-b p-1">
                category: {product.category.name}
              </p>
              {choices?.variations.map((choice, indexs) => (
                <div key={indexs}>
                  <div>{choice.name}</div>
                  <div>
                    {choice.options.map((option, index) => (
                      <button
                        key={index}
                        className={`${option.value === options[indexs] ? "border-black" : "border-gray-300 text-gray-300"} border-1 rounded-md p-3 m-3 cursor-pointer`}
                        onClick={() => handleOption(indexs, option.value)}
                      >
                        {option.value}
                      </button>
                    ))}
                  </div>
                  </div>
                ))
              }
            
            {selected && (
              <div>
                <div className="flex items-center justify-center text-8xl">
                  <div>
                    ฿
                    {(selected.priceMinor / 100)
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}{" "}
                  </div>
                </div>
                <div>
                  {selected.stockQuantity > 0 && (
                    <div>
                      <div className="relative flex items-center justify-center mb-5">
                        <div>
                          <div className=" flex mt-4 ">
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
                          <div className=" flex text-gray-400 text-xl mt-2 items-end justify-center">
                            stock: {selected.stockQuantity}
                          </div>
                        </div>
                      </div>
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
                          // hidden={selected.stockQuantity === 0}
                          disabled={selected.stockQuantity === 0}
                        >
                          Buy
                        </Button>
                      </div>
                    </div>
                  )}
                  {selected.stockQuantity === 0 && (
                    <div className="flex items-center justify-center text-md mt-6">
                      Product out of stock
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="border p-4 rounded-2xl">
            <h2 className="text-2xl w-fit border-b">Description</h2>
            <h2 className="ml-5 my-5">{product.description}</h2>
          </div>
          <button
            className="flex p-6 rounded-2xl w-2xl bg-gray-200 border-b cursor-pointer"
            onClick={() =>
              router.push(`http://localhost:3000/store/${product.store.uuid}`)
            }
          >
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
    </div>
  ) : (
    <h1 className="text-black">not found</h1>
  );
}
