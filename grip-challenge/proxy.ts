import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Keeps the Supabase session fresh on every navigation, and sends visitors
// without a session to /login. Role checks happen in the pages (requireRole).
const PUBLIC = ['/login', '/offline', '/api/intake', '/api/cron', '/api/auth', '/auth']

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const isPublic = PUBLIC.some((p) => request.nextUrl.pathname.startsWith(p))

  if (!url) {
    // Demo mode: the persona cookie is the session.
    if (!isPublic && !request.cookies.get('grip_demo_as')) return NextResponse.redirect(new URL('/login', request.url))
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of list) response.cookies.set(name, value, options)
      },
    },
  })
  // getClaims refreshes an expired session and verifies the JWT locally.
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims && !isPublic) return NextResponse.redirect(new URL('/login', request.url))
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|icons/|sw.js|manifest.webmanifest|favicon.ico|.*\\.png$).*)'],
}
