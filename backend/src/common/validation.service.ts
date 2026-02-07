import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidationService {
  validateInput(
    type: 'email' | 'password' | 'url' | 'text',
    value: string,
  ): { valid: boolean; error: string | null } {
    switch (type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          valid: emailRegex.test(value) && value.length <= 254,
          error:
            !emailRegex.test(value)
              ? 'Invalid email format'
              : value.length > 254
              ? 'Email too long'
              : null,
        };

      case 'password':
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        const minLength = value.length >= 8;
        const maxLength = value.length <= 128;

        const valid =
          hasUpper && hasLower && hasNumber && hasSpecial && minLength && maxLength;
        return {
          valid,
          error: !valid
            ? 'Password must be 8-128 chars with uppercase, lowercase, number, and special character'
            : null,
        };

      case 'url':
        try {
          const url = new URL(value);
          const validProtocols = ['http:', 'https:'];
          const urlValid =
            validProtocols.includes(url.protocol) && value.length <= 2048;
          return {
            valid: urlValid,
            error: !urlValid ? 'Invalid URL or URL too long' : null,
          };
        } catch {
          return { valid: false, error: 'Invalid URL format' };
        }

      case 'text':
        const hasScript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(
          value,
        );
        const hasOnEvent = /\bon\w+\s*=/gi.test(value);
        const hasJavascript = /javascript:/gi.test(value);
        const validLength = value.length <= 10000;

        const textValid =
          !hasScript && !hasOnEvent && !hasJavascript && validLength;
        return {
          valid: textValid,
          error: !textValid ? 'Text contains invalid content or is too long' : null,
        };

      default:
        return { valid: false, error: 'Unknown validation type' };
    }
  }

  sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
}
