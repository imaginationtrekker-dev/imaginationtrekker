// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Early return for non-dashboard routes (shouldn't happen with our matcher, but defensive)
  if (!req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.next();
  }

  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If environment variables are missing, redirect to login
  // This prevents crashes during deployment before env vars are set
  if (!supabaseUrl || !supabaseAnonKey) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value);
              res.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Protect all /dashboard routes - redirect to login if no session
    if (!session) {
      const loginUrl = new URL('/login', req.nextUrl.origin);
      loginUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    return res;
  } catch (error) {
    // If there's an error, allow the request to continue
    // This prevents middleware from breaking the entire app
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match only dashboard routes.
     * Explicitly match both /dashboard and /dashboard/* paths.
     * Next.js automatically excludes API routes, _next, and static files.
     */
    '/dashboard',
    '/dashboard/:path*',
  ],
};
