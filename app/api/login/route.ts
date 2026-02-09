import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    const { email, password, redirectTo } = await request.json();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Ensure session is properly set by getting it again
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // ✅ Send JSON back with redirect URL
    return NextResponse.json({ redirectTo: redirectTo || '/dashboard' });
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'An unexpected error occurred during login.',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
