export const metadata = {
    title: "Next.js",
};

export default function SettingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <header style={{
                    backgroundColor: "lightblue",
                    padding: "1rem"
                }}
            >
                <p>Authorize</p>    
            </header>
            {children}
        </>
    )
}