import { AuthProvider } from '@/contexts/auth-context'
import './globals.css'
export const metadata = {
  title: 'Next.js'
}

export default function SettingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </AuthProvider>
  )
}
