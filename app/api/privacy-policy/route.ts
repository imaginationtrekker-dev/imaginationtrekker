import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Create a public Supabase client for anonymous access (no auth required)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('privacy_policy')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1); // Usually only one privacy policy document

    if (error) {
      console.error('Error fetching privacy policy:', error);
      return NextResponse.json(
        { error: 'Failed to fetch privacy policy', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      policy: data && data.length > 0 ? data[0] : null,
    });
  } catch (error: any) {
    console.error('Error in privacy policy API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
