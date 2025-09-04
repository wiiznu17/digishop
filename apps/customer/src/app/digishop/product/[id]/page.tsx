'use client'
import React, { useEffect, useState } from 'react';
import { notFound, useParams } from "next/navigation";
import { getProduct } from '@/utils/requestUtils/requestProduct';
import { Product } from '@/types/props/productProp';
import { useRouter } from 'next/navigation';

export default function ProductDetailPage() {
  // const params = useParams<{id: string}>()
  const { id } = useParams()
  const productName = String(id)
  const [product, setProduct] = useState<Product>()
  const router = useRouter()
  useEffect(()=> {
    const fetchData = async() => {
      const res = await getProduct(productName)
      setProduct(res.data)
    }
    fetchData()
  }, [productName])
  console.log('product',product)
  const handleBuy = () => {
    router.push(`/digishop/order/${productName}`)
  }
  
  return (
    product?
    <div className="p-6">
      <div className='mb-3 text-4xl'>{product.name}</div>
      <p className='text-gray-500 mb-2'>category: {product.category.name}</p>
      <div className='grid grid-cols-2 gap-4 mb-6'>
        <div className='w-[610px] h-[550px] bg-pink-200 text-center '>picture</div>
        <div>
          <h2>Product detail</h2>
          <h2 className='my-3'>{product.description}</h2>
          <h4 className='flex justify-center items-center h-[400px] text-8xl font-extrabold'>{product.price/100}</h4>
          <div className='flex justify-end'>
            <button className='rounded-2xl w-[200px] cursor-pointer bg-green-500 p-3 text-2xl' onClick={handleBuy}>Buy</button>
          </div>
        </div>
      </div>
      <div className='flex p-6 rounded-2xl w-2xl bg-gray-200'>
        <div className='h-[100px] w-[100px] rounded-[50px] bg-amber-800 '></div>
        <div className='px-4'>
          <h1 className='text-2xl font-extrabold'>{product.store.storeName}</h1>
          <h6 className='mt-4'>{product.store.description}</h6>
        </div>
      </div>
    </div> : <h1 className='text-black'>not found</h1>
  );
}