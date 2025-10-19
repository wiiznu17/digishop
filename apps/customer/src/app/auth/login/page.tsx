// pages/login.tsx or app/login/page.tsx
'use client'
import React, { useState } from 'react';
import Button from '@/components/button';
import InputField from '@/components/inputField';
import { LogIn, ShoppingBag } from 'lucide-react';
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const {login, isLoading} = useAuth()
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value} = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    // if (errors[name]) {
    //   setErrors(prev => ({
    //     ...prev,
    //     [name]: ''
    //   }));
    // }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } 
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } 
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const router = useRouter()
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    const success = await login(formData.email, formData.password)
    if (success) {
      router.push("/")
    } else {
      
      try {
        const success = await login(formData.email, formData.password)
        if(success){
          router.replace("/")
        }
      } catch (error) {
        console.log('error',error)
      }
    };
  }
  return (
    <div className="min-h-screen bg-gradient-to-br bg-[#add8e6] to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue shopping</p>
        </div>
        <div></div>
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Email Field */}
          <InputField
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email address"
            required
            error={errors.email}
          />

          {/* Password Field */}
          <InputField
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter your password"
            required
            error={errors.password}
          />
          {/* Submit Button */}
          <Button
            size="lg"
            className="w-full group"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </span>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};