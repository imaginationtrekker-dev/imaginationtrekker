'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function SignupCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {

      try {
        // Check for URL fragments (access_token, etc.) from email confirmation
        const hash = window.location.hash;
        if (hash) {
          // Parse the hash parameters
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            // Set the session using the tokens
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Session error:', error);
              toast.error('Authentication failed.');
              router.push('/signup');
              return;
            }

            if (data.session) {
              toast.success('Email confirmed successfully! Welcome!');
              router.push('/dashboard');
              return;
            }
          }
        }

        // Fallback: try to get the current session
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          toast.error('Authentication failed.');
          router.push('/signup');
          return;
        }

        toast.success('Email confirmed successfully! Welcome!');
        router.push('/dashboard');
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('An error occurred during authentication.');
        router.push('/signup');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
        <p className='text-gray-600'>Processing authentication...</p>
      </div>
    </div>
  );
}
