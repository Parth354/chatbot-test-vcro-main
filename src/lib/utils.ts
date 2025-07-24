import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isValidUUID(uuid: string): boolean {
  const uuidV4Regex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidV4Regex.test(uuid);
}

export function normalizeLinkedInUrl(url: string): string | null {
  if (!url) {
    return null;
  }

  let processedUrl = url.trim();

  // Add https:// if no protocol is present for URL parsing
  if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
    processedUrl = `https://${processedUrl}`;
  }

  let urlObj: URL;
  try {
    urlObj = new URL(processedUrl);
  } catch (e) {
    return null; // Not a valid URL
  }

  // Check if it's a LinkedIn domain
  if (!urlObj.hostname.includes('linkedin.com')) {
    return null;
  }

  const pathParts = urlObj.pathname.split('/').filter(Boolean);

  // Check for the '/in/' path segment and a subsequent profile identifier
  if (pathParts[0] === 'in' && pathParts[1]) {
    // A simple check for valid LinkedIn profile identifiers (alphanumeric, hyphens, underscores)
    const profileId = pathParts[1].split('?')[0].split('/')[0];
    if (/^[a-zA-Z0-9_-]+$/.test(profileId)) {
      return `https://www.linkedin.com/in/${profileId}`;
    }
  }

  return null;
}



