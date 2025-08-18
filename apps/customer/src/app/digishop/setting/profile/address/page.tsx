"use client";
import React, { useEffect, useState } from "react";
import Button from "@/components/button";
import InputField from "@/components/inputField";
import { Home } from "lucide-react";
import { Address } from "@/types/props/addressProp";
import { useAuth } from "@/contexts/auth-context";
import {
  createAddress,
  getAddress,
} from "@/utils/requestUtils/requestUserUtils";
import { redirect, RedirectType } from "next/navigation";
export default function FormAddress() {
  const [address, setAddresses] = useState<Address>({
    recipientName: "",
    phone: "",
    addressLine: "",
    province: "",
    postalCode: "",
    isDefault: false,
    addressType: "HOME",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [findAddres, setFindAddess] = useState();
  const { user } = useAuth();
  useEffect(() => {
    const fetchData = async () => {
      const resAddress = await getAddress(user?.id);
      if (resAddress.data.length < 1) {
        setAddresses({ ...address, isDefault: true });
      }
    };
    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    // e.preventDefault();
    //   const axiosData = {...address , userId: user?.id}
    //   const res =await createAddress(axiosData)
    //   if(res.data){
    //     redirect('/digishop/setting/profile', RedirectType.replace)
    //   }
  };
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAddresses({
      ...address,
      [e.target.name]: e.target.value,
    });
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddresses({
      ...address,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Home Address
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Recipient Name"
              name="recipientName"
              value={address.recipientName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              type="text"
            />
            <InputField
              label="Phone Number"
              type="num"
              name="phone"
              value={address.phone}
              onChange={handleInputChange}
              placeholder="Phone number"
              maxLength={10}
              minLength={10}
            />
          </div>

          <InputField
            label="Address Line"
            name="addressLine"
            value={address.addressLine}
            onChange={handleInputChange}
            placeholder="Street address, apartment, suite, etc."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Province"
              name="province"
              value={address.province}
              onChange={handleInputChange}
              placeholder="Province"
              type="text"
            />
            <InputField
              label="Postal Code"
              name="postalCode"
              type="num"
              value={address.postalCode}
              onChange={handleInputChange}
              placeholder="Postal code"
              maxLength={5}
              minLength={5}
            />
          </div>
          <div>
            <h1>select address type</h1>
            <select
              name="addressType"
              value={address.addressType}
              onChange={handleChange}
            >
              <option id="1" value="HOME" className="text-4xl">
                HOME
              </option>
              <option id="2" value="OFFICE" className="text-4xl">
                OFFICE
              </option>
            </select>
          </div>
        </div>
        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full group"
          disabled={isLoading}
        >
          Create Address
        </Button>
      </form>
    </>
  );
}
