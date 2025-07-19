import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(uuid);
}

export function normalizeLinkedInUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('linkedin.com')) {
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'in' && pathParts[1]) {
        return `https://www.linkedin.com/in/${pathParts[1].split('?')[0].split('/')[0]}`;
      }
    }
  } catch (e) {
    // Invalid URL
  }
  // If it's not a valid URL but looks like a username
  if (!url.includes('/') && !url.includes('.')) {
    return `https://www.linkedin.com/in/${url}`;
  }
  return null;
}



