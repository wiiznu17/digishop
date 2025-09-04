'use client'
// pages/auth.tsx or app/auth/page.tsx
import React, { useEffect, useState } from 'react';
import Button from '../components/button';
import { ShoppingBag, ArrowRight, LogIn } from 'lucide-react';
import Link from 'next/link';
import { FormRegister } from '@/types/props/userProp';
import { useRouter } from 'next/navigation';
import InputField from '@/components/inputField';
import { useAuth } from '@/contexts/auth-context';
 
const AuthPage: React.FC = () => {
 
    const [formData, setFormData] = useState({
      email: '',
      password: ''
    });
    const {login, isLoading, user} = useAuth()
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    console.log(login)
    console.log(isLoading)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value} = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
      console.log('success',success)
      if (success) {
        router.push("/digishop")
      } else {
        
        try {
          const success = await login(formData.email, formData.password)
          if(success){
            console.log('user in login page',user)
            router.replace("/digishop")
          }
        } catch (error) {
          console.log('error',error)
        }
      };
    }
  return (
    <div className='grid grid-cols-2 min-h-screen bg-white'>
      <div className="flex justify-center items-center text-4xl ">Icon</div>
      <div className='flex justify-center items-center'>
          <div>
          <form onSubmit={handleSubmit} className="bg-white  p-8 space-y-6 ">
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
            type="submit"
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
        <div className="relative">
               <div className="absolute inset-0 flex items-center">
                 <div className="w-full border border-black"></div>
               </div>
               <div className="relative flex justify-center text-sm">
                 <span className="px-1 bg-white text-black p-4 ">
                   Don&apos;t have an account?
                 </span>
               </div>
             </div>
          <Link href='/register'>
              <Button
                size="lg"
                className="w-full"
              >
                Create Account
              </Button>
            </Link>
      </div>
      </div>
    </div>
  );
};

export default AuthPage;