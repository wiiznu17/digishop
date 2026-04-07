'use client'
import Link from 'next/link'
import Logo from './../logo.png'
import Image from 'next/image'
import { CircleUser, ClipboardList, ShoppingCart, Bell, HelpCircle } from 'lucide-react'
import { AuthProvider, useAuth } from '@/contexts/auth-context'
import { Rubik } from 'next/font/google'
import { usePathname, useRouter } from 'next/navigation'

import { HeaderSearch } from '@/components/HeaderSearch'

const rubik = Rubik({
  subsets: ['latin'],
  weight: '300'
})

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const { user } = useAuth()
  const pathName = usePathname()
  const orderPage = '/order/D'

  return (
    <AuthProvider>
      {!pathName.includes(orderPage) && (
        <header className="flex flex-col bg-gradient-to-r from-blue-pastel-400 to-blue-pastel-500 sticky top-0 z-40 text-white shadow-md w-full">
          {/* Top subtle bar */}
          <div className="flex justify-between items-center px-4 md:px-20 py-2 border-b border-blue-pastel-300 text-sm">
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-50 transition-colors">Seller Centre</a>
              <span className="text-white/50">|</span>
              <a href="#" className="hover:text-blue-50 transition-colors">Download</a>
              <span className="text-white/50">|</span>
              <span className="flex space-x-2">
                <span>Follow us on</span>
                <span className="font-semibold">DigiShop</span>
              </span>
            </div>
            <div className="flex space-x-6 items-center">
              <a href="#" className="flex items-center space-x-1 hover:text-blue-50 transition-colors">
                <Bell size={16} />
                <span>Notifications</span>
              </a>
              <a href="#" className="flex items-center space-x-1 hover:text-blue-50 transition-colors">
                <HelpCircle size={16} />
                <span>Help</span>
              </a>
              {!user && (
                <>
                  <span className="text-white/50">|</span>
                  <Link href="/auth/register" className="hover:text-blue-50 font-medium transition-colors">Sign Up</Link>
                  <span className="text-white/50">|</span>
                  <Link href="/auth" className="hover:text-blue-50 font-medium transition-colors">Login</Link>
                </>
              )}
              {user && (
                <div className="hidden md:flex space-x-4 items-center">
                  <a href="/setting/profile" className="flex items-center space-x-1 hover:text-blue-50 transition-colors">
                    <CircleUser size={18} />
                    <span>Profile</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Main header body */}
          <div className="px-4 md:px-20 py-4 flex items-center justify-between gap-8">
            <Link href="/" className="flex-shrink-0 flex items-center justify-center">
              {/* Wrapping Image to invert or tint if we wanted, but we'll leave as is or use brightness to match the blue bg */}
              <div className="bg-white/90 p-1 rounded-xl">
                <Image src={Logo} alt="DigiShop Logo" height={50} className="object-contain" />
              </div>
            </Link>

            <div className="flex-1 max-w-4xl flex items-center justify-center">
              <HeaderSearch />
            </div>

            {user ? (
               <nav className="flex space-x-6 items-center text-white">
                <Link href="/shopping-cart" className="relative hover:scale-110 transition-transform">
                  <ShoppingCart size={32} />
                  {/* Placeholder badge */}
                  <span className="absolute -top-1 -right-2 bg-yellow text-blue-900 border-2 border-blue-pastel-500 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    0
                  </span>
                </Link>
                <Link href="/order/status" className="hover:scale-110 transition-transform">
                  <ClipboardList size={32} />
                </Link>
              </nav>
            ) : (
              <div className="flex space-x-4">
                 <Link href="/shopping-cart" className="relative hover:scale-110 transition-transform text-white">
                  <ShoppingCart size={32} />
                </Link>
              </div>
            )}
          </div>
        </header>
      )}
      <div className={`min-h-screen bg-gray-50 text-black ${rubik.className}`}>
        {children}
      </div>
      <footer className="bg-white text-gray-500 py-8 border-t-4 border-blue-pastel-500 mt-10">
        <div className="max-w-7xl mx-auto text-center">
          <p className="mb-4">Digishop Premium e-Commerce</p>
          <p>&copy; 2026 Digishop. All rights reserved. </p>
        </div>
      </footer>
    </AuthProvider>
  )
}
