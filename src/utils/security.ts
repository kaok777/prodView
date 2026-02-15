import DOMPurify from 'dompurify';
import { StorageService, StorageKeys } from '../services/StorageService';

/**
 * Sanitize user input to prevent XSS attacks
 * Uses DOMPurify library for robust sanitization instead of regex
 *
 * @param input - The string to sanitize
 * @param allowedTags - Optional array of allowed HTML tags (default: none)
 * @returns Sanitized string safe for rendering
 */
export const sanitizeInput = (input: string, allowedTags: string[] = []): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Configure DOMPurify with strict settings
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: [], // No attributes allowed by default
    KEEP_CONTENT: true, // Keep text content even if tags are removed
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false,
  };

  // Sanitize and trim
  return DOMPurify.sanitize(input, config).trim();
};

/**
 * Sanitize HTML content allowing specific safe tags
 * Use this when you need to preserve some HTML formatting
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML safe for rendering
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Allow only safe formatting tags
  const config: DOMPurify.Config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  };

  return DOMPurify.sanitize(html, config);
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const getClientInfo = () => {
  return {
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    // Note: Real IP would come from server-side headers in production
    ip: undefined
  };
};

export const rateLimitError = (resetTime: number) => {
  const resetDate = new Date(resetTime);
  return `Rate limit exceeded. Try again after ${resetDate.toLocaleTimeString()}`;
};

interface AdminSession {
  adminId: string;
  email: string;
  role: string;
}

export function getAdminSession(): AdminSession | null {
  try {
    const session = StorageService.get<AdminSession>(StorageKeys.ADMIN_SESSION);
    if (!session) return null;

    // Validate session structure
    if (session && session.adminId && session.email && session.role) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  StorageService.remove(StorageKeys.ADMIN_SESSION);
  // Note: Actual logout should call /auth/logout to clear httpOnly cookies
}

export function setAdminSession(session: AdminSession): void {
  StorageService.set(StorageKeys.ADMIN_SESSION, session);
}
