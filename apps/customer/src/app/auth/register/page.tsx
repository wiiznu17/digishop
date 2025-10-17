// pages/register.tsx or app/register/page.tsx
"use client";
import React, { useState } from "react";
import Button from "../../../components/button";
import InputField from "../../../components/inputField";
import { UserPlus, Home, Building, CircleCheck, Plus, Minus } from "lucide-react";
import { createUser } from "@/utils/requestUtils/requestAuthUtils";
import { FormRegister } from "@/types/props/userProp";
import { useRouter } from "next/navigation";

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<FormRegister>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
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
    addressType: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [addAddress, setAddAddress] = useState<boolean>(false);
  const handleCancelAddAdress = () => {
    setAddAddress(false)
    setFormData({...formData, recipientName: "",
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
    addressType: "",})
  }
  const handleSubmit = async (e: React.FormEvent) => {
    console.log(formData)
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await createUser(formData);
      console.log(res)
      if (res.data) {
        router.push("/auth");
      }
    } catch (err) {
      console.log("error", err);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!testLength || !testCapLetter || !testLowerLetter || !testNumber ) {
      newErrors.password = "Password policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true = valid form
  };

  const router = useRouter();
  const testLength = formData.password.length >= 6
  const testCapLetter = (/[A-Z]/g).test(formData.password)
  const testLowerLetter = (/[a-z]/g).test(formData.password)
  const testNumber = (/[0-9]/g).test(formData.password)
  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-2xl mx-auto ">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
        </div>
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-8 border border-black"
        >
          {/* Personal Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                // placeholder="Enter your first name"
                type="text"
                error={errors.firstName}
                required={true}
              />
              <InputField
                label="Middle Name"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                // placeholder="Enter your middle name"
                type="text"
                error={errors.middleName}
              />

              <InputField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                // placeholder="Enter your last name"
                type="text"
                error={errors.lastName}
                required={true}
              />
            </div>
            <InputField
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              // placeholder="Enter your email address"
              error={errors.email}
              required={true}
            />
            <div>
              <InputField
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                // placeholder="Create a strong password"
                // error={errors.password}
                minLength={6}
                required={true}
              />
              {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4 mt-2">
              <p className="test-xs font-medium text-gray-700 mb-2">
                Password must contain:
              </p>
            <div className={`flex  items-center mt-1 ${testCapLetter? 'text-black':'text-gray-300'}`}>
                <CircleCheck size={20}/>
                <div className="text-[16px] mx-1">Contains one Uppercase characters</div>
              </div>
              <div className={`flex items-center mt-1 ${testLowerLetter? 'text-black':'text-gray-300'}`}>
                <CircleCheck size={20}/>
                <div className="text-[16px] mx-1">Contains one lowercase characters</div>
              </div>
              <div className={`flex items-center mt-1 ${testNumber? 'text-black':'text-gray-300'}`}>
                <CircleCheck size={20}/>
                <div className="text-[16px] mx-1">Contains a number </div>
              </div>
              <div className={`flex items-center mt-1 ${testLength? 'text-black':'text-gray-300'}`}>
                <CircleCheck size={20}/>
                <div className="text-[16px] mx-1">At least 6 characters</div>
              </div>
              
            </div>
              
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
            </div>
              
              <h2 className="text-xl font-semibold text-gray-900 border-b mb-4">
              Address Information (option)
              </h2>

              <button onClick={() => setAddAddress(true)} hidden={addAddress} className={`flex justify-center items-center w-full border border-black h-11 rounded-lg `}>
                <Plus color='black'/>
              </button>
            {addAddress && <div className="relative py-5 border border-black rounded-lg">
              <button onClick={handleCancelAddAdress}   className={`absolute top-5 right-5 ${!addAddress?'opacity-0':''}`}>
                <Plus  className="rotate-45" color='red'/>
              </button>
            <div className="px-4 mt-5">
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <InputField
                  label="Recipient Name"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  type="text"
                  required={true}
                />
                <InputField
                  label="Phone Number"
                  type="num"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                  maxLength={10}
                  minLength={10}
                  required={true}

                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Address Number"
                  name="address_number"
                  value={formData.address_number}
                  onChange={handleInputChange}
                  placeholder="address number"
                  required
                />
                <InputField
                  label="Building"
                  name="building"
                  value={formData.building}
                  onChange={handleInputChange}
                  placeholder="building"
                />
                <InputField
                  label="Street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="street"
                  required={true}

                />
                <InputField
                  label="Sub Street"
                  name="subStreet"
                  value={formData.subStreet}
                  onChange={handleInputChange}
                  placeholder="subStreet"
                />
                <InputField
                  label="District"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="district"
                  required={true}
                />
                <InputField
                  label="Sub district"
                  name="subdistrict"
                  value={formData.subdistrict}
                  onChange={handleInputChange}
                  placeholder="sub district"
                />
                <InputField
                  label="Province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  placeholder="Province"
                  type="text"
                  required={true}
                />
                <InputField
                  label="Postal Code"
                  name="postalCode"
                  type="num"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="Postal code"
                  maxLength={5}
                  minLength={5}
                  required={true}

                />
                <InputField
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="country"
                  required={true}
                />
              </div>
              <div className="text-black">
                <h1>select address type</h1>
                <select
                  name="addressType"
                  value={formData.addressType}
                  onChange={handleChange}
                  className="border border-gray-500 p-3 mt-2 rounded-2xl "
                >
                  <option id="1" value="HOME" className="text-xl border border-gray-300">
                    HOME
                  </option>
                  <option id="2" value="OFFICE" className="text-xl">
                    OFFICE
                  </option>
                </select>
              </div>
            </div>
            </div>
            }
          </div>

          {/* Submit Button */}
          <Button
            size="lg"
            className="w-full group"
            disabled={isLoading}
          >
            Create Account
            {/* <Link href='/register-merchant'></Link> */}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
