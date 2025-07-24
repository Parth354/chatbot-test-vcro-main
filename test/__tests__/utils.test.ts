import { describe, it, expect } from 'vitest';
import { cn, isValidUUID, normalizeLinkedInUrl } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('should handle conditional classes', () => {
      expect(cn('a', true && 'b', false && 'c')).toBe('a b');
    });

    it('should handle duplicate classes', () => {
      expect(cn('a', 'b', 'a')).toBe('a b a');
    });

    it('should handle different types of inputs', () => {
      expect(cn('a', { b: true, c: false }, ['d', { e: true }])).toBe('a b d e');
    });

    it('should handle conflicting classes with tailwind-merge', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });
  });

  describe('isValidUUID', () => {
    it('should return true for a valid v4 UUID', () => {
      expect(isValidUUID('f81d4fae-7dec-41d5-927d-1b2c5ea7a7d8')).toBe(true);
    });

    it('should return false for an invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('should return false for a non-v4 UUID', () => {
      // v1 UUID
      expect(isValidUUID('a8a6d540-0e7a-11ef-9262-633747705345')).toBe(false);
    });

    it('should return false for a UUID with incorrect structure', () => {
      expect(isValidUUID('f81d4fae-7dec-41d5-927d-1b2c5ea7a7d')).toBe(false);
    });
  });

  describe('normalizeLinkedInUrl', () => {
    it('should return a normalized LinkedIn URL for a valid URL', () => {
      const url = 'https://www.linkedin.com/in/johndoe';
      expect(normalizeLinkedInUrl(url)).toBe(url);
    });

    it('should return a normalized LinkedIn URL for a URL with extra path segments', () => {
      const url = 'https://www.linkedin.com/in/johndoe/details/experience/';
      expect(normalizeLinkedInUrl(url)).toBe('https://www.linkedin.com/in/johndoe');
    });

    it('should return a normalized LinkedIn URL for a URL with a query string', () => {
      const url = 'https://www.linkedin.com/in/johndoe?trackingId=12345';
      expect(normalizeLinkedInUrl(url)).toBe('https://www.linkedin.com/in/johndoe');
    });

    it('should return a normalized LinkedIn URL for a URL without a protocol', () => {
      const url = 'www.linkedin.com/in/johndoe';
      expect(normalizeLinkedInUrl(url)).toBe('https://www.linkedin.com/in/johndoe');
    });

    it('should return null for an invalid URL', () => {
      const url = 'not a url';
      expect(normalizeLinkedInUrl(url)).toBeNull();
    });

    it('should return null for a non-LinkedIn URL', () => {
      const url = 'https://www.google.com';
      expect(normalizeLinkedInUrl(url)).toBeNull();
    });

    it('should return null for a LinkedIn URL that is not a profile page', () => {
      const url = 'https://www.linkedin.com/company/google';
      expect(normalizeLinkedInUrl(url)).toBeNull();
    });
  });
});