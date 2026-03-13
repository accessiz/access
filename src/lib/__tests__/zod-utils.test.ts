/**
 * Tests for src/lib/utils/zod.ts — zodErrorToFieldErrors
 */
import { ZodError } from 'zod';
import { zodErrorToFieldErrors } from '@/lib/utils/zod';

function makeZodError(issues: { path: (string | number)[]; message: string }[]): ZodError {
  return new ZodError(
    issues.map(({ path, message }) => ({
      code: 'custom',
      path,
      message,
    }))
  );
}

describe('zodErrorToFieldErrors', () => {
  it('converts a single field error', () => {
    const err = makeZodError([{ path: ['email'], message: 'Required' }]);
    expect(zodErrorToFieldErrors(err)).toEqual({ email: 'Required' });
  });

  it('keeps first error per field when multiple', () => {
    const err = makeZodError([
      { path: ['name'], message: 'Too short' },
      { path: ['name'], message: 'Required' },
    ]);
    const result = zodErrorToFieldErrors(err);
    expect(result.name).toBe('Too short');
  });

  it('handles multiple fields', () => {
    const err = makeZodError([
      { path: ['name'], message: 'Required' },
      { path: ['email'], message: 'Invalid' },
      { path: ['age'], message: 'Must be positive' },
    ]);
    const result = zodErrorToFieldErrors(err);
    expect(Object.keys(result)).toHaveLength(3);
    expect(result.name).toBe('Required');
    expect(result.email).toBe('Invalid');
    expect(result.age).toBe('Must be positive');
  });

  it('returns empty object for no field errors', () => {
    // ZodError with only form-level errors (empty path) → no field errors
    const err = makeZodError([{ path: [], message: 'Form invalid' }]);
    const result = zodErrorToFieldErrors(err);
    expect(Object.keys(result)).toHaveLength(0);
  });
});
