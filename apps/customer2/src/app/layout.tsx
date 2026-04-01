import { AuthProvider } from '@/contexts/auth-context'
import { GoogleOAuthProvider } from '@react-oauth/google'
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
    <GoogleOAuthProvider
      clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}
    >
      <AuthProvider>
        <html lang="en">
          <body>{children}</body>
        </html>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}
