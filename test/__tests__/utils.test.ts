import { describe, it, expect } from 'vitest';
import { cn, isValidUUID, normalizeLinkedInUrl } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should correctly merge Tailwind CSS classes', () => {
      expect(cn('text-red-500', 'bg-blue-200')).toBe('text-red-500 bg-blue-200');
    });

    it('should handle empty inputs', () => {
      expect(cn('', 'bg-blue-200', null, undefined)).toBe('bg-blue-200');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base-class', isActive && 'active-class', isDisabled && 'disabled-class')).toBe('base-class active-class');
    });

    it('should override duplicate classes with the last one', () => {
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('isValidUUID', () => {
    it('should return true for valid UUID v4 strings', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('FFFFFFFF-FFFF-4FFF-AFFF-FFFFFFFFFFFF')).toBe(true);
    });

    it('should return false for invalid UUID strings (malformed)', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false); // Too short
      expect(isValidUUID('123e4567-e89b-12d3-a456-4266141740000')).toBe(false); // Too long
      expect(isValidUUID('123e4567-e89b-12d3-g456-426614174000')).toBe(false); // Invalid character
    });

    it('should return false for UUIDs of wrong version', () => {
      // UUID v1 example
      expect(isValidUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidUUID(null as any)).toBe(false);
      expect(isValidUUID(undefined as any)).toBe(false);
      expect(isValidUUID(123 as any)).toBe(false);
      expect(isValidUUID({} as any)).toBe(false);
    });
  });

  describe('normalizeLinkedInUrl', () => {
    it('should normalize various LinkedIn profile URL formats', () => {
      expect(normalizeLinkedInUrl('https://www.linkedin.com/in/johndoe/')).toBe('https://www.linkedin.com/in/johndoe');
      expect(normalizeLinkedInUrl('https://linkedin.com/in/johndoe')).toBe('https://www.linkedin.com/in/johndoe');
      expect(normalizeLinkedInUrl('www.linkedin.com/in/johndoe/')).toBe('https://www.linkedin.com/in/johndoe');
      expect(normalizeLinkedInUrl('linkedin.com/in/johndoe')).toBe('https://www.linkedin.com/in/johndoe');
      expect(normalizeLinkedInUrl('https://www.linkedin.com/in/johndoe?trk=profile')).toBe('https://www.linkedin.com/in/johndoe');
    });

    it('should handle LinkedIn usernames without full URLs', () => {
      expect(normalizeLinkedInUrl('johndoe')).toBe('https://www.linkedin.com/in/johndoe');
      expect(normalizeLinkedInUrl('jane_doe123')).toBe('https://www.linkedin.com/in/jane_doe123');
    });

    it('should return null for invalid or non-LinkedIn URLs', () => {
      expect(normalizeLinkedInUrl('http://www.google.com')).toBeNull();
      expect(normalizeLinkedInUrl('invalid-url')).toBeNull();
      expect(normalizeLinkedInUrl('https://www.linkedin.com/feed/')).toBeNull(); // Not a profile URL
      expect(normalizeLinkedInUrl('https://www.linkedin.com/company/some-company')).toBeNull(); // Not a profile URL
      expect(normalizeLinkedInUrl(null as any)).toBeNull();
      expect(normalizeLinkedInUrl(undefined as any)).toBeNull();
    });
  });
});
