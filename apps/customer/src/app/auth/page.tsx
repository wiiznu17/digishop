'use client'
// pages/auth.tsx or app/auth/page.tsx
import React, { useState } from 'react'
import Button from '../../components/button'
import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import InputField from '@/components/inputField'
import { useAuth } from '@/contexts/auth-context'
import { Rubik } from 'next/font/google'
import icon from '../shopping.png'
import Image from 'next/image'
const rubik = Rubik({
  subsets: ['latin'],
  weight: '300'
})

const AuthPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const { login, isLoading } = useAuth()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loginFail, setLoginFail] = useState<boolean>(false)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  const router = useRouter()
  const handleSubmit = async () => {
    if (!validateForm()) return
    const success = await login(formData.email, formData.password)
    if (success) {
      router.push('/')
    } else {
      setLoginFail(true)
    }
  }
  return (
    <div
      className={`grid grid-cols-2 min-h-screen bg-white ${rubik.className}`}
    >
      <div className="flex justify-center items-center">
        <Link href={'/'}>
          <Image src={icon} width={600} height={600} alt="Shpping" />
        </Link>
      </div>
      <div className="flex justify-center items-center">
        <div className="w-lg">
          <div className=" bg-white px-4 relative">
            {loginFail && (
              <p className="absolute top-[-40] text-red-500 bg-red-500/10 px-4 text-lg font-bold">
                Incorrect email or password
              </p>
            )}
            <div className="relative space-y-6">
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
                className="relative"
              />
            </div>
            <button
              className="flex justify-end items-end mb-6 mt-2  cursor-pointer "
              onClick={() => router.push('/auth/forgot-password')}
            >
              <div className=" text-base text-black font-normal">
                forgot password ?
              </div>
            </button>

            {/* Submit Button */}
            <Button
              size="lg"
              className="w-full group"
              disabled={isLoading}
              color="bg-blue-600/80 text-white"
              onClick={handleSubmit}
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
          </div>
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
          <Link href="/auth/register">
            <div className="px-4">
              <Button size="lg" className="w-full" border="border-blue-600/80">
                Create Account
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthPage
