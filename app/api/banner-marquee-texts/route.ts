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
        { error: 'Server configuration error', details: 'Missing Supabase credentials', texts: [] },
        { status: 500 }
      );
    }

    // Create a public Supabase client for anonymous access (no auth required)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('banner_marquee_texts')
      .select('id, text, link_url, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching banner marquee texts:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch banner marquee texts', 
          details: error.message,
          texts: [] 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ texts: data || [] });
  } catch (error: any) {
    console.error('Error in banner marquee texts API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message, texts: [] },
      { status: 500 }
    );
  }
}
