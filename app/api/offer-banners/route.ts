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
        { error: 'Server configuration error', details: 'Missing Supabase credentials', banners: [] },
        { status: 500 }
      );
    }

    // Create a public Supabase client for anonymous access (no auth required)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // First check if table exists and get all banners for debugging
    const { data: allData, error: allError } = await supabase
      .from('offer_banners')
      .select('*');

    console.log('All offer banners:', allData);
    console.log('All banners error:', allError);

    const { data, error } = await supabase
      .from('offer_banners')
      .select('id, image_url, alt_title, link_url, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    console.log('Active offer banners:', data);
    console.log('Active banners error:', error);

    if (error) {
      console.error('Error fetching offer banners:', error);
      return NextResponse.json(
        { 
          error: 'Failed to fetch offer banners', 
          details: error.message,
          code: error.code,
          hint: error.hint,
          banners: [] 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      banners: data || [],
      debug: {
        totalBanners: allData?.length || 0,
        activeBanners: data?.length || 0
      }
    });
  } catch (error: any) {
    console.error('Error in offer banners API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message, banners: [] },
      { status: 500 }
    );
  }
}
