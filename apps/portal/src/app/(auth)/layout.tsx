import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login to DigiShop Portal',
  description:
    'Complete merchant management platform for products, orders, and business insights'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div>{children}</div>
}
