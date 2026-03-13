/**
 * Tests for src/lib/schemas.ts — modelFormSchema
 *
 * Validates Zod preprocessing: emptyToNull, phone E.164 cleaning,
 * US shoe sizes, name regex, optional fields, default values.
 */
import { modelFormSchema } from '@/lib/schemas';

/** Helper: minimal valid model data */
const validModel = {
  full_name: 'Ana María López',
  alias: 'Ana López',
  status: 'active',
};

describe('modelFormSchema', () => {
  // ── Required fields ──

  describe('required fields', () => {
    it('accepts valid minimal data', () => {
      const result = modelFormSchema.safeParse(validModel);
      expect(result.success).toBe(true);
    });

    it('rejects empty full_name', () => {
      const result = modelFormSchema.safeParse({ ...validModel, full_name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects short full_name (< 3 chars)', () => {
      const result = modelFormSchema.safeParse({ ...validModel, full_name: 'AB' });
      expect(result.success).toBe(false);
    });

    it('rejects short alias (< 2 chars)', () => {
      const result = modelFormSchema.safeParse({ ...validModel, alias: 'A' });
      expect(result.success).toBe(false);
    });

    it('rejects alias with numbers', () => {
      const result = modelFormSchema.safeParse({ ...validModel, alias: 'Ana123' });
      expect(result.success).toBe(false);
    });

    it('accepts alias with accented characters', () => {
      const result = modelFormSchema.safeParse({ ...validModel, alias: "María José O'Brien" });
      expect(result.success).toBe(true);
    });
  });

  // ── Status field ──

  describe('status', () => {
    it('defaults to active when not provided', () => {
      const { full_name, alias } = validModel;
      const result = modelFormSchema.safeParse({ full_name, alias });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
      }
    });

    it('accepts valid statuses', () => {
      for (const status of ['active', 'inactive', 'archived']) {
        const result = modelFormSchema.safeParse({ ...validModel, status });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid status', () => {
      const result = modelFormSchema.safeParse({ ...validModel, status: 'deleted' });
      expect(result.success).toBe(false);
    });
  });

  // ── Phone preprocessing ──

  describe('phone_e164', () => {
    it('accepts valid E.164 phone', () => {
      const result = modelFormSchema.safeParse({ ...validModel, phone_e164: '+50212345678' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.phone_e164).toBe('+50212345678');
    });

    it('cleans formatting characters (spaces, dashes, parens)', () => {
      const result = modelFormSchema.safeParse({ ...validModel, phone_e164: '+502 1234-5678' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.phone_e164).toBe('+50212345678');
    });

    it('converts null to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, phone_e164: null });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.phone_e164).toBeNull();
    });

    it('converts undefined to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, phone_e164: undefined });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.phone_e164).toBeNull();
    });

    it('rejects phone without + prefix after cleaning', () => {
      const result = modelFormSchema.safeParse({ ...validModel, phone_e164: '50212345678' });
      expect(result.success).toBe(false);
    });

    it('converts "+" alone to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, phone_e164: '+' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.phone_e164).toBeNull();
    });
  });

  // ── Email ──

  describe('email', () => {
    it('accepts valid email', () => {
      const result = modelFormSchema.safeParse({ ...validModel, email: 'ana@example.com' });
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const result = modelFormSchema.safeParse({ ...validModel, email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('converts empty string to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, email: '' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBeNull();
    });

    it('trims whitespace', () => {
      const result = modelFormSchema.safeParse({ ...validModel, email: '  ana@example.com  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.email).toBe('ana@example.com');
    });
  });

  // ── Optional measurement fields ──

  describe('optional positive numbers', () => {
    it('accepts valid height', () => {
      const result = modelFormSchema.safeParse({ ...validModel, height_cm: 175 });
      expect(result.success).toBe(true);
    });

    it('converts empty string to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, height_cm: '' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.height_cm).toBeNull();
    });

    it('coerces string numbers', () => {
      const result = modelFormSchema.safeParse({ ...validModel, height_cm: '175' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.height_cm).toBe(175);
    });

    it('rejects negative numbers', () => {
      const result = modelFormSchema.safeParse({ ...validModel, height_cm: -5 });
      expect(result.success).toBe(false);
    });
  });

  // ── Shoe size (US) ──

  describe('shoe_size_us', () => {
    it('accepts valid US sizes', () => {
      for (const size of [5, 7.5, 10, 12.5]) {
        const result = modelFormSchema.safeParse({ ...validModel, shoe_size_us: size });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid US sizes (e.g. 2, 16)', () => {
      const result = modelFormSchema.safeParse({ ...validModel, shoe_size_us: 2 });
      expect(result.success).toBe(false);
    });

    it('converts empty string to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, shoe_size_us: '' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.shoe_size_us).toBeNull();
    });

    it('normalizes string "8" to number 8.0', () => {
      const result = modelFormSchema.safeParse({ ...validModel, shoe_size_us: '8' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.shoe_size_us).toBe(8);
    });
  });

  // ── Gender enum ──

  describe('gender', () => {
    it('accepts Male and Female', () => {
      for (const gender of ['Male', 'Female']) {
        const result = modelFormSchema.safeParse({ ...validModel, gender });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid gender', () => {
      const result = modelFormSchema.safeParse({ ...validModel, gender: 'Other' });
      expect(result.success).toBe(false);
    });

    it('converts empty string to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, gender: '' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.gender).toBeNull();
    });
  });

  // ── Optional string fields ──

  describe('optional strings', () => {
    it('trims and nulls empty strings', () => {
      const result = modelFormSchema.safeParse({
        ...validModel,
        national_id: '  ',
        passport_number: '',
        instagram: null,
        tiktok: undefined,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.national_id).toBeNull();
        expect(result.data.passport_number).toBeNull();
        expect(result.data.instagram).toBeNull();
        expect(result.data.tiktok).toBeNull();
      }
    });
  });

  // ── Pants size preprocessing ──

  describe('pants_size', () => {
    it('accepts a valid numeric pants size', () => {
      const result = modelFormSchema.safeParse({ ...validModel, pants_size: 32 });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.pants_size).toBe(32);
    });

    it('coerces string to number', () => {
      const result = modelFormSchema.safeParse({ ...validModel, pants_size: '28' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.pants_size).toBe(28);
    });

    it('converts empty string to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, pants_size: '' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.pants_size).toBeNull();
    });

    it('converts null to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, pants_size: null });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.pants_size).toBeNull();
    });

    it('converts undefined to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, pants_size: undefined });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.pants_size).toBeNull();
    });

    it('converts NaN string to null', () => {
      const result = modelFormSchema.safeParse({ ...validModel, pants_size: 'abc' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.pants_size).toBeNull();
    });

    it('passes through non-string, non-null values', () => {
      // e.g. boolean — the zod number validator will reject this
      const result = modelFormSchema.safeParse({ ...validModel, pants_size: true });
      expect(result.success).toBe(false);
    });
  });

  // ── Phone non-string path ──

  describe('phone_e164 edge cases', () => {
    it('passes through non-string, non-null values to validator', () => {
      // Passing a number should go through the passthrough path
      const result = modelFormSchema.safeParse({ ...validModel, phone_e164: 12345 });
      expect(result.success).toBe(false);
    });

    it('converts empty string after cleaning to null', () => {
      // Only spaces and dashes → cleaned to empty → null
      const result = modelFormSchema.safeParse({ ...validModel, phone_e164: '  -  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.phone_e164).toBeNull();
    });
  });
});
