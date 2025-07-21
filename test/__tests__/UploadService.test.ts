import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadService } from '@/services/uploadService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase storage
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'mock-public-url' },
        })),
      })),
    },
  },
}));

// Mock global URL object methods
const mockCreateObjectURL = vi.fn();
const mockRevokeObjectURL = vi.fn();

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL,
  },
  writable: true,
});

describe('UploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
  });

  describe('validateFile', () => {
    it('should return null for a valid image file', () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(mockFile, 'size', { value: 1024 * 1024 }); // 1MB

      expect(uploadService.validateFile(mockFile)).toBeNull();
    });

    it('should return error for no file provided', () => {
      expect(uploadService.validateFile(null as any)).toBe('No file provided');
    });

    it('should return error for file size exceeding limit', () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(mockFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB

      expect(uploadService.validateFile(mockFile)).toBe('File size must be less than 2MB');
    });

    it('should return error for unsupported file type', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(mockFile, 'size', { value: 100 });

      expect(uploadService.validateFile(mockFile)).toBe('Only PNG, JPG, GIF, and WebP images are allowed');
    });
  });

  describe('uploadAvatar', () => {
    const mockUserId = 'user-123';
    const mockFile = new File([''], 'avatar.png', { type: 'image/png' });
    Object.defineProperty(mockFile, 'size', { value: 500 * 1024 }); // 500KB

    it('should upload avatar and return public URL', async () => {
      vi.mocked(supabase.storage.from('avatars').upload).mockResolvedValue({
        data: { path: 'user-123/some-file.png' },
        error: null,
      });

      const result = await uploadService.uploadAvatar(mockFile, mockUserId);

      expect(supabase.storage.from('avatars').upload).toHaveBeenCalled();
      expect(result).toEqual({ url: 'mock-public-url', path: 'user-123/some-file.png' });
    });

    it('should call onProgress callback during upload', async () => {
      const onProgressMock = vi.fn();
      vi.mocked(supabase.storage.from('avatars').upload).mockResolvedValue({
        data: { path: 'user-123/some-file.png' },
        error: null,
      });

      await uploadService.uploadAvatar(mockFile, mockUserId, onProgressMock);

      expect(onProgressMock).toHaveBeenCalledWith({ loaded: 0, total: mockFile.size, percentage: 0 });
      expect(onProgressMock).toHaveBeenCalledWith({ loaded: mockFile.size, total: mockFile.size, percentage: 100 });
    });

    it('should throw an error if upload fails', async () => {
      const mockError = new Error('Upload failed');
      vi.mocked(supabase.storage.from('avatars').upload).mockResolvedValue({
        data: null,
        error: mockError,
      });

      await expect(uploadService.uploadAvatar(mockFile, mockUserId)).rejects.toThrow('Upload failed');
    });

    it('should throw an error for invalid file during upload', async () => {
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(invalidFile, 'size', { value: 100 });

      await expect(uploadService.uploadAvatar(invalidFile, mockUserId)).rejects.toThrow('Only PNG, JPG, GIF, and WebP images are allowed');
    });
  });

  describe('deleteAvatar', () => {
    it('should delete avatar successfully', async () => {
      const mockPath = 'user-123/some-file.png';
      vi.mocked(supabase.storage.from('avatars').remove).mockResolvedValue({ data: {}, error: null });

      await uploadService.deleteAvatar(mockPath);

      expect(supabase.storage.from('avatars').remove).toHaveBeenCalledWith([mockPath]);
    });

    it('should throw an error if delete fails', async () => {
      const mockError = new Error('Delete failed');
      vi.mocked(supabase.storage.from('avatars').remove).mockResolvedValue({ data: null, error: mockError });

      await expect(uploadService.deleteAvatar('some-path')).rejects.toThrow('Delete failed');
    });
  });

  describe('createPreviewUrl', () => {
    it('should create a valid object URL', () => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const mockUrl = 'blob:http://localhost/mock-uuid';
      mockCreateObjectURL.mockReturnValue(mockUrl);

      const result = uploadService.createPreviewUrl(mockFile);

      expect(result).toBe(mockUrl);
      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockFile);
    });
  });

  describe('revokePreviewUrl', () => {
    it('should revoke an object URL', () => {
      const mockUrl = 'blob:http://localhost/mock-uuid';
      mockRevokeObjectURL.mockImplementation(() => {});

      uploadService.revokePreviewUrl(mockUrl);

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });
});