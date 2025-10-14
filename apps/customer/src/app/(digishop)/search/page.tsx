"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { searchProduct } from "@/utils/requestUtils/requestProduct";
import NotFound from "@/components/notFound";
import { useRouter } from "next/navigation";
import { Card } from "@/components/productCard";
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Product, ProductItem, Store } from "@/types/props/productProp";

export default function SearchResult({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const [rawProduct, setRawProduct] = useState<Product[]>();
  const [products, setProduct] = useState<Product[]>();
  const [stores, setStore] = useState<Store[]>();
  const [count, setCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [filter, setFilter] = useState("ASC");
  const { query } = use(searchParams);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchResult, setSearchResult] = useState<string[]|undefined>();
  const [hover, setHover] = useState<boolean>(false);
  const [loading, setLoading] = useState(false)
  const handleSearch = (query = searchQuery) => {
    setHover(false)
    setSearchResult(undefined)
    setSearchQuery(query)
    if (!query.trim()) return;
    router.push(`/search?query=${query}`);
  };
  useEffect(() => {
      const abort = new AbortController()
      const query = searchQuery.trim()
      if(query.length > 0 && loading){
        const timeOutId = setTimeout(async()=>{
          const res = await searchProduct(query); 
          const  productName = res.product.map(product => product.name)
          const  storeName = res.store.map(store => store.storeName)
          const resultSearch = productName.concat(storeName)
          if(resultSearch.length > 0){
            setSearchResult(resultSearch)
          }else{
            setSearchResult(undefined)
          }
          setLoading(false)
        },500)
        return () => { clearTimeout(timeOutId); abort.abort(); }
      }
    },[searchQuery, loading])
  const clearSearch = () => {
    setSearchQuery("");
  };
  const minPrice = (data: ProductItem[]) => {
    const price = data.map((item) => item.priceMinor);
    const minPrice = Math.min(...price);
    return minPrice;
  };
  useEffect(() => {
    const fetchProduct = async () => {
      const res = await searchProduct(query, page);
      setRawProduct(res.product);
      setStore(res.store);
      setCount(res.productCount);
    };
    fetchProduct();
  }, [query,page]);
  useEffect(() => {
    if (stores?.length && !rawProduct?.length) {
      setCount(1);
    }
  }, [stores, rawProduct]);
  useEffect(() => {
    if (!rawProduct) return;
    if (filter == "ASC") {
      const sorted = rawProduct?.sort(
        (a, b) => minPrice(a.items) - minPrice(b.items)
      );
      setProduct(sorted);
    } else if (filter == "DESC") {
      setProduct((rawProduct) =>
        rawProduct?.sort((a, b) => minPrice(b.items) - minPrice(a.items))
      );
    }
  }, [filter, products, rawProduct]);
  return (
    <div className=" pt-3" >
      <div className="flex justify-center mb-3 ">
        <div className="relative w-1/2">
          <input
            type="text"
            value={searchQuery}
            onFocus={() =>  setHover(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setLoading(true)
            }}
            placeholder="Search for products, brands, or categories..."
            className={ `w-full px-6 py-4 text-lg border-2 z-50 border-gray-200 ${searchResult && searchQuery  ? 'rounded-t-4xl':'rounded-full' } focus:border-blue-500 focus:outline-none shadow-lg text-black bg-white`}
          />
          {searchQuery && hover &&(
                  <div className='absolute right-0 z-100 w-full'>
                    {
                      searchResult?.map((result,index) => (
                          <button key={index} onClick={() => handleSearch(result)} className={`flex bg-white flex-row w-full p-4 border-b-2 border-x-2 border-gray-200 hover:bg-gray-300 ${index === searchResult.length -1 ? 'rounded-b-4xl':''}`}>{result}</button>
                      ))
                    }
                  </div>
                )}
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
            <button
              onClick={() => handleSearch()}
              className="bg-blue-500 text-white p-3 rounded-full hover:bg-blue-600 transition-colors"
            >
              <Search size={20} />
            </button>
          </div>
        </div>
      </div>
      {
        (!rawProduct && !stores ) || ( rawProduct?.length == 0 && stores?.length == 0 ) ? (
          <NotFound props={query} />
        ) : 
      <div className="flex justify-center items-center">
        <div className="w-3/4">
          {products?.length > 0 && (
            <div className="flex justify-end items-center mb-2">
              <div className="flex mx-3">
                <div className="mx-3">price</div>
                {filter == "ASC" ? (
                  <button
                    onClick={() => setFilter("DESC")}
                    className="bg-gray-200 p-1 hover:cursor-pointer"
                  >
                    <ArrowDown />
                  </button>
                ) : (
                  <button
                    onClick={() => setFilter("ASC")}
                    className="bg-gray-200 p-1 hover:cursor-pointer"
                  >
                    <ArrowUp />
                  </button>
                )}
              </div>
              <div className="">
                <div>
                  {(page - 1) * 10 + products.length} / {count}
                </div>
              </div>
            </div>
          )}
          <div className=" flex justify-center items-center">
            <div>
              <div className="grid grid-cols-2 gap-2 mb-6 ">
                {stores &&
                  stores.map((store, index) => (
                    <button
                      key={index}
                      onClick={() =>
                        router.push(
                          `http://localhost:3000/store/${store.uuid}`
                        )
                      }
                    >
                      <div className="flex p-6 rounded-2xl bg-gray-200 border-b ">
                        <div className="h-[100px] w-[100px] rounded-[50px] bg-amber-800 "></div>
                        <div className="px-4">
                          <h1 className="text-2xl font-extrabold">
                            {store.storeName}
                          </h1>
                          <h6 className="mt-4">{store.description}</h6>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {products &&
                  products.map((item: Product, index: number) => (
                    <div
                      key={index}
                      onClick={() =>
                        router.push(`/product/${String(item.uuid)}`)
                      }
                    >
                      <Card data={item} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <div className=" flex justify-center items-center mt-15 border-t py-5">
            <button
              onClick={() => setPage(page + 1)}
              className={`${page == 1 ? "opacity-0" : "opacity-100"}`}
            >
              <ChevronLeft />
            </button>
            <div className="mx-5">
              {page} / {Math.ceil(count / 10)}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              className={`${page == Math.ceil(count / 10) ? "opacity-0" : "opacity-100"}`}
            >
              <ChevronRight />
            </button>
          </div>
        </div>
      </div> 
      }
    </div>
  );
}
