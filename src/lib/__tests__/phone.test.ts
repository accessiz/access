import { cleanAndNormalizePhone, getPhonePrefix } from '../utils/phone';

describe('Phone Utilities and ITU-T E.164 Standards', () => {
  describe('cleanAndNormalizePhone', () => {
    it('normalizes standard Guatemala 8-digit numbers without prefix by auto-prepending +502', () => {
      expect(cleanAndNormalizePhone('12345678')).toBe('+50212345678');
      expect(cleanAndNormalizePhone('4738-8666')).toBe('+50247388666');
      expect(cleanAndNormalizePhone('(502) 1234-5678')).toBe('+50212345678');
    });

    it('handles German 11-digit mobile numbers like +4917662726177 correctly', () => {
      const germanMobile = '+49 176 6272 6177';
      expect(cleanAndNormalizePhone(germanMobile)).toBe('+4917662726177');
      expect(cleanAndNormalizePhone('+4917662726177')).toBe('+4917662726177');
    });

    it('handles German 10-digit mobile numbers correctly', () => {
      expect(cleanAndNormalizePhone('+49 171 1234567')).toBe('+491711234567');
    });

    it('handles US and Mexican 10-digit phone numbers', () => {
      expect(cleanAndNormalizePhone('+1 (555) 234-5678')).toBe('+15552345678');
      expect(cleanAndNormalizePhone('+52 55 1234 5678')).toBe('+525512345678');
    });

    it('handles Brazilian 11-digit mobile numbers', () => {
      expect(cleanAndNormalizePhone('+55 (11) 98765-4321')).toBe('+5511987654321');
    });

    it('respects the maximum ITU-T E.164 international length (15 digits total excluding +)', () => {
      // 15 digits total
      const maxE164 = '+123456789012345';
      expect(cleanAndNormalizePhone(maxE164)).toBe('+123456789012345');

      // 16 digits total should be invalid under E.164
      const overE164 = '+1234567890123456';
      expect(cleanAndNormalizePhone(overE164)).toBeNull();
    });

    it('returns null for empty or invalid inputs', () => {
      expect(cleanAndNormalizePhone('')).toBeNull();
      expect(cleanAndNormalizePhone(null)).toBeNull();
      expect(cleanAndNormalizePhone(undefined)).toBeNull();
      expect(cleanAndNormalizePhone('+')).toBeNull();
      expect(cleanAndNormalizePhone('123')).toBeNull(); // Less than minimum 7 digits
    });
  });

  describe('getPhonePrefix', () => {
    it('correctly extracts prefixes from various country formats', () => {
      expect(getPhonePrefix('+50212345678')).toBe('+502');
      expect(getPhonePrefix('+4917662726177')).toBe('+49');
      expect(getPhonePrefix('+15552345678')).toBe('+1');
      expect(getPhonePrefix('+525512345678')).toBe('+52');
      expect(getPhonePrefix('+37061234567')).toBe('+370');
      expect(getPhonePrefix('+33612345678')).toBe('+33');
      expect(getPhonePrefix('+447123456789')).toBe('+44');
    });

    it('returns null for non-prefixed or null inputs', () => {
      expect(getPhonePrefix(null)).toBeNull();
      expect(getPhonePrefix(undefined)).toBeNull();
      expect(getPhonePrefix('12345678')).toBeNull();
    });
  });
});
