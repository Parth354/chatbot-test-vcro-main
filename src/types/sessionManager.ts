// Session management utilities for chatbot
export class SessionManager {
  private static readonly SESSION_COOKIE_NAME = 'chatbot_session';
  private static readonly SESSION_EXPIRY_DAYS = 30;

  static getSessionId(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    const sessionCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${this.SESSION_COOKIE_NAME}=`)
    );
    
    return sessionCookie ? sessionCookie.split('=')[1].trim() : null;
  }

  static setSessionId(sessionId: string): void {
    if (typeof document === 'undefined') return;
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.SESSION_EXPIRY_DAYS);
    
    document.cookie = `${this.SESSION_COOKIE_NAME}=${sessionId}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  }

  static clearSession(): void {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${this.SESSION_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  }

  static generateSessionId(): string {
    // Generate a proper UUID format
    return crypto.randomUUID();
  }

  static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  static convertLegacySessionId(legacyId: string): string {
    // If it's already a UUID, return as is
    if (this.isValidUUID(legacyId)) {
      return legacyId;
    }
    // Convert legacy session ID to UUID format
    return this.generateSessionId();
  }

  // Aliases for cookie-based methods
  static setSessionCookie(sessionId: string): void {
    this.setSessionId(sessionId);
  }

  static getSessionCookie(): string | null {
    return this.getSessionId();
  }
}