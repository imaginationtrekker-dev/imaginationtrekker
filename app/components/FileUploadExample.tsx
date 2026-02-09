'use client';

import { useState } from 'react';
import { uploadFile } from '@/lib/file-upload-helper';
import toast from 'react-hot-toast';

/**
 * Example component showing how to upload files
 * This demonstrates the file upload pattern used in the project
 */
export function FileUploadExample() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // Upload file using helper function
      const result = await uploadFile(file, {
        bucket: 'uploads', // or 'profile-images', 'package-images', etc.
        folder: 'images', // optional folder path
        maxSize: 5 * 1024 * 1024, // 5MB
      });

      if (result.success && result.url) {
        setImageUrl(result.url);
        toast.success('File uploaded successfully!');
        
        // Now you can save the URL to your database
        // Example: await saveToDatabase({ image_url: result.url });
        console.log('File URL:', result.url);
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload error occurred');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">File Upload Example</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Select Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            disabled:opacity-50"
        />
      </div>

      {uploading && (
        <div className="mb-4 text-blue-600">Uploading...</div>
      )}

      {imageUrl && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Uploaded Image:</p>
          <img
            src={imageUrl}
            alt="Uploaded"
            className="max-w-xs rounded-lg border border-gray-200"
          />
          <p className="text-xs text-gray-500 mt-2 break-all">{imageUrl}</p>
        </div>
      )}
    </div>
  );
}
