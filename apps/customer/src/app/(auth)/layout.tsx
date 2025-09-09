import { AuthProvider } from "@/contexts/auth-context";
import { Rubik } from "next/font/google";
const rubik = Rubik({
  subsets: ["latin"],
  weight: "300"
})

export const metadata = {
    title: "Next.js",
};

export default function SettingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AuthProvider>
        <body className={`${rubik.className}`}>
            {children}            
        </body>
        </AuthProvider>
}