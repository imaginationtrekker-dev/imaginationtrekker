import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid request body. Please provide valid JSON.' },
        { status: 400 }
      );
    }

    const { email, password, redirectTo } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback?next=/dashboard`,
      },
    });

    if (error) {
      console.error('Signup error:', error);
      
      // Handle specific error cases
      if (error.message.includes('User already registered')) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 409 }
        );
      }
      
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return NextResponse.json({
        message: 'Confirmation email sent. Please check your inbox.',
        requiresEmailConfirmation: true,
        redirectTo: '/login',
      });
    }

    // If auto-confirm is enabled, user is logged in immediately
    if (data.user && data.session) {
      return NextResponse.json({
        redirectTo: redirectTo || '/dashboard',
        requiresEmailConfirmation: false,
      });
    }

    return NextResponse.json(
      { error: 'Signup failed. Please try again.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Signup API error:', error);
    return NextResponse.json(
      { 
        error: error?.message || 'An unexpected error occurred during signup.',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
