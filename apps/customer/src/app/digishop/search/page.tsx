"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { searchProduct } from "@/utils/requestUtils/requestProduct";
import NotFound from "@/components/notFound";
import { useRouter } from "next/navigation";
import {Card} from "@/components/productCard";
import { Search, X } from "lucide-react";
import { Product, Store } from "@/types/props/productProp";

export default function SearchResult({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string }>;
}) {
  const [products, setProduct] = useState<Product[] >();
  const [stores, setStore] = useState<Store[]>();
  // const [stores, setStore] = useState<Store[]>();
  const { query } = use(searchParams);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(query);
  const handleSearch = (query = searchQuery) => {
    if (!query.trim()) return;
    router.push(`/digishop/search?query=${query}`);
  };
  const clearSearch = () => {
    setSearchQuery("");
  };
  useEffect(() => {
    const fetchProduct = async () => {
      const res = await searchProduct(query);
      setProduct(res.product);
      setStore(res.store);
    };
    fetchProduct();
  }, [query]);
  console.log('products',products)
  console.log('store',stores)
  return !products && !stores ? (
    <NotFound props={query} />
  ) : (
    <div className="pt-3">
      <div className="flex justify-center mb-10 ">
        <div className="relative w-1/2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search for products, brands, or categories..."
            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full focus:border-blue-500 focus:outline-none  text-black bg-white"
          />
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
      <div className=" flex justify-center items-center px-[100px]">
        <div className="grid grid-cols-2 gap-2 ">
          {stores &&
            stores.map((store, index) => (
              <button key={index} onClick={() => router.push(`http://localhost:3000/digishop/store/${store.uuid}`)}>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[60px]">
          {
            products && products.map((item: Product, index: number) => (
              <div
                key={index}
                onClick={() =>
                  router.push(`/digishop/product/${String(item.uuid)}`)
                }
              >
                <Card data={item} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
