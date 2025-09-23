import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  console.log("hi from midlleware")
  const url = req.nextUrl
  const isAdmin = url.pathname.startsWith("/admin")
  if (!isAdmin) return NextResponse.next()

  const hasRtk = req.cookies.get("rtk") // cookie refresh token
  console.log("rtk: ", hasRtk)
  if (!hasRtk) {
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

// กำหนด matcher เฉพาะกลุ่ม admin
export const config = {
  matcher: ["/admin/:path*"]
}
