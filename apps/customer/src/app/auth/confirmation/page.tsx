"use client";

import { verifiedEmail } from "@/utils/requestUtils/requestAuthUtils";
import { useRouter } from "next/navigation";
import {  use, useState } from "react";
import { Mail, CheckCircle, ArrowRight} from "lucide-react";

export  default function ConfirmMail({ searchParams }: { searchParams: Promise<{ [key: string]: string }>}) {

    const { token } = use(searchParams);
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter()
    const handleVerified = async() => {
      // Password reset logic would go here
      if(!token) return
      const res = (await verifiedEmail(token)) as {data: boolean}
      if(res.data){
       setIsVerified(true)
      }else{
        alert('verified failed!')
      }
    };
  
  if (isVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            {/* Success Animation */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-75"></div>
              <div className="relative bg-green-500 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Email Verified!
            </h1>
            
            <p className="text-gray-600 mb-8">
              Your email has been successfully verified. You can now access all features.
            </p>

            <button onClick={() => router.replace('/auth')} className="w-full bg-blue-600/80 text-white py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
              go to Login
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Email Icon */}
          <div className="relative inline-block mb-6">
            <div className="relative bg-blue-500 rounded-full p-4">
              <Mail className="w-16 h-16 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Verify Your Email
          </h1>

          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-700">
              Click the button below to verify your email address and activate your account.
            </p>
          </div>

          {/* Verify Button */}
          <button 
            onClick={handleVerified}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:bg-blue-400 disabled:cursor-not-allowed disabled:transform-none mb-6"
          >
            <>
              <CheckCircle className="w-5 h-5" />
              Click to verify Email
            </>
          </button>
        </div>
      </div>
    </div>
    )
}
