'use client'
import { Product, ProductItem } from "@/types/props/productProp"
import Image from 'next/image'
import pic1 from './../app/digishopLogo.jpg'
interface CardProps {
    data: Product
}
const minPrice = (data: [ProductItem]) => {
  const price = data.map(item => item.priceMinor )
  console.log(price)
  const minPrice = Math.min(...price)
  return (minPrice/100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
const Card = ({
    data    
    }: CardProps ) => (
  <button className=" max-w-md inline-block text-black bg-white hover:shadow-2xs hover:scale-120 cursor-pointer border">
    <Image src={pic1} alt="first pic"  />
    <div className="p-5 text-start ">
      <h3 className="text-[27px] mb-2">{data.name}</h3>
      <div className="flex justify-between gap-4 text-[21px] ">
      <p className="text-[18px]">{ data.store.storeName}</p>
      <p className="text-4xl font-bold">฿ { minPrice(data.items)}</p>
      </div>
    </div>  
  </button>
)
export default Card