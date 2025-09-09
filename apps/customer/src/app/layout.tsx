import { AuthProvider } from '@/contexts/auth-context';
import './globals.css'
import { Rubik, Ubuntu } from "next/font/google"
export const metadata = {
    title: "Next.js",
};

const rubik = Rubik({
  subsets: ["latin"],
  weight: "300"
})
const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: "300"
})

export default function SettingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthProvider>
        <html lang="en">
            <body >
                {children}
            </body>
        </html>
        </AuthProvider>
       
    )
}