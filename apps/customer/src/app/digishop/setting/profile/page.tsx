"use client";
import React, { useEffect, useState } from "react";
import {
  User,
  Phone,
  Mail,
  Lock,
  Edit3,
  UserPlus,
  Key,
  Save,
  X,
  Eye,
  EyeOff,
  House,
} from "lucide-react";
import { useRouter, redirect, RedirectType } from "next/navigation";
import { Profile } from "@/types/props/userProp";
import { logoutUser } from "@/utils/requestUtils/requestLoginUtils";
import { useAuth } from "@/contexts/auth-context";
import {
  createAddress,
  getAddress,
  getUserDetail,
} from "@/utils/requestUtils/requestUserUtils";
import { Address } from "@/types/props/addressProp";
import Link from "next/link";
import { DialogAddress } from "@/components/createAddress";
import { Button } from "@headlessui/react";
import AddressCard from "@/components/addressCard";

const UserProfilePage = () => {
  const [currentUser, setCurrentUser] = useState<Profile>();
  const [addressUser, setAddressUser] = useState<Address[]>();
  const [address, setAddress] = useState<Address>({
    recipientName: "",
    phone: "",
    addressLine: "",
    province: "",
    postalCode: "",
    isDefault: false,
    addressType: "HOME",
  });
  const router = useRouter();
  const { user } = useAuth();
  const [isShowAddress, setIsShowAddress] = useState(false);  
  const handleOnClickAddress =  (): void => {
    setIsShowAddress(true);
  };
  const handleOnCancelAddress = (): void => {
    setIsShowAddress(false);
    setAddress({
    recipientName: "",
    phone: "",
    addressLine: "",
    province: "",
    postalCode: "",
    isDefault: false,
    addressType: "HOME",
  })
  };
  const handleOnConfirmAddress = async (e: React.FormEvent): Promise<void> => {
    const axiosData = { ...address, userId: user?.id };
    console.log('data add',axiosData)
    const res = await createAddress(axiosData);
    if (res.data) {      
      setIsShowAddress(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/");
  };
  useEffect(() => {
    const fetchData = async () => {
      const resUser = await getUserDetail(user?.id);
      const resAddress = await getAddress(user?.id);
      setCurrentUser(resUser.data);
      setAddressUser(resAddress.data);
    };
    fetchData();
  }, [user, isShowAddress]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="px-6 py-8">
        <button onClick={handleLogout} className="bg-red-300 m-3">
          Log Out
        </button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Profile Header */}
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center justify-center space-x-6 mb-5">
                <div className="w-50 h-50 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={100} className="text-gray-500" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 text-center">
                  {currentUser?.firstName} {currentUser?.middleName}{" "}
                  {currentUser?.lastName}{" "}
                </h2>
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-evenly">
              <div className="px-8 py-6">
                <h3 className="text-lg font-medium text-gray-800 mb-6 text-center">
                  Profile Information
                </h3>

                <div className="space-y-6">
                  {currentUser && (
                    <>
                      {/* <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Phone size={18} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number
                        </label>
                        <p className="text-gray-800 text-lg">
                          {currentUser.phone}
                        </p>
                      </div>
                    </div>
                     */}
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Mail size={18} className="text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <p className="text-gray-800 text-lg">
                            {currentUser.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Lock size={18} className="text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                          </label>
                          <p className="text-gray-800 text-lg">
                            {currentUser.password}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="px-8 py-6">
                <h3 className="text-lg font-medium text-gray-800 mb-6 text-center">
                  Address Information
                </h3>
                {addressUser?.map((item: Address, index: number) => (
                  <div
                    key={index}
                    // onClick={() => }
                  >
                    <AddressCard item={item}/>
                  </div>
                ))}
                <Button
                onClick={handleOnClickAddress}
                  className="m-4 bg-amber-300 border-4  text-4xl hover:bg-amber-700"
                >
                  create address
                </Button>
              </div>
            </div>
          </div> 
      </main>
        <DialogAddress 
        isShowAddress={isShowAddress}
        setIsShowAddress={setIsShowAddress}
        handleOnCancel={handleOnCancelAddress}
        handleOnConfirm={handleOnConfirmAddress}
        address={address}
        setAddress={setAddress}
        />
    </div>
  );
};

export default UserProfilePage;
