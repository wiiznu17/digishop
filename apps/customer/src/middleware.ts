import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = ["/auth","/product","/search","/store"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("token")?.value
  console.log('token',token)
  console.log('pathname',PUBLIC_PATHS.some((x) => pathname.startsWith(x)) ,pathname)
  if(PUBLIC_PATHS.some((x) => pathname.startsWith(x)) || pathname === '/') {
    return NextResponse.next()
  }else{
    if (token) {
      try {
        const payload = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET!)
        )
        console.log('role',payload.payload.role)
        if (payload.payload.role === "CUSTOMER") {
          return NextResponse.next()
        } else {
          return NextResponse.redirect(new URL("/auth"))
        }
      } catch {
        console.log('ji')
        return NextResponse.redirect(new URL("/"))
      }
    }
    return NextResponse.redirect(new URL("/", req.url))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
