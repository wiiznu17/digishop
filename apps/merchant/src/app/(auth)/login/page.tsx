"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  // ⬇️ ใช้ URL หลักจาก ENV
  const DIGISHOP_URL =
    process.env.NEXT_PUBLIC_DIGISHOP_URL ?? "https://digishop.localhost"

  const handleChange = (field: "email" | "password", value: string) =>
    setFormData((p) => ({ ...p, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingLocal(true)
    const ok = await login(formData.email, formData.password)
    if (ok) router.push("/orders")
    else {
      setIsLoadingLocal(false)
      alert("Invalid credentials")
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* LEFT: Illustration / Logo */}
      <div className="relative flex items-center justify-center p-8 bg-white">
        <Image
          src="/Login-amico.svg"
          alt="DigiShop"
          width={420}
          height={420}
          priority
          className="drop-shadow-sm"
        />
      </div>

      {/* RIGHT: Pastel purple-pink gradient area */}
      <div className="relative flex items-center justify-center bg-gradient-to-br from-fuchsia-100 via-rose-100 to-violet-100">
        {/* soft rings */}
        {/* <div className="pointer-events-none absolute right-[-6rem] bottom-[-6rem] h-72 w-72 rounded-full border-2 border-fuchsia-300/40" />
        <div className="pointer-events-none absolute right-[-10rem] bottom-[-10rem] h-96 w-96 rounded-full border-2 border-violet-300/30" /> */}

        <div className="w-full max-w-md px-6 py-10">
          <Card className="border border-fuchsia-200/50 bg-white/80 backdrop-blur-md shadow-xl">
            <CardHeader className="pt-6">
              <CardTitle className="text-2xl font-semibold text-violet-700">
                Login
              </CardTitle>
              <CardDescription className="text-violet-600/80">
                Sign in to DigiShop Merchant Portal
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-violet-800">
                    Email Address
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input
                      id="email"
                      type="email"
                      placeholder="digo@thailand.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      required
                      className="pl-9 focus-visible:ring-fuchsia-400"
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password + show/hide */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-violet-800">
                    Password
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange("password", e.target.value)}
                      required
                      className="pl-9 pr-10 focus-visible:ring-fuchsia-400"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-violet-500 hover:text-violet-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Gradient primary button */}
                <Button
                  type="submit"
                  disabled={isLoading || isLoadingLocal}
                  className="w-full font-medium bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white shadow-md"
                >
                  {isLoading || isLoadingLocal ? "Signing in..." : "Login"}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    href={`${DIGISHOP_URL}`}
                    className="text-violet-700/80 hover:underline"
                  >
                    ← Back to DigiShop
                  </Link>
                  {/* ⬇️ เปลี่ยนปลายทางเป็น DIGISHOP_URL + /auth/forgot-password */}
                  <Link
                    href={`${DIGISHOP_URL}/auth/forgot-password`}
                    className="text-fuchsia-600 hover:underline"
                  >
                    Forgot Password
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-violet-700/80">
            Don’t have an account?{" "}
            {/* ⬇️ เปลี่ยนปลายทางเป็น DIGISHOP_URL + /auth/register */}
            <Link
              href={`${DIGISHOP_URL}/auth/register`}
              className="font-medium text-fuchsia-700 hover:underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
