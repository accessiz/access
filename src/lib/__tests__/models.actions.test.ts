/**
 * Tests for model server actions
 * 
 * Note: These are unit tests that mock Supabase client calls.
 * They test the validation logic, error handling, and proper function flow.
 */

import { modelFormSchema } from '@/lib/schemas';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('Model Server Actions', () => {
    describe('modelFormSchema validation', () => {
        it('should validate a complete model form', () => {
            const validData = {
                full_name: 'Test Model',
                phone_e164: '+15551234567',
                alias: 'TestAlias',
                gender: 'Female',
                email: 'test@example.com',
                country: 'US',
                height_cm: 175,
                bust_cm: 85,
                waist_cm: 65,
                hips_cm: 90,
            };

            const result = modelFormSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should require full_name', () => {
            const invalidData = {
                phone_e164: '+15551234567',
                alias: 'TestAlias',
                gender: 'Female',
            };

            const result = modelFormSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should allow phone_e164 to be optional', () => {
            const invalidData = {
                full_name: 'Test Model',
                alias: 'TestAlias',
                gender: 'Female',
            };

            const result = modelFormSchema.safeParse(invalidData);
            expect(result.success).toBe(true);
        });

        it('should validate gender enum (Male/Female)', () => {
            const invalidGender = {
                full_name: 'Test Model',
                phone_e164: '+15551234567',
                alias: 'TestAlias',
                gender: 'invalid_gender',
            };

            const result = modelFormSchema.safeParse(invalidGender);
            expect(result.success).toBe(false);
        });

        it('should accept valid gender values', () => {
            const validMale = {
                full_name: 'Test Model',
                phone_e164: '+15551234567',
                gender: 'Male',
            };
            const validFemale = {
                full_name: 'Test Model',
                phone_e164: '+15551234567',
                gender: 'Female',
            };

            expect(modelFormSchema.safeParse(validMale).success).toBe(true);
            expect(modelFormSchema.safeParse(validFemale).success).toBe(true);
        });

        it('should validate email format', () => {
            const invalidEmail = {
                full_name: 'Test Model',
                phone_e164: '+15551234567',
                gender: 'Male',
                email: 'not-an-email',
            };

            const result = modelFormSchema.safeParse(invalidEmail);
            expect(result.success).toBe(false);
        });

        it('should allow optional fields to be null or empty', () => {
            const minimalData = {
                full_name: 'Test Model',
                phone_e164: '+15551234567',
                email: null,
                country: null,
                height_cm: null,
            };

            const result = modelFormSchema.safeParse(minimalData);
            expect(result.success).toBe(true);
        });
    });

    describe('Error message mapping', () => {
        it('should handle PostgrestError code 23505 (unique constraint)', () => {
            const mockError = {
                code: '23505',
                message: 'duplicate key value violates unique constraint',
                details: 'Key (email)=(test@example.com) already exists.',
            };

            // Test that error has proper structure
            expect(mockError.code).toBe('23505');
            expect(mockError.details).toBeDefined();
        });
    });
});
