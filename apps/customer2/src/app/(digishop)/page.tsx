'use client'
import React, { useEffect, useState } from 'react'
import { Rubik } from 'next/font/google'
import { BannerCarousel } from '@/components/BannerCarousel'
import { CategoryGrid } from '@/components/CategoryGrid'
import { searchProduct } from '@/utils/requestUtils/requestProduct'
import { Product, Store } from '@/types/props/productProp'
import { Card } from '@/components/productCard'

const rubik = Rubik({
  subsets: ['latin'],
  weight: '500'
})

type ProductResponse = {
  product: Product[]
  productCount: number
  store: Store[]
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch products with empty query to get all or generic list
        const res = (await searchProduct('')) as ProductResponse
        if (res && res.product) {
          setProducts(res.product)
        } else {
           // fallback if empty query doesn't return
          const fallbackRes = (await searchProduct('a')) as ProductResponse
          if(fallbackRes && fallbackRes.product) {
            setProducts(fallbackRes.product)
          }
        }
      } catch (error) {
        console.error('Failed to fetch products:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  return (
    <main className="min-h-screen pb-20">
      <BannerCarousel />
      <CategoryGrid />
      
      {/* Daily Discover Section */}
      <div className="max-w-6xl mx-auto mt-8">
        <div className="bg-white p-4 pt-6 border-b-4 border-blue-pastel-500 rounded-t-lg shadow-sm">
          <h2 className={`text-2xl font-bold text-center text-blue-pastel-500 tracking-wide uppercase ${rubik.className}`}>
            Daily Discover
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20 bg-white shadow-sm rounded-b-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-pastel-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="flex justify-center">
                  <Card data={product} />
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-lg shadow-sm">
                Products will appear here. Start searching to explore!
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
