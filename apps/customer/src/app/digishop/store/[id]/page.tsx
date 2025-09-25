"use client";
import { CardStore } from "@/components/productCard";
import { Product, StoreProduct } from "@/types/props/productProp";
import { getStoreProduct } from "@/utils/requestUtils/requestProduct";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react"

export default function StorePage() {
  const { id } = useParams();
  const [products, setProducts] = useState<StoreProduct>();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showProduct, setShowProduct] = useState<Product[]>();
    const handleSearch = (query = searchQuery) => {
      if (!query.trim()) return;
      console.log(query)
      if(!products) return
      const filterProduct = products.products.filter((product => product.name.toLowerCase().includes(query.toLowerCase())))
      setShowProduct(filterProduct)
    };
    const clearSearch = () => {
      setSearchQuery("");
      setShowProduct(products?.products)
    };
  useEffect(() => {
    const fetchData = async () => {
      console.log("id", id);
      const data = await getStoreProduct(String(id));
      setProducts(data.data);
    };
    fetchData();
  }, [id]);
  useEffect(() => {
    if(!products) return
    setShowProduct(products.products)
  },[products])
  console.log(products);
  if (!products) return;

  return (
    <div className="flex justify-center items-center pt-2">
      <div className=" w-5xl ">
      <div>
        <div className="flex p-6 rounded-2xl bg-gray-200 border-b ">
          <div className="h-[100px] w-[100px] rounded-[50px] bg-amber-800 "></div>
          <div className="px-4">
            <h1 className="text-6xl font-extrabold">{products.storeName}</h1>
            <h6 className="mt-4">{products.description}</h6>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex justify-center my-2">
          <div className="relative min-w-full ">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                placeholder= {`Find products in ${products.storeName} ...`}
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
        <div className="">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px] m-4">
          {showProduct &&
            showProduct.map((item: Product, index: number) => (
              <div
                key={index}
                onClick={() =>
                  router.push(`/digishop/product/${String(item.uuid)}`)
                }
              >
                <CardStore data={item} />
              </div>
            ))}
        </div>
        </div>
      </div>
    </div>
    </div>
  );
}
