import { useEffect } from 'react';

export function SecurityHeaders() {
  useEffect(() => {
    // Set security headers via meta tags (for client-side)
    const setMetaTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Content Security Policy
    setMetaTag('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self' https:; " +
      "font-src 'self' data:; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self';"
    );

    // Other security headers
    setMetaTag('X-Frame-Options', 'DENY');
    setMetaTag('X-Content-Type-Options', 'nosniff');
    setMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');
    setMetaTag('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=()'
    );
  }, []);

  return null;
}
