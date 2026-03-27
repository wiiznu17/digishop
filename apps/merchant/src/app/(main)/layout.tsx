'use client'

// import type { Metadata } from "next"
import MerchantLayout from './MerchantLayout'

// export const metadata: Metadata = {
//   title: "Merchant Dashboard",
//   description:
//     "Complete merchant management platform for products, orders, and business insights"
// }

export default function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return <MerchantLayout>{children}</MerchantLayout>
}
