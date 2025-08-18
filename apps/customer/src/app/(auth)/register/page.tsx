// pages/register.tsx or app/register/page.tsx
'use client'
import React, { useState } from 'react';
import Button from '../../../components/button';
import InputField from '../../../components/inputField';
import { UserPlus, Home, Building } from 'lucide-react';
import { createUser } from '@/utils/requestUtils/requestAuthUtils';
import { FormRegister } from '@/types/props/userProp';
import { useRouter} from 'next/navigation';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<FormRegister>({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    recipientName: '',
    phone: '',
    addressLine: '',
    province: '',
    postalCode: '',
    isDefault: false,
    addressType: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const res = await createUser(formData)
      if(res.data){
        router.push('/login')
      }
      // if(res.error){
      //   alert('email is already use')
      // }
      // console.log('data',res.data)
      // console.log('error',res.error)

    }catch (err){
      console.log('error', err)
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
      [e.target.name]: e.target.value
    });
  };

  const validateForm = (): boolean => {
  const newErrors: {[key: string]: string} = {};
  
  if (!formData.firstName) {
    newErrors.firstName = 'First name is required';
  } 
  if (!formData.lastName) {
    newErrors.lastName = 'Last name is required';
  } 


  if (!formData.email) {
    newErrors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = 'Please enter a valid email';
  }

  if (!formData.password) {
    newErrors.password = 'Password is required';
  } else if (formData.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0; // true = valid form
  };

  const router = useRouter();
  return (  
    <div className="min-h-screen bg-gradient-to-br bg-[#C2D1F4] to-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us and start your shopping journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* Personal Information */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InputField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Enter your first name"
                type='text'
                error={errors.firstName}
              />
              <InputField
                label="Middle Name"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                placeholder="Enter your middle name"
                type='text'
                error={errors.firstName}
              />

              <InputField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Enter your last name"
                type='text'
                error={errors.lastName}
              />
            </div>

            <InputField
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email address"
              error={errors.email}
            />
            <InputField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a strong password"
            error={errors.password}
            minLength={6}
            />
            {/* <InputField
            label="Phone"
            type="num"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="Enter your phone number"
            error={errors.number}
            maxLength={10}
            minLength={10}
            /> */}
          </div>
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
              value={formData.recipientName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
              type="text"
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
            />
          </div>

          <InputField
            label="Address Line"
            name="addressLine"
            value={formData.addressLine}
            onChange={handleInputChange}
            placeholder="Street address, apartment, suite, etc."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Province"
              name="province"
              value={formData.province}
              onChange={handleInputChange}
              placeholder="Province"
              type="text"
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
            />
          </div>
          <div>
            <h1>select address type</h1>
            <select
              name="addressType"
              value={formData.addressType}
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
          >Create Account
            {/* <Link href='/register-merchant'></Link> */}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;