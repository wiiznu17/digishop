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
import { useGoogleLogin } from '@react-oauth/google'
const rubik = Rubik({
  subsets: ['latin'],
  weight: '300'
})

const AuthPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const { login, googleLogin, isLoading } = useAuth()
  const router = useRouter()

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const ok = await googleLogin(tokenResponse.access_token)
      if (ok) router.push('/')
      else {
        alert('Google login failed')
      }
    },
    onError: () => alert('Google login failed')
  })
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              className="w-full transition-all duration-200"
              border="border-gray-300"
              disabled={isLoading}
              onClick={() => handleGoogleLogin()}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google
              </span>
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
