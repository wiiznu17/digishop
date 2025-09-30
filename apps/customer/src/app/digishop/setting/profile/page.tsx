"use client";
import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Lock,
  Pen
} from "lucide-react";
import { useRouter} from "next/navigation";
import { Profile } from "@/types/props/userProp";
import { logoutUser } from "@/utils/requestUtils/requestLoginUtils";
import { useAuth } from "@/contexts/auth-context";
import {
  createAddress,
  getAddress,
  getUserDetail,
  updateUserName
} from "@/utils/requestUtils/requestUserUtils";
import { Address } from "@/types/props/addressProp";
import { DialogAddress } from "@/components/createAddress";
import {AddressCardForSetting} from "@/components/addressCard";
import Button from "@/components/button";
import InputField from "@/components/inputField";
import { middleware } from "@/middleware";

const UserProfilePage = () => {
  const [currentUser, setCurrentUser] = useState<Profile>();
  const [addressUser, setAddressUser] = useState<Address[]>();
  const [address, setAddress] = useState<Address>({
    recipientName: "",
    phone: "",
    province: "",
    address_number: "",
    building: "",
    subStreet: "",
    street: "",
    subdistrict: "",
    district: "",
    country: "",
    postalCode: "",
    isDefault: false,
    addressType: "HOME",
  });
  const [name, setName] = useState({
   firstName: '',
    lastName: '',
    middleName: ''
  })
  const router = useRouter();
  const { user } = useAuth();
  const [isShowAddress, setIsShowAddress] = useState(false);
  const [isEditName, setIsEditName] = useState(false)
  const handleChangeName = async() => {
    if(!user || !name) return
    const changeData = await updateUserName(user.id , name)
    setIsEditName(false)
    if(changeData.data){
      window.location.reload()
    }
  }
  const handleInputChange = (e) => {
    setName({...name, [e.target.name]: e.target.value })
  }
  const handleOnClickAddress = (): void => {
    setIsShowAddress(true);
  };
  const handleOnCancelAddress = (): void => {
    setIsShowAddress(false);
    setAddress({
      recipientName: "",
      phone: "",
      address_number: "",
      building: "",
      subStreet: "",
      street: "",
      subdistrict: "",
      district: "",
      country: "",
      province: "",
      postalCode: "",
      isDefault: false,
      addressType: "HOME",
    });
  };
  const handleOnConfirmAddress = async (e: React.FormEvent): Promise<void> => {
    const axiosData = { ...address, userId: user?.id };
    console.log("data add", axiosData);
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
  useEffect(() => {
    if(!currentUser)return
    setName({
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            middleName: currentUser.middleName
          })
  },[currentUser])
  const formatName = (firstName: string|undefined , middleName: string|undefined ,lastName: string|undefined) => {
    return [
      firstName,
      middleName,
      lastName
    ]
      .filter(Boolean)
      .join(' ')
  }
  const username = formatName(currentUser?.firstName , currentUser?.middleName, currentUser?.lastName)
  return (
    <div>
      {/* Main Content */}
      <main className="px-3 py-2">
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
                {username}
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
                    <div className="border-b py-2 ">Customer Profile</div>
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User size={18} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          User Name
                        </label>
                        {
                          !isEditName && (
                            <div className="flex">
                              <p className="text-gray-800 text-lg border-b w-1/2">
                                {username}
                              </p>
                              <button className=" hover:bg-gray-300/50 cursor-pointer p-2 rounded-full" onClick={() => setIsEditName(true)}>
                                <Pen />
                              </button>
                            </div>
                          )
                        }
                        {
                          isEditName && (
                            <div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <InputField
                                  label="First Name"
                                  name="firstName"
                                  value={name.firstName}
                                  onChange={handleInputChange}
                                  placeholder="Enter your first name"
                                  type="text"
                                  // error={errors.firstName}
                                />
                                <InputField
                                  label="Middle Name"
                                  name="middleName"
                                  value={name.middleName}
                                  onChange={handleInputChange}
                                  placeholder="Enter your middle name"
                                  type="text"
                                  // error={errors.firstName}
                                />

                                <InputField
                                  label="Last Name"
                                  name="lastName"
                                  value={name.lastName}
                                  onChange={handleInputChange}
                                  placeholder="Enter your last name"
                                  type="text"
                                  // error={errors.lastName}
                                />
                              </div>
                              <div className="flex justify-end items-end">
                                <Button size="sm" onClick={() => setIsEditName(false)}>
                                  cancel
                                </Button>
                                <Button size="sm" onClick={handleChangeName} className="ml-4" color="bg-green-300">
                                  confirm
                                </Button>
                              </div>
                        
                            </div>
                          )
                        }
                      </div>
                    </div>

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
                          reset password
                        </p>
                      </div>
                    </div>
                  </>
                )}
                <div>
                  <div className="border-b py-2 ">Merchant Profile</div>
                  {
                    currentUser?.role === 'CUSTOMER' && (
                      <Button className="mt-3">create merchant profile</Button>
                    )
                  }
                </div>
                  {
                    currentUser?.role === 'MERCHANT' && (
                      <Button className="mt-3">switch to merchant profile</Button>
                    )
                  }
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
                  <AddressCardForSetting item={item} />
                </div>
              ))}
              <Button onClick={handleOnClickAddress} border="border-black">create address</Button>
            </div>
          </div>
        </div>
      </main>
      <div className="flex justify-end mx-3 pb-2">
        <Button onClick={handleLogout} color="bg-red-300">
          Log Out
        </Button>
      </div>
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
