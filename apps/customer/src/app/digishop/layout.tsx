import Link from "next/link";
import Logo from "./../logo.png";
import Image from "next/image";
import { CircleUser, ShoppingCart } from "lucide-react";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <header className="bg-white border-2 ">
        <div className="px-20 py-5">
          <div className="flex items-center justify-between">
            {/* <h1 className="text-2xl font-bold text-gray-800">ShopSearch</h1> */}
            <Link href="/digishop">
              <Image src={Logo} alt="icon" height={70} />
            </Link>
            <nav className="hidden md:flex space-x-6 ">
              <a
                href="/digishop/status"
                className="text-black hover:text-gray-500 text-2xl px-10"
              >
                <ShoppingCart size={40} />
              </a>
              <a
                href="/digishop/setting/profile"
                className="text-black hover:text-gray-500 text-2xl"
              >
                <CircleUser size={40} />
              </a>
            </nav>
          </div>
        </div>
      </header>
      <div className="min-h-screen bg-white text-black">{children}</div>
    </AuthProvider>
  );
}
