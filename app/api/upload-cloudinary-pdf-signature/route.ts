import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Returns Cloudinary upload signature for client-side PDF upload.
 * The actual file is uploaded directly from the browser to Cloudinary,
 * avoiding Vercel's 5MB serverless function body limit.
 */
export async function GET() {
  try {
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

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const publicId = `pdf_${timestamp}_${randomStr}`;

    const paramsToSign: Record<string, string> = {
      folder: 'packages',
      public_id: publicId,
      timestamp,
    };
    const sortedKeys = Object.keys(paramsToSign).sort();
    const paramStr = sortedKeys.map((k) => `${k}=${paramsToSign[k]}`).join('&');
    const signature = crypto.createHash('sha1').update(paramStr + apiSecret).digest('hex');

    return NextResponse.json({
      cloudName,
      apiKey,
      signature,
      timestamp,
      publicId,
      folder: 'packages',
    });
  } catch (error) {
    console.error('PDF signature error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
