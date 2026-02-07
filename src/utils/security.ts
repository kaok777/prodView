export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
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
    const session = localStorage.getItem("adminSession");
    if (!session) return null;
    
    const parsed = JSON.parse(session);
    if (parsed && parsed.adminId && parsed.email && parsed.role) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  localStorage.removeItem("adminSession");
}

export function setAdminSession(session: AdminSession): void {
  localStorage.setItem("adminSession", JSON.stringify(session));
}
