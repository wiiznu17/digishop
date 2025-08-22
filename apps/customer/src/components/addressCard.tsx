import { House, Phone, User } from "lucide-react";
import { Address } from "@/types/props/addressProp";
interface AddressCard {
  item: Address;
}
export default function AddressCard({ item }: AddressCard) {
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
  return (
    <div className={`border ${item.isDefault == true ? "border-amber-600" : "border-black"} rounded-2xl mb-3 p-4 w-fit`}>
      <div
         className="" 
      > 
        <div className="flex">
          <h5 className="font-bold text-black mb-6 ">{item.addressType}</h5>
          {item.isDefault == true && <div className="mx-3">is Default</div>}
        </div>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={18} className="text-gray-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <p className="text-gray-800 text-lg">{item.phone}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
