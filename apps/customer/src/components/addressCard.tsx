import { House, Phone, User } from "lucide-react";
import { Address } from "@/types/props/addressProp";
interface AddressCard {
  item: Address;
}
export default function AddressCard({ item }: AddressCard) {
  return (
    <div className={`border ${item.isDefault == true ? "border-amber-600" : "border-black"} rounded-2xl mb-3 p-4`}>
      <div
         className="" 
      >
        <h5 className="font-bold text-black mb-6 ">{item.addressType}</h5>
        <div className="space-y-6">
          {item.isDefault == true && <div>is Default</div>}
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
                {item.addressLine}, {item.province}, {item.postalCode}
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
