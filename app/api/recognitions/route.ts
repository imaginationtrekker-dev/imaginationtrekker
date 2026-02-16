import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server configuration error', recognitions: [] }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('recognitions')
      .select('id, image_url, title, link_url, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching recognitions:', error);
      return NextResponse.json({ error: 'Failed to fetch recognitions', recognitions: [] }, { status: 500 });
    }

    return NextResponse.json({ recognitions: data || [] });
  } catch (error: unknown) {
    console.error('Error in recognitions API:', error);
    return NextResponse.json({ error: 'Internal server error', recognitions: [] }, { status: 500 });
  }
}
