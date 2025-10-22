import { House, Phone, User } from "lucide-react";
import { Address } from "@/types/props/addressProp";
import { Pen, Pin , Trash2} from 'lucide-react'
import { EditAddress } from "./editAddress";
import { useState } from "react";
import { Rubik } from "next/font/google";
import { deleteAddress } from "@/utils/requestUtils/requestUserUtils";
const rubik = Rubik({
  subsets: ["latin"],
  weight: "300"
})
interface AddressCardForSetting {
  item: Address;
}
export function AddressCardForSetting({ item }: AddressCardForSetting) {
  const formatAddress = (items: Address): string => {
    return [
      items.address_number,
      items.building,
      items.street,
      items.subStreet,
      items.district,
      items.subdistrict,
      items.province,
      items.postalCode,
      items.country
    ]
      .filter(Boolean)
      .join(' ')
  }
  const [editAddShow,setEditAddShow] = useState(false)
  const handleDelete = async(id: number| undefined) => {
    const delData = (await deleteAddress(id)) as {data: string}
    if(delData.data){
      window.location.reload()
    }
  }
  return (
    <div className={`relative border  text-lg rounded-2xl mb-3 p-4 ${rubik.className}`}>
      <div
         className="" 
      > 
        <div className="flex">
          <h5 className="font-bold text-black mb-6 ">{item.addressType}</h5>
          {item.isDefault == true && 
          <div className="flex">
            <Pin/>
            <div className="mx-3">is Default</div>

          </div>}
        </div>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={18} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="block text-base font-medium text-gray-700 mb-1">
                Recipient Name
              </label>
              <p className="text-gray-800 text-lg">{item.recipientName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <House size={18} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="block text-base font-medium text-gray-700 mb-1">
                Address
              </label>
              <p className="text-gray-800 text-lg">
                {formatAddress(item)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Phone size={18} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="block text-base font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <p className="text-gray-800 text-lg">{item.phone}</p>
            </div>
          </div>
        </div>
      </div>
      <button className="absolute right-15 top-5 hover:bg-gray-300/50 cursor-pointer p-2 rounded-full" onClick={() => setEditAddShow(true)}>
        <Pen />
      </button>
      {
        !item.isDefault && (
        <button className="absolute right-3 top-5 hover:bg-red-300/50 cursor-pointer p-2 rounded-full" onClick={() => handleDelete(item.id)}>
          <Trash2 />
        </button>

        )
      }
      <EditAddress 
      item={item} setEditAddShow={setEditAddShow} editAddShow={editAddShow}      
      />
    </div>
  );
}

interface AddressCardForOrderProps {
  item: Address
  select: Address|undefined
}

export function AddressCardForOrder({ item , select }: AddressCardForOrderProps) {
  const formatAddress = (items: Address): string => {
    return [
      items.address_number,
      items.building,
      items.street,
      items.subStreet,
      items.district,
      items.subdistrict,
      items.province,
      items.postalCode,
      items.country
    ]
      .filter(Boolean)
      .join(' ')
  }
  // const handleDelete = async(id: number| undefined) => {
  //   const delData = (await deleteAddress(id)) as {data: string}
  //   if(delData.data){
  //     window.location.reload()
  //   }
  // }
  return (
    <div className={`relative border text-lg rounded-2xl mb-3 p-4 ${item.id !== select?.id? ' border-gray-400':''}`}>
      <div className={`${item.id !== select?.id? 'text-gray-400':''}`}
      > 
        <div className="flex">
          <h5 className="font-bold mb-6 ">{item.addressType}</h5>
        </div>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={18} className="" />
            </div>
            <div className="flex-1">
              <label className="block font-medium  mb-1">
                Recipient Name
              </label>
              <p className="text-lg font-normal">{item.recipientName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <House size={18} className="text-gray-60" />
            </div>
            <div className="flex-1">
              <label className="block font-medium  mb-1">
                Address
              </label>
              <p className=" text-lg">
                {formatAddress(item)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Phone size={18} className="" />
            </div>
            <div className="flex-1">
              <label className="block font-medium mb-1">
                Phone Number
              </label>
              <p className="text-lg">{item.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
