'use client'
import { useAuth } from '@/contexts/auth-context'
import { OrderIdProp, ShoppingDetail } from '@/types/props/orderProp'
import { fetchUserChart, createOrderId, deleteCart } from '@/utils/requestUtils/requestOrderUtils'
import { SetStateAction, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/button'
import { Minus, Plus, Store as StoreIcon, Trash2, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { formatSku } from '@/lib/function'
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react'
import Image from 'next/image'

export default function ShoppingCart() {
  const [data, setData] = useState<ShoppingDetail[] | undefined>()
  const { user } = useAuth()
  const router = useRouter()
  const [select, setSelected] = useState<ShoppingDetail[]>([])
  const [deleteDialogItemId, setDeleteDialogItemId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  const [order, setOrder] = useState<OrderIdProp>({
    customerId: user?.id ?? 0,
    orderData: []
  })

  useEffect(() => {
    const fetchCart = async () => {
      setLoading(true)
      try {
        if (user) {
          const cartData = (await fetchUserChart(user.id)) as { data: ShoppingDetail[] }
          setData(cartData.data)
        }
      } finally {
        setTimeout(() => setLoading(false), 500)
      }
    }
    fetchCart()
  }, [user])

  const sumPrice = (items: ShoppingDetail[]) => {
    let sum = 0
    for (let i = 0; i < items.length; i++) {
      sum += items[i].quantity * items[i].productItem.priceMinor
    }
    return sum
  }

  const rawCartData = () => {
    if (!data) return
    return Object.groupBy(data, ({ productItem }) => productItem.product.store.storeName)
  }

  const handleDelete = async (id: (number | undefined)[]) => {
    const del = await deleteCart(id)
    return del
  }

  const handleChangeAmount = (cal: string, id: number | undefined) => {
    if (!data && !id) return
    setData((data) =>
      data?.map((item) =>
        item.id === id
          ? { ...item, quantity: cal === 'add' ? item.quantity + 1 : item.quantity - 1 }
          : item
      )
    )
    setSelected((sel) =>
      sel.map((item) =>
         item.id === id
          ? { ...item, quantity: cal === 'add' ? item.quantity + 1 : item.quantity - 1 }
          : item
      )
    )
  }

  const handleDeletCartItem = async (id: number | undefined) => {
    const del = (await handleDelete([id])) as { message: string }
    if (del.message) {
      window.location.reload()
    }
  }

  const handleSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    if (!checked) {
      if (select) {
        setSelected(select.filter((item) => String(item.id) !== value))
      }
    } else {
      const filterData = data?.filter((item) => String(item.id) === value) ?? []
      setSelected([...(select ?? []), ...filterData])
    }
  }

  const handleDelSelected = async () => {
    if (!user) return
    if (confirm('Are you sure you want to delete these items from your cart?')) {
      const cardIds = select.map((item) => item.id)
      const del = await handleDelete(cardIds)
      if (del) {
        window.location.reload()
      }
    }
  }

  const handleBuy = async () => {
    if (!user) return
    order.customerId = user.id
    order.orderData = select
    setOrder((prev) => ({ ...prev, customerId: user.id, orderData: select }))

    const cardIds = select.map((item) => item.id)
    const res = (await createOrderId(order)) as { data: string }
    handleDelete(cardIds)
    if (res) {
      router.push(`/order/${res.data}`)
    }
  }

  if (loading) {
     return (
       <div className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
         <div className="lg:col-span-2 flex flex-col gap-6">
           <div className="h-48 bg-white rounded-xl shadow-sm border border-gray-100" />
           <div className="h-48 bg-white rounded-xl shadow-sm border border-gray-100" />
         </div>
         <div className="lg:col-span-1">
           <div className="h-64 bg-white rounded-xl shadow-sm border border-gray-100 sticky top-24" />
         </div>
       </div>
     )
  }

  const cartData = rawCartData()
  const isEmpty = !data || data.length === 0

  if (isEmpty) {
     return (
        <div className="max-w-6xl mx-auto py-20 px-4 flex flex-col items-center justify-center text-center">
          <div className="bg-blue-pastel-50 p-6 rounded-full mb-6">
             <ShoppingBag size={64} className="text-blue-pastel-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 max-w-sm">Looks like you haven't added anything to your cart yet. Discover great products now!</p>
          <Link href="/" className="bg-blue-pastel-500 text-white px-8 py-3 rounded-full font-medium hover:bg-blue-pastel-600 hover:shadow-lg transition-all">
            Continue Shopping
          </Link>
        </div>
     )
  }

  return (
     <div className="max-w-6xl mx-auto py-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Cart Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
           <div className="flex items-center justify-between pb-4 border-b border-gray-200">
             <h1 className="text-2xl font-bold text-gray-800">Shopping Cart <span className="text-gray-500 text-lg font-normal">({data?.length || 0} items)</span></h1>
           </div>

           {cartData && Object.entries(cartData).map(([storeName, values]) => (
             <div key={storeName} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                <Link href={`/store/${values?.[0]?.productItem.product.store.uuid}`} className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3 hover:bg-blue-pastel-50 transition-colors cursor-pointer">
                  <div className="h-8 w-8 bg-blue-pastel-200 text-blue-pastel-600 rounded-lg flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                     {storeName.charAt(0)}
                  </div>
                  <span className="font-semibold text-gray-800 flex items-center gap-2"><StoreIcon size={16}/>{storeName}</span>
                </Link>

                <div className="p-2">
                  {values?.map((item: ShoppingDetail, index: number) => {
                     const isOutOfStock = item.quantity > item.productItem.stockQuantity;
                     const isDiffStore = select.length > 0 && select[0].productItem.product.storeId !== item.productItem.product.storeId;
                     const disabled = isOutOfStock || isDiffStore;

                     return (
                        <div key={item.id} className="flex gap-4 p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded-xl relative">
                           <div className="flex items-center">
                              <label className="relative flex items-center p-2 rounded-full cursor-pointer">
                                 <input 
                                   type="checkbox" 
                                   value={item.id} 
                                   onChange={handleSelected}
                                   disabled={disabled}
                                   checked={select.some(s => s.id === item.id)}
                                   className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-pastel-500 before:opacity-0 before:transition-opacity checked:border-blue-pastel-500 checked:bg-blue-pastel-500 checked:before:bg-blue-pastel-500 hover:scale-105 hover:before:opacity-10 disabled:opacity-50"
                                 />
                                 <span className="absolute text-white transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1">
                                     <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                   </svg>
                                 </span>
                              </label>
                           </div>

                           <Link href={`/product/${item.productItem.product.uuid}`} className="shrink-0">
                              {item.productItem.productItemImage ? (
                                <Image
                                  src={item.productItem.productItemImage.url}
                                  alt={item.productItem.productItemImage.blobName}
                                  height={100}
                                  width={100}
                                  className="object-cover w-24 h-24 rounded-lg border border-gray-100 shadow-sm"
                                />
                              ) : (
                                <div className="w-24 h-24 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-xs text-gray-400">No Image</div>
                              )}
                           </Link>

                           <div className="flex-1 flex flex-col justify-between">
                              <div className="flex justify-between items-start gap-4">
                                <Link href={`/product/${item.productItem.product.uuid}`} className="font-medium text-gray-800 hover:text-blue-pastel-600 transition-colors line-clamp-2">
                                  {item.productItem.product.name}
                                </Link>
                                <div className="text-right whitespace-nowrap font-bold text-gray-800">
                                   ฿{((item.productItem.priceMinor * item.quantity)/100).toLocaleString()}
                                </div>
                              </div>

                              <div className="text-sm text-gray-500 mb-2 whitespace-pre-line">
                                 {formatSku(item.productItem.configurations)}<br/>฿{(item.productItem.priceMinor/100).toLocaleString()} / item
                              </div>

                              <div className="flex justify-between items-end gap-2 mt-auto">
                                 <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                    <button 
                                      onClick={() => {
                                        if (item.quantity > 1) handleChangeAmount('sub', item.id)
                                        else if (item.quantity === 1) setDeleteDialogItemId(item.id!)
                                      }}
                                      className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
                                      disabled={select.some(s => s.id === item.id)}
                                    >
                                      {item.quantity === 1 ? <Trash2 size={16} className="text-red-500" /> : <Minus size={16} />}
                                    </button>
                                    <span className="w-10 text-center font-medium text-sm py-1 border-x border-gray-200">
                                      {item.quantity}
                                    </span>
                                    <button 
                                      onClick={() => handleChangeAmount('add', item.id)}
                                      disabled={item.quantity >= item.productItem.stockQuantity || select.some(s => s.id === item.id)}
                                      className="p-1.5 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      <Plus size={16} />
                                    </button>
                                 </div>
                                 
                                 {isOutOfStock && (
                                   <div className="text-xs text-red-500 font-medium">Only {item.productItem.stockQuantity} left</div>
                                 )}
                              </div>
                           </div>

                           {deleteDialogItemId === item.id && (
                             <DialogDeletShopingCartItem
                               data={item}
                               aleartDeletItem={deleteDialogItemId === item.id}
                               setAleartDeletItem={(open) => setDeleteDialogItemId(open ? item.id! : null)}
                               handleDeletCartItem={handleDeletCartItem}
                             />
                           )}
                        </div>
                     )
                  })}
                </div>
             </div>
           ))}
        </div>

        {/* Right Column - Checkout Summary */}
        <div className="lg:col-span-1">
           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-28">
              <h2 className="text-lg font-bold text-gray-800 mb-6 pb-4 border-b border-gray-100">Order Summary</h2>
              
              <div className="flex justify-between items-center mb-4 text-gray-600">
                <span>Selected Items</span>
                <span className="font-medium">{select.length}</span>
              </div>
              
              <div className="flex justify-between items-end mb-6 pt-4 border-t border-gray-100">
                <span className="text-gray-800 font-medium">Total</span>
                <span className="text-3xl font-bold text-blue-pastel-600">฿{(sumPrice(select)/100).toLocaleString()}</span>
              </div>

              {select.length > 0 ? (
                <div className="flex flex-col gap-3">
                   <button 
                     onClick={handleBuy}
                     className="w-full bg-blue-pastel-500 hover:bg-blue-pastel-600 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer"
                   >
                     Checkout ({select.length})
                   </button>
                   <button 
                     onClick={handleDelSelected}
                     className="w-full bg-red-50 hover:bg-red-100 text-red-500 font-bold py-3 rounded-xl transition-all border border-red-200 cursor-pointer"
                   >
                     Remove Selected
                   </button>
                </div>
              ) : (
                <div className="bg-gray-50 text-gray-400 text-center py-4 rounded-xl font-medium border border-gray-100">
                   Select items to checkout
                </div>
              )}
           </div>
        </div>
     </div>
  )
}

const DialogDeletShopingCartItem = ({
  data,
  aleartDeletItem,
  setAleartDeletItem,
  handleDeletCartItem
}: {
  data: ShoppingDetail
  aleartDeletItem: boolean
  setAleartDeletItem: React.Dispatch<SetStateAction<boolean>>
  handleDeletCartItem: (id: number | undefined) => Promise<void>
}) => {
  if (!data) return null
  return (
    <Dialog
      open={aleartDeletItem}
      onClose={() => setAleartDeletItem(false)}
      className="relative z-50"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 transition-opacity backdrop-blur-sm"
      />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">Remove Item</h3>
            <p className="text-gray-600 mb-1">
              Do you want to remove <strong>{data.productItem.product.name}</strong> from your cart?
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Detail: {formatSku(data.productItem.configurations) || '-'}
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setAleartDeletItem(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletCartItem(data.id)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-sm cursor-pointer"
              >
                Remove
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
