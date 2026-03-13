/**
 * Tests for src/lib/error-tracking.ts — captureException, captureMessage, setUser
 */
import { captureException, captureMessage, setUser } from '@/lib/error-tracking';

describe('captureException', () => {
  it('logs Error instances without throwing', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => captureException(new Error('test'))).not.toThrow();
    expect(spy).toHaveBeenCalled();
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.msg).toBe('test');
    spy.mockRestore();
  });

  it('logs string errors', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    captureException('plain string');
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.msg).toBe('plain string');
    spy.mockRestore();
  });

  it('includes tags and extra in output', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    captureException(new Error('tagged'), {
      tags: { boundary: 'global' },
      extra: { digest: 'abc123' },
    });
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.tags).toEqual({ boundary: 'global' });
    expect(logged.extra).toEqual({ digest: 'abc123' });
    spy.mockRestore();
  });

  it('handles PostgrestError-like objects', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    captureException({ message: 'DB error', code: '42P01', details: 'relation does not exist' });
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.msg).toBe('DB error');
    expect(logged.code).toBe('42P01');
    spy.mockRestore();
  });
});

describe('captureMessage', () => {
  it('logs info-level messages', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    captureMessage('deploy started');
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.msg).toBe('deploy started');
    expect(logged.level).toBe('info');
    spy.mockRestore();
  });

  it('logs warning-level messages', () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    captureMessage('rate limit near', { level: 'warning' });
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.msg).toBe('rate limit near');
    spy.mockRestore();
  });

  it('logs error-level messages', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    captureMessage('critical failure', { level: 'error' });
    const logged = JSON.parse(spy.mock.calls[0][0]);
    expect(logged.msg).toBe('critical failure');
    spy.mockRestore();
  });

  it('logs fatal-level messages via error', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    captureMessage('system crash', { level: 'fatal' });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('setUser', () => {
  it('logs user context set without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    expect(() => setUser({ id: 'user-123', email: 'test@example.com' })).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('handles null (logout) without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    expect(() => setUser(null)).not.toThrow();
    spy.mockRestore();
  });
});
