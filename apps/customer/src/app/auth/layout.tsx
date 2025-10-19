import { AuthProvider } from "@/contexts/auth-context";

export const metadata = {
    title: "Next.js",
};

export default function SettingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AuthProvider >
        
            {children}            
        
        </AuthProvider>
}