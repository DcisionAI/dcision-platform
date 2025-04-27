import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Always redirect auth routes (except callback) to home
  if (req.nextUrl.pathname.startsWith('/auth') && !req.nextUrl.pathname.startsWith('/auth/callback')) {
    const redirectUrl = new URL('/', req.url)
    // Add a query parameter to trigger the auth modal
    redirectUrl.searchParams.set('auth', req.nextUrl.pathname === '/auth/signup' ? 'signup' : 'signin')
    return NextResponse.redirect(redirectUrl)
  }

  // If there's no session and the user is trying to access a protected route
  if (!session) {
    const isProtectedRoute = req.nextUrl.pathname !== '/' && 
      !req.nextUrl.pathname.startsWith('/_next') &&
      !req.nextUrl.pathname.startsWith('/api') &&
      !req.nextUrl.pathname.startsWith('/auth/callback')

    if (isProtectedRoute) {
      const redirectUrl = new URL('/', req.url)
      return NextResponse.redirect(redirectUrl)
    }
  }

  return res
}

// Specify which routes should be protected
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 