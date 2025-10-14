"use client"

import { useState, useEffect } from "react"
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
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" })
  const [isLoadingLocal, setIsLoadingLocal] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoadingLocal(true)
    const ok = await login(formData.email, formData.password)
    if (ok) {
      console.log("push", ok)
      router.push("/")
    } else {
      setIsLoadingLocal(false)
      alert("Invalid credentials")
    }
  }

  const handleChange = (field: "email" | "password", value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }))

  // กันกรณี hydration: โฟกัส ring ให้ใช้สี primary ปกติ
  useEffect(() => {}, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Light/Dark mode */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      <div className="w-full max-w-md px-4">
        <Card className="border bg-card">
          <CardHeader className="pt-6">
            <CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
            <CardDescription>
              Log in to manage your merchant account
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  className="focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                  className="focus-visible:ring-primary"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || isLoadingLocal}
                className="w-full font-medium"
              >
                {isLoading || isLoadingLocal ? "Signing in..." : "Sign in"}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <Link
                  href="/"
                  className="text-muted-foreground hover:underline"
                >
                  ← Back to DigiShop
                </Link>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don’t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
