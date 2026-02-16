import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50 MB

function generateSignature(params: Record<string, string>, apiSecret: string): string {
  const sortedKeys = Object.keys(params).sort();
  const paramStr = sortedKeys.map((k) => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(paramStr + apiSecret).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type - PDF only
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Validate file size (max 50MB)
    if (file.size > MAX_PDF_SIZE) {
      return NextResponse.json(
        { error: 'File size must be less than 50MB' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName) {
      return NextResponse.json(
        { error: 'Cloudinary cloud name is not configured' },
        { status: 500 }
      );
    }

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Cloudinary API credentials are not configured' },
        { status: 500 }
      );
    }

    // Upload to Cloudinary using raw resource type (for PDFs)
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const publicId = `pdf_${timestamp}_${randomStr}`;

    // Generate signature for authenticated upload
    const paramsToSign: Record<string, string> = {
      folder: 'packages',
      public_id: publicId,
      timestamp,
    };
    const signature = generateSignature(paramsToSign, apiSecret);

    // Convert File to Buffer for reliable server-side forwarding
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const blob = new Blob([buffer], { type: 'application/pdf' });

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', blob, file.name || 'document.pdf');
    cloudinaryFormData.append('public_id', publicId);
    cloudinaryFormData.append('folder', 'packages');
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('signature', signature);

    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: cloudinaryFormData,
    });

    if (!response.ok) {
      let errorData: { error?: { message?: string } } = {};
      try {
        errorData = await response.json();
      } catch {
        const errorText = await response.text();
        errorData = { error: { message: errorText } };
      }
      console.error('Cloudinary PDF upload error:', errorData);
      const errorMsg = errorData.error?.message || 'Failed to upload PDF to Cloudinary';
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    const data = await response.json();
    const pdfUrl = data.secure_url || data.url;
    const returnedPublicId = data.public_id;

    // Verify the uploaded PDF is publicly accessible
    let deliveryBlocked = false;
    try {
      const headCheck = await fetch(pdfUrl, { method: 'HEAD' });
      if (!headCheck.ok) {
        deliveryBlocked = true;
      }
    } catch {
      deliveryBlocked = true;
    }

    return NextResponse.json({
      url: pdfUrl,
      publicId: returnedPublicId,
      deliveryBlocked,
    });
  } catch (error: unknown) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'PDF upload failed',
      },
      { status: 500 }
    );
  }
}
