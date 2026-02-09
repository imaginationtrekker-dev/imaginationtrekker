import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Verify environment variables are available
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    // Create a public Supabase client for anonymous access (no auth required)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching testimonials:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      return NextResponse.json(
        { 
          error: 'Failed to fetch testimonials', 
          details: error.message,
          code: error.code,
          hint: error.hint || 'Check Supabase RLS policies for anonymous access'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testimonials: data || [],
    });
  } catch (error: any) {
    console.error('Error in testimonials API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
