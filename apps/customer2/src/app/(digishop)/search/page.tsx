'use client'
import { useEffect, useState, use } from 'react'
import { searchProduct } from '@/utils/requestUtils/requestProduct'
import NotFound from '@/components/notFound'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/productCard'
import { ChevronRight, ChevronLeft, SlidersHorizontal, Store as StoreIcon } from 'lucide-react'
import { Product, ProductItem, Store } from '@/types/props/productProp'

export default function SearchResult({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string }>
}) {
  const [rawProduct, setRawProduct] = useState<Product[] | undefined>(undefined)
  const [products, setProduct] = useState<Product[] | undefined>(undefined)
  const [stores, setStore] = useState<Store[] | undefined>(undefined)
  const [count, setCount] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [filter, setFilter] = useState('RELEVANCE') // RELEVANCE, ASC, DESC
  const { query } = use(searchParams)
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  const minPrice = (data: ProductItem[]) => {
    const price = data.map((item) => item.priceMinor)
    return Math.min(...price)
  }

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = (await searchProduct(query, page)) as {
          product: Product[]
          productCount: number
          store: Store[]
        }
        setRawProduct(res.product)
        setStore(res.store)
        setCount(res.productCount)
      } finally {
        setTimeout(() => setLoading(false), 500) // fake delay for loading animation smoothing
      }
    }
    fetchProduct()
  }, [query, page])

  useEffect(() => {
    if (!rawProduct) return
    const sorted = [...rawProduct]
    if (filter === 'ASC') {
      sorted.sort((a, b) => minPrice(a.items) - minPrice(b.items))
    } else if (filter === 'DESC') {
      sorted.sort((a, b) => minPrice(b.items) - minPrice(a.items))
    }
    setProduct(sorted)
  }, [filter, rawProduct])

  if (loading) {
     return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse mb-8" />
        <div className="flex gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-10 w-24 bg-gray-200 rounded animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
           {[1,2,3,4,5,6,7,8,9,10].map(i => (
             <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
           ))}
        </div>
      </div>
     )
  }

  const noResults = (!rawProduct?.length && !stores?.length)
  if(noResults) {
    return <NotFound props={query} />
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 min-h-screen">
      <div className="mb-6 flex items-center items-baseline gap-2">
         <h1 className="text-2xl font-bold text-gray-800">Search Results for &quot;{query}&quot;</h1>
         <span className="text-gray-500">({count} Product{count !== 1 ? 's' : ''})</span>
      </div>

      {stores && stores.length > 0 && (
         <div className="mb-8">
           <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
             <StoreIcon size={20} className="text-blue-pastel-500" /> Stores
           </h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stores.map((store, index) => (
                <button
                  key={index}
                  className="flex bg-white items-center p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer text-left w-full group"
                  onClick={() => router.push(`/store/${store.uuid}`)}
                >
                  <div className="h-16 w-16 rounded-full bg-blue-pastel-100 flex-shrink-0 flex items-center justify-center text-blue-pastel-500 font-bold text-2xl group-hover:scale-105 transition-transform overflow-hidden">
                     {store.storeName.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1 overflow-hidden">
                    <h3 className="text-lg font-medium text-gray-800 truncate">{store.storeName}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{store.description || 'Welcome to our store'}</p>
                  </div>
                </button>
              ))}
           </div>
         </div>
      )}

      {products && products.length > 0 && (
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
           <div className="flex bg-gray-50 p-2 rounded-lg items-center gap-4 text-sm font-medium text-gray-600">
             <span className="flex items-center gap-2 px-2"><SlidersHorizontal size={16}/> Sort By</span>
             <button onClick={() => setFilter('RELEVANCE')} className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${filter === 'RELEVANCE' ? 'bg-blue-pastel-500 text-white' : 'bg-white hover:bg-blue-50'}`}>Relevance</button>
             <button onClick={() => setFilter('ASC')} className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${filter === 'ASC' ? 'bg-blue-pastel-500 text-white' : 'bg-white hover:bg-blue-50'}`}>Price: Low to High</button>
             <button onClick={() => setFilter('DESC')} className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${filter === 'DESC' ? 'bg-blue-pastel-500 text-white' : 'bg-white hover:bg-blue-50'}`}>Price: High to Low</button>
           </div>
         </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products?.map((item: Product, index: number) => (
          <div
            key={index}
            className="cursor-pointer group flex justify-center hover:-translate-y-1 hover:shadow-lg transition-transform duration-300 rounded-b-2xl overflow-hidden bg-white shadow-sm"
            onClick={() => router.push(`/product/${String(item.uuid)}`)}
          >
            <Card data={item} />
          </div>
        ))}
      </div>

      {Math.ceil(count / 10) > 1 && (
        <div className="flex justify-center items-center text-lg mt-12 gap-6 bg-white py-4 rounded-xl shadow-sm w-max mx-auto px-8 border border-gray-100">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className={`p-2 rounded-full transition-colors ${page === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-blue-pastel-500 hover:bg-blue-50 cursor-pointer'}`}
            disabled={page === 1}
          >
            <ChevronLeft />
          </button>
          <span className="font-medium text-gray-700">
            {page} / {Math.ceil(count / 10)}
          </span>
          <button
            onClick={() => setPage(p => Math.min(Math.ceil(count / 10), p + 1))}
             className={`p-2 rounded-full transition-colors ${page === Math.ceil(count / 10) ? 'text-gray-300 cursor-not-allowed' : 'text-blue-pastel-500 hover:bg-blue-50 cursor-pointer'}`}
            disabled={page === Math.ceil(count / 10)}
          >
            <ChevronRight />
          </button>
        </div>
      )}
    </div>
  )
}
