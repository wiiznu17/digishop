'use client'
import NotFound from "@/components/notFound"
import { useAuth } from "@/contexts/auth-context"
import { Address } from "@/types/props/addressProp"
import { Order } from "@/types/props/orderProp"
import { Product } from "@/types/props/productProp"
import { createOrder } from "@/utils/requestUtils/requestOrderUtils"
import { getProduct } from "@/utils/requestUtils/requestProduct"
import { getAddress } from "@/utils/requestUtils/requestUserUtils"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { DialogAddress } from "@/components/createAddress";
import AddressCard from "@/components/addressCard"


export default function OrderPage(){
      const { id } = useParams()
      const productName = String(id)
      const [order, setOrder] = useState<Order>()
      const [addresses, setAddresses] = useState<Address[]>()
      const [selectAddress, setSelectAddress] = useState<Address>()
      const [product, setProduct] = useState<Product>()
      const [processStatus, setProcessStatus] = useState('1')
      const [amount, setAmount] = useState(1)
      const [price, setPrice] = useState(0)
      const shippingCost = 37
      const {user} = useAuth()
      useEffect(()=> {
        const fetchData = async() => {
          const resProduct = await getProduct(productName)
          const resAddress = await getAddress(user?.id)
          setProduct(resProduct.data)
          setAddresses(resAddress.data)
        }
        fetchData()
      }, [productName, user?.id ])
      useEffect(()=> {
        const sumprice = shippingCost + Number(product?.price) * amount
        setPrice(sumprice)
      },[amount, product?.price])
      useEffect(()=> {
        console.log(selectAddress)
      },[selectAddress])
      const handleOrder = async() => {
        if(!user || !product) return
        setOrder({
          customerId: user.id ,
          storeId: product.store.id,
          totalPrice: price,
          productId: product.id,
          unitPrice: product.price,
          quantity: amount
        })
        try {
          if(order){
            const res = await createOrder(order)
            if(res.data){
              setProcessStatus('2')
            }
          }
        } catch (error) {
          console.log(error)          
        }
      }
      const statusConfig = {
        '1': {
          label: '1',
          color: 'text-white font-extrabold bg-black ',
          bg: ''
        },
        '2': {
          label: '2',
          color: 'text-white font-extrabold bg-black',
          bg: 'bg-black'
        },
        '3': {
          label:'3',
          color: 'text-white font-extrabold bg-black',
          bg: 'bg-black'
        }
      }
      const isMain = addresses?.filter((address) => address.isDefault === true)
      if(isMain){
        setSelectAddress(isMain[0])
      }
    if(user == null || user.id <= 0) return
    return <>
      <div className="min-h-screen p-3"> 
        <div className="flex justify-center items-center mb-3">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className={`flex flex-col items-center rounded-[35px]  text-xl w-[70px] h-[70px] p-5 mx-10 ${processStatus === status ? `${config.color}` : 'text-white bg-gray-300 ' }`}>{config.label}</div>
        ))
        }
        </div>
        { 
          processStatus === '1' && product &&
          <>
            {/* store info */}
            <div className="flex mb-3">
              <div className='h-[70px] w-[70px] rounded-[35px] bg-amber-800 '></div>
              <h1 className='text-2xl font-extrabold px-4'>{product.store.storeName}</h1>
            </div>
            {/* product info */}
            <div className="">
              <div className=" h-[350px] flex">
                <div className="w-[500px] h-[350px] bg-amber-400">picture</div>
                <div className="">
                  <div className="font-extrabold text-6xl mb-5">{product.name}</div>
                  {/* add product */}
                  <div className="flex">
                  <div className="flex m-6">
                    <button className={`px-3 rounded-xs  bg-red-400 ${amount == 1 ? 'opacity-0':'opacity-100'}`} onClick={() => setAmount(amount - 1)} > - </button>
                    <div className="mx-8 ">{amount}</div>
                    <button className={`px-3 rounded-xs bg-green-300 ${amount == product?.stockQuantity?'opacity-0':'opacity-100'}`} onClick={() => setAmount(amount + 1)}> + </button>
                  </div>
                    <div className="text-5xl mx-9">{product?.price}</div>
                  </div>
                </div>
              {/* price product */}
              </div>
              
            </div>
            {/* address info*/}
            {/* {
              addresses?.map((address,index) => (
                <div key={index} onClick={(address) => setSelectAddress(address)}>
                  <AddressCard item={address}/>
                </div>
              ))
            } */}
            {
              selectAddress && (
                <>
                <button>
                  <AddressCard item={selectAddress}/>
                </button>
                </>
              )
            }
            {/* total price */}
            <div className="flex">
              <div className="mb-6 text-4xl">total price</div>
              <div className="mx-10 text-6xl">{price}</div>
            </div>
            {/* buttonb  */}
            <button onClick={handleOrder} className='bg-green-400 hover:bg-green-600 cursor-pointer p-4 rounded-2xl text-2xl'>
              confirm
            </button>
          </>
        }
        {
          processStatus === '2' && 
          <h1>redirect payment</h1>
        }
        {
          processStatus === '3' && 
          <div className="flex justify-center items-center text-black">
            <div>Process finished</div>
            <div className="grid grid-cols-1">
            <Link href={'/digishop'} className="p-3 m-3 bg-amber-200">back to home page</Link>
            <Link href={'/status'} className="p-3 m-3 bg-amber-100">see status</Link>
            </div>
          </div>
        }
      </div>
    </>
}

