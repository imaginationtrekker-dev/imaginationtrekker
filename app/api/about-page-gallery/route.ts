import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sectionType = searchParams.get('section_type');

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('about_page_gallery')
      .select('*')
      .order('display_order', { ascending: true });

    if (sectionType) {
      query = query.eq('section_type', sectionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching gallery images:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in GET /api/about-page-gallery:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch gallery images' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { about_page_id, section_type, image_url, cloudinary_public_id, display_order } = body;

    if (!section_type || !image_url || !cloudinary_public_id) {
      return NextResponse.json(
        { error: 'section_type, image_url, and cloudinary_public_id are required' },
        { status: 400 }
      );
    }

    if (!['appreciation_letter', 'recognition_association_letter'].includes(section_type)) {
      return NextResponse.json(
        { error: 'section_type must be either "appreciation_letter" or "recognition_association_letter"' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get the about_page_id if not provided (use the first one)
    let finalAboutPageId = about_page_id;
    if (!finalAboutPageId) {
      const { data: aboutPageData } = await supabase
        .from('about_page')
        .select('id')
        .limit(1)
        .single();

      if (aboutPageData) {
        finalAboutPageId = aboutPageData.id;
      }
    }

    // Get the max display_order for this section
    const { data: maxOrderData } = await supabase
      .from('about_page_gallery')
      .select('display_order')
      .eq('section_type', section_type)
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const finalDisplayOrder = display_order !== undefined ? display_order : (maxOrderData?.display_order ?? 0) + 1;

    const { data, error } = await supabase
      .from('about_page_gallery')
      .insert({
        about_page_id: finalAboutPageId,
        section_type,
        image_url,
        cloudinary_public_id,
        display_order: finalDisplayOrder,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating gallery image:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in POST /api/about-page-gallery:', error);
    return NextResponse.json({ error: error.message || 'Failed to create gallery image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Get the image to retrieve cloudinary_public_id before deletion
    const { data: imageData, error: fetchError } = await supabase
      .from('about_page_gallery')
      .select('cloudinary_public_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching gallery image:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('about_page_gallery')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting gallery image:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Delete from Cloudinary
    if (imageData?.cloudinary_public_id) {
      try {
        const deleteResponse = await fetch(`${request.nextUrl.origin}/api/delete-cloudinary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: imageData.cloudinary_public_id }),
        });

        if (!deleteResponse.ok) {
          console.error('Failed to delete from Cloudinary, but image removed from database');
        }
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue even if Cloudinary deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/about-page-gallery:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete gallery image' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, display_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const updateData: any = {};
    if (display_order !== undefined) {
      updateData.display_order = display_order;
    }

    const { data, error } = await supabase
      .from('about_page_gallery')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating gallery image:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in PUT /api/about-page-gallery:', error);
    return NextResponse.json({ error: error.message || 'Failed to update gallery image' }, { status: 500 });
  }
}
