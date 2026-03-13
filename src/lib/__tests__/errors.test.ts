/**
 * Tests for src/lib/utils/errors.ts — makeError, logError, logInfo
 */
import { makeError, logError, logInfo } from '@/lib/utils/errors';

describe('makeError', () => {
  it('creates error object with message', () => {
    const err = makeError('Something failed');
    expect(err).toEqual({ message: 'Something failed', code: undefined });
  });

  it('creates error object with message and code', () => {
    const err = makeError('Not found', '404');
    expect(err).toEqual({ message: 'Not found', code: '404' });
  });
});

describe('logError', () => {
  it('logs errors without throwing', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => logError(new Error('test error'))).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('handles string errors', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(() => logError('plain string error')).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('includes context in log output', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation();
    logError(new Error('contextual'), { action: 'test', userId: '123' });
    const logged = spy.mock.calls[0][0];
    expect(logged).toContain('contextual');
    expect(logged).toContain('test');
    spy.mockRestore();
  });
});

describe('logInfo', () => {
  it('logs info without throwing', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    expect(() => logInfo('info message')).not.toThrow();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('includes context in log output', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    logInfo('operation complete', { duration: 150 });
    const logged = spy.mock.calls[0][0];
    expect(logged).toContain('operation complete');
    expect(logged).toContain('150');
    spy.mockRestore();
  });
});
