import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const PUBLIC_PATHS = ["/register", "/"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("token")?.value
  if (PUBLIC_PATHS.includes(pathname)) {
    if (token) {
      try {
        console.log("Token:", token)
        console.log("JWT_SECRET:", process.env.JWT_SECRET)
        const payload = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET!)
        )
        if (payload.payload.role === "CUSTOMER") {
          return NextResponse.redirect(new URL("/digishop", req.url))
        } else {
          return NextResponse.redirect(new URL("/register"))
        }
      } catch (error) {
        console.log('token',error)
        return NextResponse.next()
      }
    } else {
        return NextResponse.next()
    }
  }

  if (!token) {
    console.log('no token')
    return NextResponse.redirect(new URL("/", req.url))
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
    return NextResponse.next()
  } catch (error){
    console.log('!token',error)
    return NextResponse.redirect(new URL("/", req.url))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}
