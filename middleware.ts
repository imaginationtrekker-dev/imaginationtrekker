// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  // Check if environment variables are set
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If environment variables are missing, allow the request to continue
  // This prevents crashes during deployment before env vars are set
  if (!supabaseUrl || !supabaseAnonKey) {
    // Only protect dashboard routes if we have the necessary env vars
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      const loginUrl = new URL('/login', req.nextUrl.origin);
      loginUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
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

    // Protect all /dashboard routes
    if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
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
     * Match dashboard routes only.
     * This matcher excludes API routes, Next.js internals, and static files automatically.
     */
    '/dashboard/:path*',
  ],
};
