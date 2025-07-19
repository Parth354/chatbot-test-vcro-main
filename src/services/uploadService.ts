import { supabase } from "@/integrations/supabase/client";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  path: string;
}

export interface UploadError {
  message: string;
  code?: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

export const uploadService = {
  validateFile(file: File): string | null {
    if (!file) {
      return 'No file provided';
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Only PNG, JPG, GIF, and WebP images are allowed';
    }
    
    return null;
  },

  async uploadAvatar(
    file: File, 
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const validationError = this.validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    try {
      // Simulate progress for user feedback
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return {
        url: publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Upload error:', error);
      
      if (error instanceof Error) {
        // Provide specific error messages based on error type
        if (error.message.includes('timeout')) {
          throw new Error('Upload timed out. Please check your internet connection and try again.');
        } else if (error.message.includes('network')) {
          throw new Error('Network error. Please check your connection and try again.');
        } else if (error.message.includes('authentication')) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (error.message.includes('storage')) {
          throw new Error('Storage error. Please contact support if this continues.');
        }
        throw new Error(error.message);
      }
      
      throw new Error('Failed to upload file. Please try again or contact support.');
    }
  },

  async deleteAvatar(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('avatars')
        .remove([path]);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete file. Please try again.');
    }
  },

  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  },

  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
};