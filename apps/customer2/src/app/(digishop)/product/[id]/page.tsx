'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProduct } from '@/utils/requestUtils/requestProduct'
import { Choices, Product, ProductItem } from '@/types/props/productProp'
import { useRouter } from 'next/navigation'
import Button from '@/components/button'
import {
  createOrderId,
  createWishList
} from '@/utils/requestUtils/requestOrderUtils'
import { OrderIdProp, ShoppingCartProps } from '@/types/props/orderProp'
import { useAuth } from '@/contexts/auth-context'
import { Minus, Plus } from 'lucide-react'
import Image from 'next/image'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const discountMinor = 0
  const productId = String(id)
  const router = useRouter()
  const [product, setProduct] = useState<Product>()
  const [choices, setChoices] = useState<Choices>()
  const [wishList, setWishList] = useState<ShoppingCartProps>()
  const [data, setData] = useState<OrderIdProp>({
    customerId: 0,
    orderData: []
  })
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<ProductItem | null>()
  const [amount, setAmount] = useState(1)
  useEffect(() => {
    const fetchData = async () => {
      const res = (await getProduct(productId)) as {
        data: Product
        choices: Choices
      }
      setProduct(res.data)
      setChoices(res.choices)
    }
    fetchData()
  }, [productId])
  useEffect(() => {
    if (!user || !product || !selected) return
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
              store: product.store
            }
          }
        }
      ]
    })
    setWishList({
      customerId: user.id,
      productItemId: [selected.id],
      quantity: [amount]
    })
  }, [user, product, amount, selected])

  const handleOption = (index: number, value: string) => {
    const newOption = [...options]
    newOption[index] = value
    setOptions(newOption)
  }
  useEffect(() => {
    if (!product) return

    const availableItem = product.items
      .filter((item) => item.stockQuantity > 0)
      .sort((a, b) => a.id - b.id)[0]

    if (!availableItem) return

    setSelected(availableItem)

    const initialOptions = availableItem.configurations.map(
      (config) => config.variationOption.value
    )
    setOptions(initialOptions)
  }, [product])

  useEffect(() => {
    if (!product || options.length === 0) return

    const allChoices = product.items.map((item) =>
      item.configurations.map((config) => config.variationOption.value)
    )

    const productIndex = allChoices.findIndex((choice) =>
      choice.every((opt, i) => opt === options[i])
    )

    if (productIndex >= 0) {
      setSelected(product.items[productIndex])
    }
  }, [options, product])
  const handleBuy = async () => {
    if (!user) {
      alert('Please log in before order product')
    } else {
      if (!data) return
      const res = (await createOrderId(data)) as { data: string }
      if (res) {
        router.push(`/order/${res.data}`)
      }
    }
  }
  const handleAddShoppingCart = async () => {
    if (!user) {
      alert('Please log in before add cart')
    } else {
      if (!wishList) return
      const res = (await createWishList(wishList)) as {
        data: {
          cartId: number
          productItemId: number
          quantity: number
          unitPriceMinor: number
        }
      }
      if (res.data) {
        alert('Item successfully added to cart')
      }
    }
  }
  return product ? (
    <div className="flex justify-center">
      <div className="p-6">
        <div className="grid grid-cols-2 mb-6 gap-4 ">
          {selected === undefined ||
            (!selected?.productItemImage && (
              <div className="w-full h-full bg-pink-200 text-center">
                No picture
              </div>
            ))}
          {selected?.productItemImage && (
            <div className="flex items-center justify-center">
              <Image
                src={selected.productItemImage.url}
                alt={selected.productItemImage.fileName}
                height={600}
                width={500}
                className="object-contain h-[600px] w-[500px] "
              />
            </div>
          )}

          <div className="mx-3 flex flex-col justify-between">
            <div>
              <div className="mb-3 text-5xl font-extrabold">{product.name}</div>
              <p className="text-gray-500 text-base mb-2 border-b p-1">
                category: {product.category.name}
              </p>
              {choices?.variations.map((choice, indexs) => (
                <div key={indexs}>
                  <div className="text-lg font-medium">{choice.name}</div>
                  <div>
                    {choice.options.map((option, index) => (
                      <button
                        key={index}
                        className={`${option.value === options[indexs] ? 'border-black' : 'border-gray-300 text-gray-300'} border-1 rounded-md p-3 m-3 cursor-pointer text-lg`}
                        onClick={() => handleOption(indexs, option.value)}
                      >
                        {option.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selected && (
              <div>
                <div className="flex items-center justify-center text-8xl font-bold">
                  <div className="">
                    ฿
                    {(selected.priceMinor / 100)
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}{' '}
                  </div>
                </div>
                <div>
                  {selected.stockQuantity > 0 && (
                    <div>
                      <div className="relative flex items-center justify-center ">
                        <div>
                          <div className=" flex mt-4 items-center">
                            <button
                              disabled={amount == 1}
                              onClick={() => setAmount(amount - 1)}
                              className={`p-2 rounded-xs  bg-red-400 ${amount == 1 ? 'opacity-0' : 'opacity-100'}`}
                            >
                              <Minus className="w-7 h-7" />
                            </button>

                            <span className="w-20 h-11 text-2xl bg-gray-200 text-center font-ligth text-gray-900">
                              {amount}
                            </span>

                            <button
                              disabled={amount == selected.stockQuantity}
                              className={`p-2 rounded-xs bg-green-300 ${amount == selected.stockQuantity ? 'opacity-0' : 'opacity-100'}`}
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
            <h2 className="text-2xl font-medium w-fit border-b">Description</h2>
            <h2 className="ml-5 my-5 text-lg">{product.description}</h2>
          </div>
          <button
            className="flex p-6 rounded-2xl w-2xl bg-gray-200 border-b cursor-pointer"
            onClick={() => router.push(`/store/${product.store.uuid}`)}
          >
            <div className="h-[100px] w-[100px] rounded-[50px] bg-amber-800 "></div>
            <div className="px-4">
              <h1 className="text-2xl font-bold">{product.store.storeName}</h1>
              <h6 className="mt-4 text-lg">{product.store.description}</h6>
            </div>
          </button>
        </div>
      </div>
    </div>
  ) : (
    <h1 className="text-black">not found</h1>
  )
}
