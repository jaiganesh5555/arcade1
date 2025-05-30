import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the path is dashboard or starts with dashboard/
  if (request.nextUrl.pathname === '/dashboard' || request.nextUrl.pathname.startsWith('/dashboard/')) {
    // For client-side navigation, the token check is handled by the dashboard page itself
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard', '/dashboard/:path*']
} 