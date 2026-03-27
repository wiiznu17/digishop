'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import Image from 'next/image'
import { ModeToggle } from '@/components/mode-toggle'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const DIGISHOP_URL =
    process.env.NEXT_PUBLIC_DIGISHOP_URL ?? 'https://digishop.localhost'

  const handleChange = (field: 'email' | 'password', value: string) =>
    setFormData((p) => ({ ...p, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingLocal(true)
    const ok = await login(formData.email, formData.password)
    if (ok) router.push('/orders')
    else {
      setIsLoadingLocal(false)
      alert('Invalid credentials')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background">
      <div className="relative flex items-center justify-center p-8 bg-background">
        <Image
          src="/Login-amico.svg"
          alt="DigiShop"
          width={420}
          height={420}
          priority
          className="drop-shadow-sm"
        />
      </div>

      <div className="relative flex items-center justify-center bg-gradient-to-br from-fuchsia-100 via-rose-100 to-violet-100 dark:from-zinc-950 dark:via-violet-950/40 dark:to-fuchsia-950/40">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <div className="w-full max-w-md px-6 py-10">
          <Card className="border-border bg-card/90 backdrop-blur-md shadow-xl">
            <CardHeader className="pt-6">
              <CardTitle className="text-2xl font-semibold text-card-foreground">
                Login
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to DigiShop Merchant Portal
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">
                    Email Address
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                    </span>
                    <Input
                      id="email"
                      type="email"
                      placeholder="digio@thailand.com"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      className="pl-9 focus-visible:ring-fuchsia-500"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                    </span>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      className="pl-9 pr-10 focus-visible:ring-fuchsia-500"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isLoadingLocal}
                  className="w-full font-medium bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white shadow-md"
                >
                  {isLoading || isLoadingLocal ? 'Signing in...' : 'Login'}
                </Button>

                <div className="flex items-center justify-between text-sm">
                  <Link
                    href={`${DIGISHOP_URL}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    ← Back to DigiShop
                  </Link>
                  <Link
                    href={`${DIGISHOP_URL}/auth/forgot-password`}
                    className="text-primary hover:underline"
                  >
                    Forgot Password
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don’t have an account?{' '}
            <Link
              href={`${DIGISHOP_URL}/auth/register`}
              className="font-medium text-primary hover:underline underline-offset-4"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
