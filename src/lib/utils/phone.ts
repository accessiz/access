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

// Complete list of all country calling codes sorted by length descending to avoid false matches
export const ALL_COUNTRY_CODES = [
  // 3-digit codes (4 characters with '+')
  '+211', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', '+225', '+226', '+227', '+228', '+229',
  '+230', '+231', '+232', '+233', '+234', '+235', '+236', '+237', '+238', '+239', '+240', '+241', '+242', '+243', '+244',
  '+245', '+246', '+248', '+249', '+250', '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261',
  '+262', '+263', '+264', '+265', '+266', '+267', '+268', '+269', '+290', '+291', '+297', '+298', '+299', '+350', '+351',
  '+352', '+353', '+354', '+355', '+356', '+357', '+358', '+359', '+370', '+371', '+372', '+373', '+374', '+375', '+376',
  '+377', '+378', '+380', '+381', '+382', '+383', '+385', '+386', '+387', '+389', '+420', '+421', '+423', '+500', '+501',
  '+502', '+503', '+504', '+505', '+506', '+507', '+508', '+509', '+590', '+591', '+592', '+593', '+594', '+595', '+596',
  '+597', '+598', '+599', '+670', '+672', '+673', '+674', '+675', '+676', '+677', '+678', '+679', '+680', '+681', '+682',
  '+683', '+685', '+686', '+687', '+688', '+689', '+690', '+691', '+692', '+850', '+852', '+853', '+855', '+856', '+880',
  '+886', '+960', '+961', '+962', '+963', '+964', '+965', '+966', '+967', '+968', '+970', '+971', '+972', '+973', '+974',
  '+975', '+976', '+977', '+992', '+993', '+994', '+995', '+996', '+998',
  
  // 2-digit codes (3 characters with '+')
  '+20', '+27', '+30', '+31', '+32', '+33', '+34', '+36', '+39', '+40', '+41', '+43', '+44', '+45', '+46', '+47', '+48',
  '+49', '+51', '+52', '+53', '+54', '+55', '+56', '+57', '+58', '+60', '+61', '+62', '+63', '+64', '+65', '+66', '+81',
  '+82', '+84', '+86', '+90', '+91', '+92', '+93', '+94', '+95', '+98',
  
  // 1-digit codes (2 characters with '+')
  '+1', '+7'
];

/**
 * Extracts the country calling code prefix (e.g., +502, +33, +1) from a normalized phone number.
 */
export function getPhonePrefix(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const clean = phone.trim();
  if (!clean.startsWith('+')) return null;

  for (const prefix of ALL_COUNTRY_CODES) {
    if (clean.startsWith(prefix)) {
      return prefix;
    }
  }

  // Fallback to extracting the first few digits if it doesn't match
  const match = clean.match(/^\+(\d{1,4})/);
  if (match) {
    return '+' + match[1];
  }

  return null;
}
