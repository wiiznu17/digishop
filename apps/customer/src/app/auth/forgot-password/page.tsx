'use client'
import { useEffect, useState } from "react";
import { Mail, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendResetPassword } from "@/utils/requestUtils/requestAuthUtils";
export default function ForgotPasswordPage() {
  const [page, setPage] = useState("email"); // 'email', 'success', 'reset'
  const [email, setEmail] = useState("");
  const router = useRouter()
  useEffect(() => {
  },[page])
  const handleEmailSubmit = async(e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ไม่ได้ verified
    console.log('email in submit',email)
    if(email !== ''){
      const res = (await sendResetPassword(email)) as {data: string}
      if(res.data){
        setPage("success");
      }
    }
  };

  if (page === "email") {
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
              Forgot Password?
            </h1>
            <p className="text-center text-gray-600 mb-8">
              No worries! Enter your email address and we&apos;ll send you a link to
              reset your password.
            </p>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full pl-11 pr-4 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <button
                // onClick={handleEmailSubmit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Send Reset Link
              </button>
            </form>

            {/* Back to Login */}
            <button
              onClick={() => router.replace('/auth')}
              className="w-full mt-6 flex items-center justify-center text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
          </div>

        </div>
      </div>
    );
  }

  if (page === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Check Your Email
            </h1>
            <p className="text-gray-600 mb-2">
              We&apos;ve sent a password reset link to
            </p>
            <p className="font-medium text-gray-900 my-8">{email}</p>
            <p className="text-sm text-gray-500 mb-8">
              Click the link in the email to reset your password. The link will
              expire in 15 minutes.
            </p>

            

            <button
              onClick={() => router.replace('/auth')}
              className="w-full flex items-center justify-center text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
}
