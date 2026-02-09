import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ error: 'Cloudinary cloud name is not configured' }, { status: 500 });
    }

    if (!process.env.CLOUDINARY_UPLOAD_PRESET) {
      return NextResponse.json({ error: 'Cloudinary upload preset is not configured' }, { status: 500 });
    }

    // Upload to Cloudinary using unsigned upload with upload preset
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    // Convert file to base64 for upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Use FormData for multipart upload (more reliable than URLSearchParams for files)
    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', dataUri);
    cloudinaryFormData.append('upload_preset', process.env.CLOUDINARY_UPLOAD_PRESET);
    // Explicitly set a clean public_id without slashes to avoid "display name cannot contain slashes" error
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    cloudinaryFormData.append('public_id', `gallery_${timestamp}_${randomStr}`);

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData,
      // Don't set Content-Type header - let fetch set it automatically with boundary for FormData
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        const errorText = await response.text();
        errorData = { error: { message: errorText } };
      }
      console.error('Cloudinary upload error:', errorData);
      
      // Provide helpful error messages
      if (errorData.error?.message?.includes('whitelisted')) {
        return NextResponse.json({ 
          error: 'Upload preset must be set to "Unsigned" mode in Cloudinary. Please check your Cloudinary settings.' 
        }, { status: 500 });
      }
      
      if (errorData.error?.message?.includes('Invalid upload preset')) {
        return NextResponse.json({ 
          error: 'Invalid upload preset. Please check CLOUDINARY_UPLOAD_PRESET in your environment variables.' 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: errorData.error?.message || 'Failed to upload to Cloudinary' 
      }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      url: data.secure_url,
      publicId: data.public_id,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
