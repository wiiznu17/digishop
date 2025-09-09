"use client";
import { useEffect, useState } from "react";
import { use } from 'react'
import { searchProduct } from "@/utils/requestUtils/requestProduct";
import NotFound from "@/components/notFound";
import {useRouter} from "next/navigation";
import Card from "@/components/productCard";

export default  function SearchResult({
  searchParams
}:{
  searchParams: Promise<{ [key: string]: string}>
}) {
  const [result, setResult] = useState()
  const { query } = use(searchParams)
  console.log(query)
  const router = useRouter()
  useEffect(() => {
  const fetchProduct = async () => {
    const res = await searchProduct(query);
    setResult(res.data);
    console.log('res',res)
  };
  fetchProduct();
}, [query]);
  console.log('result',result)
  return !result ? (
    <NotFound props={query} />
  ) : (
    <div className=" flex justify-center items-center p-[100px]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[60px]">
        {/* <div>
          {result}
        </div> */}
        {result.map((item, index: number) => (
          <div
            key={index}
            onClick={() => router.push(`/digishop/product/${String(item.uuid)}`)} 
          >
            <Card data={item} />
          </div>
        ))}
      </div>
    </div>
  );
};


