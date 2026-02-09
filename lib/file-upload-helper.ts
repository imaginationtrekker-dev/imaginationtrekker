/**
 * File Upload Helper Functions
 * 
 * Utility functions for handling file uploads to Supabase Storage
 */

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  bucket?: string;
  fileName?: string;
  error?: string;
}

/**
 * Upload a file to Supabase Storage via API
 */
export async function uploadFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    bucket = 'uploads',
    folder = '',
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  } = options;

  // Validate file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  // Validate file size
  if (file.size > maxSize) {
    return {
      success: false,
      error: `File size too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
    };
  }

  // Create form data
  const formData = new FormData();
  formData.append('file', file);
  if (bucket) formData.append('bucket', bucket);
  if (folder) formData.append('folder', folder);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Upload failed',
      };
    }

    return {
      success: true,
      url: result.url,
      path: result.path,
      bucket: result.bucket,
      fileName: result.fileName,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Network error during upload',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => uploadFile(file, options));
  return Promise.all(uploadPromises);
}
