/**
 * Tests for src/lib/utils/fetchSafe.ts — fetchSafe
 */
import { fetchSafe } from '@/lib/utils/fetchSafe';

// Save original fetch
const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchSafe', () => {
  it('returns ok: true with json on successful response', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'hello' }),
    });

    const result = await fetchSafe<{ data: string }>('https://api.example.com/test');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.json).toEqual({ data: 'hello' });
    expect(result.error).toBeUndefined();
  });

  it('returns ok: false with error message on 4xx', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    });

    const result = await fetchSafe('https://api.example.com/missing');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error).toBe('Not found');
  });

  it('extracts "message" field from error body', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ message: 'Validation failed' }),
    });

    const result = await fetchSafe('https://api.example.com/validate');
    expect(result.ok).toBe(false);
    expect(result.error).toBe('Validation failed');
  });

  it('falls back to status message when body has no error field', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ detail: 'some detail' }),
    });

    const result = await fetchSafe('https://api.example.com/fail');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('500');
  });

  it('handles non-JSON response gracefully', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.reject(new Error('not JSON')),
    });

    const result = await fetchSafe('https://api.example.com/html');
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.json).toBeNull();
  });

  it('handles network error (fetch throws)', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchSafe('https://api.example.com/down');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.json).toBeNull();
    expect(result.error).toBe('Network error');
  });

  it('handles non-Error thrown (string)', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue('Connection refused');

    const result = await fetchSafe('https://api.example.com/refused');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(0);
    expect(result.error).toBe('Connection refused');
  });

  it('passes RequestInit options to fetch', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ id: 1 }),
    });
    globalThis.fetch = mockFetch;

    await fetchSafe('https://api.example.com/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/create',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
});
