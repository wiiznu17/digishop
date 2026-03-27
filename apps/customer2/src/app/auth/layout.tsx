import { AuthProvider } from '@/contexts/auth-context'
import { Rubik } from 'next/font/google'

export const metadata = {
  title: 'Next.js'
}
const rubik = Rubik({
  subsets: ['latin'],
  weight: '300'
})
export default function SettingLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <div className={`${rubik.className}`}>{children}</div>
    </AuthProvider>
  )
}
