/**
 * Utility functions for parsing, cleaning, and normalizing phone numbers.
 * Enforces international E.164 format (e.g. +50212345678).
 */

/**
 * Cleans and normalizes a phone number.
 * - Strips whitespace, hyphens, dots, and parentheses.
 * - If the number is exactly 8 digits and has no country code, defaults to Guatemala (+502).
 * - Enforces a leading '+' symbol.
 * - Returns the E.164 string if valid, otherwise returns null.
 */
export function cleanAndNormalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // 1. Strip spaces, hyphens, parentheses, dots
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned === '' || cleaned === '+') return null;

  // 2. If it doesn't start with '+', process prefix logic
  if (!cleaned.startsWith('+')) {
    // If it's exactly 8 digits (standard GT mobile length), auto-prepend Guatemala's +502 prefix
    if (/^\d{8}$/.test(cleaned)) {
      cleaned = '+502' + cleaned;
    } else {
      // Otherwise, just prepend the '+'
      cleaned = '+' + cleaned;
    }
  }

  // 3. Validate against E.164 format: a '+' followed by 7 to 15 digits
  const phoneRegex = /^\+\d{7,15}$/;
  if (phoneRegex.test(cleaned)) {
    return cleaned;
  }

  return null;
}
