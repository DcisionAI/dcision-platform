import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Allow public routes
  const publicPaths = ['/', '/auth', '/favicon.ico'];
  const isPublic = publicPaths.some(path => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(path + '/'));
  const isStatic = req.nextUrl.pathname.startsWith('/_next') || req.nextUrl.pathname.startsWith('/static') || req.nextUrl.pathname.startsWith('/public');

  if (isPublic || isStatic) {
    return res;
  }

  // If not authenticated, redirect to same URL with ?auth=signin
  if (!session) {
    const url = new URL(req.url);
    // Only redirect if not already on ?auth=signin
    if (url.searchParams.get('auth') !== 'signin') {
      url.searchParams.set('auth', 'signin');
      return NextResponse.redirect(url);
    }
    // If already on ?auth=signin, just return the response (let the frontend handle login)
    return res;
  }

  return res;
}

// Protect all routes except static assets and public paths
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 