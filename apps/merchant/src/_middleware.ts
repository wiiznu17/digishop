import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/register', '/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get('token')?.value

  if (PUBLIC_PATHS.includes(pathname)) {
    if (token) {
      try {
        const payload = await jwtVerify(
          token,
          new TextEncoder().encode(process.env.JWT_SECRET!)
        )
        if (payload.payload.role === 'MERCHANT') {
          console.log('redirect to ... ')
          return NextResponse.redirect(new URL('/', req.url))
        } else {
          return NextResponse.redirect(new URL('/register'))
        }
      } catch {
        return NextResponse.next()
      }
    } else {
      if (pathname === '/register') {
        return NextResponse.redirect(new URL('/login', req.url))
      } else {
        return NextResponse.next()
      }
    }
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!))
    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
