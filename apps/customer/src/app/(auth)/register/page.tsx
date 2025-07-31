// pages/register.tsx or app/register/page.tsx
'use client'
import React, { useState } from 'react';
import Button from '../../../components/button';
import InputField from '../../../components/inputField';
import { UserPlus, Home, Building } from 'lucide-react';
import Link from 'next/link';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  homeAddress: {
    recipientName: string;
    phone: string;
    addressLine: string;
    province: string;
    postalCode: string;
  };
  officeAddress: {
    recipientName: string;
    phone: string;
    addressLine: string;
    province: string;
    postalCode: string;
  };
  sameAsHome: boolean;
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    homeAddress: {
      recipientName: '',
      phone: '',
      addressLine: '',
      province: '',
      postalCode: ''
    },
    officeAddress: {
      recipientName: '',
      phone: '',
      addressLine: '',
      province: '',
      postalCode: ''
    },
    sameAsHome: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddressChange = (addressType: 'homeAddress' | 'officeAddress', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [addressType]: {
        ...prev[addressType],
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      sameAsHome: e.target.checked
    }));
  };

    
  //   if(!(formData.firstName && formData.lastName )){
  //     newErrors.firstName= 'Name is required';
  //   }else if (!/^[\u0E00-\u0E7Fa-zA-Z0-9 ]+$/.test(formData.firstName || formData.lastName)) {
  //     newErrors.firstName = 'Please enter a valid name'
  //   }

  //   if (!formData.email) {
  //     newErrors.email = 'Email is required';
  //   } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
  //     newErrors.email = 'Please enter a valid email address';
  //   }
    
  //   if (!formData.password) {
  //     newErrors.password = 'Password is required';
  //   } else if (formData.password.length < 6) {
  //     newErrors.password = 'Password must be at least 6 characters';
  //   }
    
  //   setErrors(newErrors);
  //   console.log(errors)
  //   return errors.firstName
  // };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    console.log('Form submitted:', formData);
    // handleActionSubmit(formData)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Home Address */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Home Address</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Recipient Name"
                name="homeRecipientName"
                value={formData.homeAddress.recipientName}
                onChange={(e) => handleAddressChange('homeAddress', 'recipientName', e.target.value)}
                placeholder="Full name for delivery"
              />
              <InputField
                label="Phone Number"
                type="tel"
                name="homePhone"
                value={formData.homeAddress.phone}
                onChange={(e) => handleAddressChange('homeAddress', 'phone', e.target.value)}
                placeholder="Phone number"
                maxLength={10}
              />
            </div>

            <InputField
              label="Address Line"
              name="homeAddressLine"
              value={formData.homeAddress.addressLine}
              onChange={(e) => handleAddressChange('homeAddress', 'addressLine', e.target.value)}
              placeholder="Street address, apartment, suite, etc."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Province"
                name="homeProvince"
                value={formData.homeAddress.province}
                onChange={(e) => handleAddressChange('homeAddress', 'province', e.target.value)}
                placeholder="Province"
              />
              <InputField
                label="Postal Code"
                name="homePostalCode"
                type='tel'
                value={formData.homeAddress.postalCode}
                onChange={(e) => handleAddressChange('homeAddress', 'postalCode', e.target.value)}
                placeholder="Postal code"
                maxLength={5}
              />
            </div>
          </div>

          {/* Office Address Checkbox */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="sameAsHome"
                checked={formData.sameAsHome}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="sameAsHome" className="text-sm font-medium text-gray-700">
                My office address is the same as my home address
              </label>
            </div>
          </div>

          {/* Office Address (Conditional) */}
          {!formData.sameAsHome && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">Office Address</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Recipient Name"
                  name="officeRecipientName"
                  value={formData.officeAddress.recipientName}
                  onChange={(e) => handleAddressChange('officeAddress', 'recipientName', e.target.value)}
                  placeholder="Full name for delivery"
                  required
                />
                <InputField
                  label="Phone Number"
                  type="tel"
                  name="officePhone"
                  value={formData.officeAddress.phone}
                  onChange={(e) => handleAddressChange('officeAddress', 'phone', e.target.value)}
                  placeholder="Phone number"
                  required
                />
              </div>

              <InputField
                label="Address Line"
                name="officeAddressLine"
                value={formData.officeAddress.addressLine}
                onChange={(e) => handleAddressChange('officeAddress', 'addressLine', e.target.value)}
                placeholder="Street address, apartment, suite, etc."
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Province"
                  name="officeProvince"
                  value={formData.officeAddress.province}
                  onChange={(e) => handleAddressChange('officeAddress', 'province', e.target.value)}
                  placeholder="Province"
                  required
                />
                <InputField
                  label="Postal Code"
                  name="officePostalCode"
                  value={formData.officeAddress.postalCode}
                  onChange={(e) => handleAddressChange('officeAddress', 'postalCode', e.target.value)}
                  placeholder="Postal code"
                  required
                />
              </div>
            </div>
          )}
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