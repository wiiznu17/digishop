"use client"

import { useState, useEffect } from "react"
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
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Particle Background Component
const ParticleBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 dark:from-slate-900 dark:via-purple-950 dark:to-slate-950"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-pulse"
            style={{
              width: Math.random() * 6 + 2 + "px",
              height: Math.random() * 6 + 2 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animationDelay: Math.random() * 3 + "s",
              animationDuration: Math.random() * 4 + 3 + "s"
            }}
          ></div>
        ))}
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
    </div>
  )
}

// Shimmer Button Component
const ShimmerButton = ({ children, ...props }) => {
  return (
    <Button
      className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-purple-500/30 transition-all duration-300 group"
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
    </Button>
  )
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)

  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingLocal(true)
    const success = await login(formData.email, formData.password)

    if (success) {
      router.push("/")
    } else {
      setIsLoadingLocal(false)
      alert("Invalid credentials")
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Add floating animation on mount
  useEffect(() => {
    const card = document.querySelector(".login-card")
    if (card) {
      card.classList.add("animate-float-in")
    }
  }, [])

  return (
    <>
      <ParticleBackground />

      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        <div className="absolute top-4 right-4 z-20">
          <ModeToggle />
        </div>

        <div className="w-full max-w-lg px-4">
          <Card className="login-card relative overflow-hidden border-none shadow-2xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl transition-all duration-500 hover:shadow-purple-500/20 hover:scale-[1.02] hover:rotate-1">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 -z-10"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>

            <CardHeader className="text-center pt-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg animate-spin-slow">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome to DigiShop
              </CardTitle>
              <CardDescription className="text-lg mt-2 text-gray-600 dark:text-gray-300">
                Log in to manage your merchant account
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2 group">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700 dark:text-gray-200 group-focus-within:text-purple-600 transition-colors"
                    >
                      Email Address
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="yourname@example.com"
                        required
                        className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:focus:border-purple-500 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700 dark:text-gray-200 group-focus-within:text-purple-600 transition-colors"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          handleChange("password", e.target.value)
                        }
                        placeholder="••••••••"
                        required
                        className="pl-10 border-gray-300 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:focus:border-purple-500 transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <ShimmerButton
                    type="submit"
                    disabled={isLoading || isLoadingLocal}
                    className="w-full py-6 text-lg font-semibold tracking-wide"
                  >
                    {isLoading || isLoadingLocal ? (
                      <div className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Logging in...
                      </div>
                    ) : (
                      "🔐 Login to Merchant Center"
                    )}
                  </ShimmerButton>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:hover:bg-purple-950/30 transition-all"
                    asChild
                  >
                    <Link href="/">← Back to DigiShop</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                    asChild
                  >
                    <Link href="/forgot-password">Forgot Password?</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Don’t have an account?{" "}
              <Link
                href="/register"
                className="text-purple-600 hover:underline font-medium"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes float-in {
          0% {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-float-in {
          animation: float-in 0.8s ease-out forwards;
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
      `}</style>
    </>
  )
}
