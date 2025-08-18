'use client'
import { Product } from "@/types/props/productProp"
import Image from 'next/image'
import pic from './../app/bg.png'
import pic1 from './../app/digishopLogo.jpg'
interface CardProps {
    data: Product
}
const Card = ({
    data    
    }: CardProps ) => (
  
  <button className=" max-w-md inline-block text-black bg-white hover:shadow-2xs hover:scale-120 cursor-pointer border">
    <Image src={pic1} alt="first pic"  />
    <div className="p-5 text-start ">
      <h3 className="text-[27px] font-bold mb-2">{data.name}</h3>
      <div className="grid grid-cols-2 gap-4 text-[21px] ">
      <p >{ data.price}</p>
      <p>{ data.store.storeName}</p>
      </div>
    </div>  
  </button>
)
export default Card