import Link from "next/link";
import Logo from "./../logo.png";
import Image from "next/image";
import { CircleUser, ClipboardList, ShoppingCart } from "lucide-react";
import { AuthProvider  } from "@/contexts/auth-context";
import { Noto_Sans_Thai_Looped } from "next/font/google";

const notoSanLoop = Noto_Sans_Thai_Looped({
  weight:'400'
})
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
              <Link
                href="/digishop/shopping-cart"
                className="text-black hover:text-gray-500 text-2xl "
              >
                <ShoppingCart size={40} />
              </Link>
              <Link
                href="/digishop/order/status"
                className="text-black hover:text-gray-500 text-2xl px-10"
              >
                <ClipboardList size={40} />
              </Link>
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
      <div className={`min-h-screen bg-white text-black ${notoSanLoop.className}`}>{children}</div>
    </AuthProvider>
  );
}
