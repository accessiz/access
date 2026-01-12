import { MAX_UPLOAD_BYTES } from '@/lib/constants';
import { countryValues } from '@/lib/countries';

describe('lib constants and static lists', () => {
  test('MAX_UPLOAD_BYTES is roughly 5MB', () => {
    expect(MAX_UPLOAD_BYTES).toBeGreaterThan(4 * 1024 * 1024);
    expect(MAX_UPLOAD_BYTES).toBeLessThanOrEqual(6 * 1024 * 1024);
  });

  test('countries export has entries', () => {
    expect(Array.isArray(countryValues)).toBe(true);
    expect(countryValues.length).toBeGreaterThan(50);
  });
});
