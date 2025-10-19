'use client'
import { useState } from "react";
import {  Lock,CircleCheck } from "lucide-react";
// import { useSearchParams } from "next/navigation";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const handleResetSubmit = () => {
    // Password reset logic would go here
    if((!testLength || !testCapLetter || !testLowerLetter || !testNumber )||(password !== confirmPassword)){
      alert("Password reset not successful!");
    }else{
      alert("Password reset successful!");
    }
  };
  // const searchParams = useSearchParams();
  // const token = searchParams.get("token");
  const testLength = password.length > 6
  const testCapLetter = (/[A-Z]/g).test(password)
  const testLowerLetter = (/[a-z]/g).test(password)
  const testNumber = (/[0-9]/g).test(password)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-3">
            Reset Password
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Enter your new password below. Make sure it&apos;s strong and
            secure.
          </p>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Password must contain:
              </p>
            <div className={`flex mt-1 ${testCapLetter? 'text-black':'text-gray-300'}`}>
                <CircleCheck size={20}/>
                <div>Contains one lowercase characters</div>
              </div>
              <div className={`flex mt-1 ${testLowerLetter? 'text-black':'text-gray-300'}`}>
                <CircleCheck size={20}/>
                <div>Contains one lowercase characters</div>
              </div>
              <div className={`flex mt-1 ${testNumber? 'text-black':'text-gray-300'}`}>
                <CircleCheck size={20}/>
                <div>Contains a number </div>
              </div>
              <div className={`flex mt-1 ${testLength? 'text-black':'text-gray-300'}`}>
                <CircleCheck size={20}/>
                <div>At least 6 characters</div>
              </div>
              
            </div>

            <button
              onClick={handleResetSubmit}
              disabled={(!testLength || !testCapLetter || !testLowerLetter || !testNumber )||(password !== confirmPassword)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
