import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const useImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB');
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        // Check if it's a bucket not found error
        if (error.message?.includes('Bucket not found') || error.message?.includes('The resource was not found')) {
          throw new Error('Storage bucket "menu-images" not found. Please create it in Supabase Storage or use an image URL instead.');
        }
        // Check if it's an RLS policy error
        if (error.message?.includes('row-level security') || error.message?.includes('violates row-level security') || error.message?.includes('RLS')) {
          throw new Error('Image upload permission denied. Please run the database migration to fix storage policies, or use an image URL instead.');
        }
        // Check if it's an authentication error
        if (error.message?.includes('JWT') || error.message?.includes('unauthorized') || error.message?.includes('permission')) {
          throw new Error('Image upload permission denied. Please check your Supabase storage policies, or use an image URL instead.');
        }
        throw new Error(error.message || 'Failed to upload image to storage');
      }

      if (!data) {
        throw new Error('Upload succeeded but no data returned');
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('menu-images')
        .getPublicUrl(data.path);

      if (!urlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/menu-images/[filename]
      const urlParts = imageUrl.split('/');
      let fileName = urlParts[urlParts.length - 1];
      
      // If URL contains query parameters, remove them
      if (fileName.includes('?')) {
        fileName = fileName.split('?')[0];
      }

      const { error } = await supabase.storage
        .from('menu-images')
        .remove([fileName]);

      if (error) {
        // Don't throw error if file doesn't exist or user doesn't have permission
        // Just log it and continue
        if (error.message?.includes('not found') || error.message?.includes('permission')) {
          console.warn('Could not delete image (may not exist or no permission):', error.message);
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw - allow UI to continue even if deletion fails
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
    uploadProgress
  };
};