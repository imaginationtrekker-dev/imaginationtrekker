import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { publicId, resourceType = 'image' } = await request.json();

    if (!publicId) {
      return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
    }

    // Delete from Cloudinary - support both image and raw (PDF) resource types
    const resource = resourceType === 'raw' ? 'raw' : 'image';
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${resource}/destroy`;
    
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', process.env.CLOUDINARY_API_KEY || '');
    formData.append('api_secret', process.env.CLOUDINARY_API_SECRET || '');

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Cloudinary delete error:', error);
      return NextResponse.json({ error: 'Failed to delete from Cloudinary' }, { status: 500 });
    }

    const data = await response.json();

    if (data.result !== 'ok') {
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message || 'Delete failed' }, { status: 500 });
  }
}
