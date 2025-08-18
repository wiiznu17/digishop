'use client'
// pages/auth.tsx or app/auth/page.tsx
import React, { useEffect, useState } from 'react';
import Button from '../components/button';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { FormRegister } from '@/types/props/userProp';
 
const AuthPage: React.FC = () => {
  const handleLogin = () => {
    console.log('Login clicked');
    // Add login logic here
  };

  const handleRegister = () => {
    console.log('Register clicked');
    // Add register logic here
  };
 

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('./bg.png')]">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white rounded-2xl border p-6">
          {/* Header */}
          <div className="text-center">
              <p className="text-gray-600 text-sm pb-3">
                Login to start shopping
              </p>
          </div>

          <div>
            <Link href='/login'>
              <Button
                size="lg"
                onClick={handleRegister}
                className="w-full"
                color='blue-400'
              >
                <span className="flex items-center justify-center ">
                  Login
                </span>
              </Button>
            </Link>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border border-gray-200"></div>
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
                onClick={handleRegister}
                className="w-full"
              >
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;