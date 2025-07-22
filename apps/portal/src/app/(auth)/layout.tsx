import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Merchant Dashboard",
  description:
    "Complete merchant management platform for products, orders, and business insights"
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div>{children}</div>
}
