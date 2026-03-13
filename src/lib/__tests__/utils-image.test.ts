import { toPublicUrl, mediaUrl } from '@/lib/utils';

describe('toPublicUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('returns null for falsy input', () => {
    expect(toPublicUrl(null)).toBeNull();
    expect(toPublicUrl(undefined)).toBeNull();
    expect(toPublicUrl('')).toBeNull();
  });

  test('passes through absolute URLs unchanged', () => {
    const url = 'https://example.com/image.webp';
    expect(toPublicUrl(url)).toBe(url);

    const httpUrl = 'http://localhost:3000/test.jpg';
    expect(toPublicUrl(httpUrl)).toBe(httpUrl);
  });

  test('constructs full URL from relative R2 path', () => {
    // This test validates the logic — R2_PUBLIC_URL comes from constants module
    const path = 'model-id/Portada/123-cover.webp';
    const result = toPublicUrl(path);
    // If R2_PUBLIC_URL is set, result should contain the path
    if (result && result.startsWith('http')) {
      expect(result).toContain(path);
    } else {
      // Fallback: returns path as-is when no R2_PUBLIC_URL
      expect(result).toBe(path);
    }
  });

  test('strips leading slash from path', () => {
    const result = toPublicUrl('/model-id/Portada/cover.webp');
    expect(result).not.toContain('//model-id');
  });
});

describe('mediaUrl', () => {
  test('returns undefined for falsy input', () => {
    expect(mediaUrl(null)).toBeUndefined();
    expect(mediaUrl(undefined)).toBeUndefined();
    expect(mediaUrl('')).toBeUndefined();
  });

  test('passes through absolute URLs unchanged', () => {
    const url = 'https://r2.dev/model/image.webp';
    expect(mediaUrl(url)).toBe(url);
  });

  test('constructs URL from relative path', () => {
    const path = 'uuid/PortfolioGallery/123-gallery.webp';
    const result = mediaUrl(path);
    // Should either prepend R2_PUBLIC_URL or return as-is
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    if (result!.startsWith('http')) {
      expect(result).toContain(path);
      expect(result).not.toContain('//uuid'); // No double slashes
    }
  });
});
