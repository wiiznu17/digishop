'use client'
import { use, useState } from 'react'
import { Lock, CircleCheck, CheckCircle, ArrowLeft } from 'lucide-react'
import { resetPassword } from '@/utils/requestUtils/requestAuthUtils'
import InputField from '@/components/inputField'
import { Rubik } from 'next/font/google'
import Button from '@/components/button'
import { useRouter } from 'next/navigation'
const rubik = Rubik({
  subsets: ['latin'],
  weight: '300'
})

export default function ResetPassword({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string }>
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [page, setPage] = useState('reset')
  const router = useRouter()
  const handleResetSubmit = async () => {
    if (
      !testLength ||
      !testCapLetter ||
      !testLowerLetter ||
      !testNumber ||
      password !== confirmPassword
    ) {
    } else {
      const res = (await resetPassword(password, token)) as { data: boolean }
      if (res.data) {
        setPage('success')
      } else {
        alert('reset password failed')
      }
    }
  }
  const { token } = use(searchParams)
  const testLength = password.length > 6
  const testCapLetter = /[A-Z]/g.test(password)
  const testLowerLetter = /[a-z]/g.test(password)
  const testNumber = /[0-9]/g.test(password)
  if (page === 'reset') {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4 ${rubik.className}`}
      >
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
                <div className="relative">
                  <InputField
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    label="New Password"
                    name="password"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <InputField
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    label="Confirm Password"
                    name="confirmPassword"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-base font-medium text-gray-700 mb-2">
                  Password must contain:
                </p>
                <div
                  className={`flex mt-1 ${testCapLetter ? 'text-black' : 'text-gray-300'}`}
                >
                  <CircleCheck size={20} />
                  <div>Contains one lowercase characters</div>
                </div>
                <div
                  className={`flex mt-1 ${testLowerLetter ? 'text-black' : 'text-gray-300'}`}
                >
                  <CircleCheck size={20} />
                  <div>Contains one lowercase characters</div>
                </div>
                <div
                  className={`flex mt-1 ${testNumber ? 'text-black' : 'text-gray-300'}`}
                >
                  <CircleCheck size={20} />
                  <div>Contains a number </div>
                </div>
                <div
                  className={`flex mt-1 ${testLength ? 'text-black' : 'text-gray-300'}`}
                >
                  <CircleCheck size={20} />
                  <div>At least 6 characters</div>
                </div>
              </div>

              <Button
                onClick={handleResetSubmit}
                disabled={
                  !testLength ||
                  !testCapLetter ||
                  !testLowerLetter ||
                  !testNumber ||
                  password !== confirmPassword
                }
                className={` ${!testLength || !testCapLetter || !testLowerLetter || !testNumber || password !== confirmPassword ? 'bg-gray-500' : 'bg-blue-600'} w-full  text-white py-3 rounded-lg font-medium  transition`}
              >
                Reset Password
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }
  if (page === 'success') {
    return (
      <div className="min-h-screen bg-green-50  flex items-center justify-center p-5">
        <div className="max-w-md w-full ">
          <div className="bg-white rounded-2xl shadow-2xl p-5 text-center">
            {/* Success Animation */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-100 rounded-full  opacity-75"></div>
              <div className="relative bg-green-500 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Password reset successfully
            </h1>
            <button
              onClick={() => router.replace('/auth')}
              className="w-full mt-3 flex items-center text-xl justify-start text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2 cursor-pointer" />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    )
  }
}
