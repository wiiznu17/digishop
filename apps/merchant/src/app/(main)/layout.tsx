import type { Metadata } from "next"
import ClientBody from "./ClientBody"

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
  return <ClientBody>{children}</ClientBody>
}
