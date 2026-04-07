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
import { Minus, Plus, ShoppingCart, Store as StoreIcon } from 'lucide-react'
import Image from 'next/image'

export default function ProductDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const discountMinor = 0
  const productId = String(id)
  const router = useRouter()
  const [product, setProduct] = useState<Product | undefined>()
  const [choices, setChoices] = useState<Choices>()
  const [wishList, setWishList] = useState<ShoppingCartProps>()
  const [data, setData] = useState<OrderIdProp>({
    customerId: 0,
    orderData: []
  })
  const [options, setOptions] = useState<string[]>([])
  const [selected, setSelected] = useState<ProductItem | null>()
  const [amount, setAmount] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = (await getProduct(productId)) as {
          data: Product
          choices: Choices
        }
        setProduct(res.data)
        setChoices(res.choices)
      } finally {
        setTimeout(() => setLoading(false), 500)
      }
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4 animate-pulse">
        <div className="bg-white rounded-2xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border border-gray-100">
           <div className="h-96 bg-gray-200 rounded-xl" />
           <div>
             <div className="h-10 bg-gray-200 w-3/4 rounded mb-4" />
             <div className="h-6 bg-gray-200 w-1/4 rounded mb-10" />
             <div className="h-20 bg-gray-100 w-full rounded mb-6" />
             <div className="h-12 bg-gray-100 w-full rounded mb-6" />
           </div>
        </div>
      </div>
    )
  }

  if(!product) {
    return <div className="text-center py-20 text-xl text-gray-500">Product not found</div>
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* Main Product Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Image Gallery */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="aspect-square bg-white rounded-2xl border flex items-center border-gray-100 justify-center overflow-hidden hover:shadow-md transition-shadow">
              {selected?.productItemImage ? (
                <Image
                  src={selected.productItemImage.url}
                  alt={selected.productItemImage.fileName}
                  height={600}
                  width={500}
                  className="object-contain w-full h-full hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="text-gray-400 font-medium">No Image Available</div>
              )}
            </div>
            {/* Thumbnail Placeholders (Optional) */}
            <div className="flex gap-2">
               {[1,2,3].map(i => (
                 <div key={i} className="h-20 w-20 rounded-lg bg-blue-pastel-50 border border-blue-pastel-100 cursor-pointer overflow-hidden hover:border-blue-pastel-400 transition-colors" />
               ))}
            </div>
          </div>

          {/* Details & Actions */}
          <div className="md:col-span-7 flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-gray-500 mb-6 flex items-center gap-2">
               Category: <span className="bg-blue-pastel-50 text-blue-pastel-600 px-2 py-0.5 rounded-full text-sm font-medium">{product.category.name}</span>
            </p>

            {/* Price Box */}
            <div className="bg-blue-pastel-50/50 p-6 rounded-2xl mb-8 flex items-end gap-4 shadow-inner">
               <span className="text-gray-500 line-through text-lg">฿{(((selected?.priceMinor || 0) + 50000) / 100).toLocaleString()}</span>
               <span className="text-4xl lg:text-5xl font-bold text-blue-pastel-600">
                  ฿{((selected?.priceMinor || 0) / 100).toLocaleString()}
               </span>
               <span className="bg-blue-pastel-500 text-white text-xs font-bold px-2 py-1 rounded">HOT DEAL</span>
            </div>

            {/* Variations */}
            <div className="mb-8">
              {choices?.variations.map((choice, indexs) => (
                <div key={indexs} className="mb-6 flex items-center gap-6">
                  <span className="w-16 lg:w-20 text-gray-500 font-medium">{choice.name}</span>
                  <div className="flex flex-wrap gap-3">
                    {choice.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleOption(indexs, option.value)}
                        className={`px-4 py-2 rounded-lg border transition-all cursor-pointer ${
                          option.value === options[indexs]
                            ? 'border-blue-pastel-500 text-blue-pastel-600 bg-blue-pastel-50 shadow-sm font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-blue-pastel-300 hover:text-blue-pastel-500 bg-white'
                        }`}
                      >
                        {option.value}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selected && selected.stockQuantity > 0 ? (
               <>
                 {/* Quantity Control */}
                 <div className="flex items-center gap-6 mb-8">
                    <span className="w-16 lg:w-20 text-gray-500 font-medium">Quantity</span>
                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                      <button
                        disabled={amount <= 1}
                        onClick={() => setAmount(amount - 1)}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer text-gray-600 flex items-center justify-center"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="w-14 text-center font-medium border-x border-gray-300 py-3">
                        {amount}
                      </span>
                      <button
                        disabled={amount >= selected.stockQuantity}
                        onClick={() => setAmount(amount + 1)}
                        className="p-3 hover:bg-gray-100 disabled:opacity-50 transition-colors cursor-pointer text-gray-600 flex items-center justify-center"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                    <span className="text-gray-500 text-sm">{selected.stockQuantity} pieces available</span>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex items-center gap-4 mt-auto pt-6">
                    <button
                      onClick={handleAddShoppingCart}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-pastel-50 hover:bg-blue-pastel-100 text-blue-pastel-600 border border-blue-pastel-300 py-4 rounded-xl font-semibold transition-all hover:shadow-md cursor-pointer"
                    >
                      <ShoppingCart size={20} /> Add to Cart
                    </button>
                    <button
                      onClick={handleBuy}
                      className="flex-1 bg-blue-pastel-500 hover:bg-blue-pastel-600 text-white py-4 rounded-xl font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      Buy Now
                    </button>
                 </div>
               </>
            ) : (
                <div className="mt-8 p-4 bg-gray-100 text-gray-600 text-center font-medium rounded-xl">
                    Product Out of Stock
                </div>
            )}

          </div>
        </div>
      </div>

      {/* Store Box */}
      <button
        className="mt-6 w-full flex items-center p-6 rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer text-left group"
        onClick={() => router.push(`/store/${product.store.uuid}`)}
      >
        <div className="h-16 w-16 rounded-full bg-blue-pastel-100 text-blue-pastel-500 flex items-center justify-center font-bold text-2xl group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
           {product.store.storeName.charAt(0)}
        </div>
        <div className="ml-6 flex-1 md:border-r border-gray-200 md:pr-6">
          <h2 className="text-xl font-bold text-gray-800">{product.store.storeName}</h2>
          <p className="text-gray-500 flex items-center gap-1 mt-1"><StoreIcon size={16}/> {product.store.description || 'View Store Profile'}</p>
        </div>
        <div className="hidden md:block px-6 text-blue-pastel-500 font-medium group-hover:translate-x-1 transition-transform">
           Visit Store &rarr;
        </div>
      </button>

      {/* Description Box */}
      <div className="mt-6 bg-white border border-gray-100 p-8 rounded-2xl shadow-sm">
        <h2 className="text-lg bg-blue-pastel-50 text-blue-pastel-600 px-4 py-2 font-bold w-fit rounded-lg mb-6">Product Specifications</h2>
        <div className="text-gray-700 leading-relaxed max-w-4xl whitespace-pre-wrap">
          {product.description}
        </div>
      </div>

    </div>
  )
}
