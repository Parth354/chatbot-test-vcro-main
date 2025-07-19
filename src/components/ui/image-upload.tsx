import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { uploadService, UploadProgress } from '@/services/uploadService';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageChange: (url: string | null) => void;
  userId: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({ 
  currentImage, 
  onImageChange, 
  userId, 
  className, 
  disabled = false 
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return;

    // Validate file
    const validationError = uploadService.validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid File",
        description: validationError,
        variant: "destructive"
      });
      return;
    }

    // Create preview
    const preview = uploadService.createPreviewUrl(file);
    setPreviewUrl(preview);
    setIsUploading(true);
    setUploadProgress({ loaded: 0, total: file.size, percentage: 0 });

    try {
      const result = await uploadService.uploadAvatar(
        file, 
        userId,
        (progress) => setUploadProgress(progress)
      );

      onImageChange(result.url);
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive"
      });
      onImageChange(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (preview) {
        uploadService.revokePreviewUrl(preview);
      }
      setPreviewUrl(null);
    }
  }, [disabled, userId, onImageChange, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    // Reset input
    e.target.value = '';
  }, [handleFileSelect]);

  const handleRemoveImage = useCallback(() => {
    if (!disabled) {
      onImageChange(null);
    }
  }, [disabled, onImageChange]);

  const displayImage = previewUrl || currentImage;

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragging && !disabled
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {displayImage ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={displayImage}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full object-cover mx-auto border-2 border-muted"
              />
              {!isUploading && !disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {isUploading && uploadProgress ? (
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading... {Math.round(uploadProgress.percentage)}%
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click or drag to replace image
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
            )}
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {isUploading ? "Uploading..." : "Upload avatar image"}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Max 2MB • JPG, PNG, GIF, WebP
              </p>
            </div>

            {isUploading && uploadProgress && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {Math.round(uploadProgress.percentage)}%
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!disabled && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Maximum file size: 2MB</p>
          <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
          <p>• Recommended size: 200x200 pixels or larger</p>
        </div>
      )}
    </div>
  );
}