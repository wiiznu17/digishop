'use client'
import Link from "next/link";
import Logo from "./../logo.png";
import Image from "next/image";
import { CircleUser, ClipboardList, ShoppingCart } from "lucide-react";
import { AuthProvider, useAuth  } from "@/contexts/auth-context";
import {  Rubik } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import Button from "@/components/button";

const rubik = Rubik({
  subsets: ["latin"],
  weight: "300"
})

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const { pathname } = req.nextUrl
  const {user} = useAuth()
  const pathName = usePathname()
  const orderPage = "/order/D"
  const router = useRouter()
  return (
    <AuthProvider>
      {
        (!pathName.includes(orderPage)) &&<header className="bg-white border-2 ">  
          <div className="px-20 py-5">
            <div className="flex items-center justify-between">
              {/* <h1 className="text-2xl font-bold text-gray-800">ShopSearch</h1> */}
              <Link href="/">
                <Image src={Logo} alt="icon" height={70} />
              </Link>
              {
                user && (
              <nav className="hidden md:flex space-x-6">
                <Link
                  href="/shopping-cart"
                  className="text-black hover:text-gray-500 text-2xl "
                >
                  <ShoppingCart size={40} />
                </Link>
                <Link
                  href="/order/status"
                  className="text-black hover:text-gray-500 text-2xl px-10"
                >
                  <ClipboardList size={40} />
                </Link>
                <a
                  href="/setting/profile"
                  className="text-black hover:text-gray-500 text-2xl"
                >
                  <CircleUser size={40} />
                </a>
              </nav>
                )
              }
              {
                !user && (
                  <nav className={`hidden md:flex space-x-6 ${rubik.className}`}>
                    <Button size="lg" color="bg-blue-600/80 text-white" onClick={() => router.push('/auth')}>Log in</Button>
                    <Button size="lg" border="border-blue-600/80" onClick={() => router.push('/auth/register')}>Register</Button>
                  </nav>
                )
              }
            </div>
          </div>
        </header>
      }
      <div className={`min-h-screen bg-white text-black ${rubik.className}`}>{children}</div>
      <footer className="bg-white text-black py-5 border border-t border-gray-300">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2025 Digishop. All rights reserved. </p>
        </div>
      </footer>
    </AuthProvider>
  );
}
