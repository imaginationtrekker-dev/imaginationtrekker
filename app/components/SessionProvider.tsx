'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * Session Provider Component
 * Handles session refresh and automatic re-authentication
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Session refreshed or signed out
        if (event === 'TOKEN_REFRESHED') {
          // Silently refresh the page to update session
          router.refresh();
        }
      }

      if (event === 'SIGNED_IN') {
        router.refresh();
      }
    });

    // Periodically check and refresh session
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Session check error:', error);
          return;
        }

        if (session) {
          // Check if session is close to expiring (within 10 minutes)
          const expiresAt = session.expires_at;
          if (expiresAt) {
            const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
            if (expiresIn < 600) {
              // Less than 10 minutes, refresh it
              const { error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error('Session refresh error:', refreshError);
                // If refresh fails, user might need to login again
                if (refreshError.message.includes('expired') || refreshError.message.includes('invalid')) {
                  router.push('/login');
                }
              }
            }
          }
        } else {
          // No session, but don't redirect here (let middleware handle it)
          console.log('No active session');
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    // Check session every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  return <>{children}</>;
}
