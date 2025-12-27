/**
 * Tests for project server actions
 * 
 * Note: These are unit tests that test the validation logic,
 * helper functions, and proper form data handling.
 */

import { projectFormSchema, ProjectFormData } from '@/lib/schemas/projects';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}));

describe('Project Server Actions', () => {
    describe('projectFormSchema validation', () => {
        it('should validate a complete project form', () => {
            const validData: ProjectFormData = {
                project_name: 'Test Campaign',
                client_name: 'Test Client',
                client_id: null,
                brand_id: null,
                project_types: ['photoshoot'],
                password: '',
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '09:00 AM',
                        endTime: '05:00 PM',
                    },
                ],
                default_model_fee: 500,
                default_fee_type: 'per_day',
                currency: 'GTQ',
            };

            const result = projectFormSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should require at least one project type', () => {
            const noTypes = {
                project_name: 'Test',
                project_types: [],
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '09:00 AM',
                        endTime: '05:00 PM',
                    },
                ],
            };

            const result = projectFormSchema.safeParse(noTypes);
            expect(result.success).toBe(false);
        });

        it('should limit project types to maximum 2', () => {
            const tooManyTypes = {
                project_types: ['photoshoot', 'tv_commercial', 'runway'],
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '09:00 AM',
                        endTime: '05:00 PM',
                    },
                ],
            };

            const result = projectFormSchema.safeParse(tooManyTypes);
            expect(result.success).toBe(false);
        });

        it('should require at least one schedule entry', () => {
            const noSchedule = {
                project_name: 'Test',
                project_types: ['photoshoot'],
                schedule: [],
            };

            const result = projectFormSchema.safeParse(noSchedule);
            expect(result.success).toBe(false);
        });

        it('should validate time format (12h)', () => {
            const invalidTime = {
                project_types: ['photoshoot'],
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '9:00', // Missing AM/PM
                        endTime: '17:00', // 24h format
                    },
                ],
            };

            const result = projectFormSchema.safeParse(invalidTime);
            expect(result.success).toBe(false);
        });

        it('should accept valid time formats', () => {
            const validTimes = {
                project_types: ['photoshoot'],
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '09:00 AM',
                        endTime: '05:00 PM',
                    },
                ],
            };

            const result = projectFormSchema.safeParse(validTimes);
            expect(result.success).toBe(true);
        });

        it('should reject when start and end times are equal', () => {
            const sameTime = {
                project_types: ['photoshoot'],
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '09:00 AM',
                        endTime: '09:00 AM',
                    },
                ],
            };

            const result = projectFormSchema.safeParse(sameTime);
            expect(result.success).toBe(false);
        });

        it('should validate password minimum length when provided', () => {
            const shortPassword = {
                project_types: ['photoshoot'],
                password: '123', // Less than 6 chars
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '09:00 AM',
                        endTime: '05:00 PM',
                    },
                ],
            };

            const result = projectFormSchema.safeParse(shortPassword);
            expect(result.success).toBe(false);
        });

        it('should allow empty password string', () => {
            const emptyPassword = {
                project_types: ['photoshoot'],
                password: '',
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '09:00 AM',
                        endTime: '05:00 PM',
                    },
                ],
            };

            const result = projectFormSchema.safeParse(emptyPassword);
            expect(result.success).toBe(true);
        });

        it('should validate currency enum', () => {
            const invalidCurrency = {
                project_types: ['photoshoot'],
                currency: 'INVALID',
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '09:00 AM',
                        endTime: '05:00 PM',
                    },
                ],
            };

            const result = projectFormSchema.safeParse(invalidCurrency);
            expect(result.success).toBe(false);
        });

        it('should accept all valid currencies', () => {
            const currencies = ['GTQ', 'USD', 'EUR', 'MXN', 'COP', 'PEN', 'ARS', 'CLP', 'BRL'];

            currencies.forEach(currency => {
                const data = {
                    project_types: ['photoshoot'],
                    currency,
                    schedule: [
                        {
                            date: '2025-01-15',
                            startTime: '09:00 AM',
                            endTime: '05:00 PM',
                        },
                    ],
                };

                const result = projectFormSchema.safeParse(data);
                expect(result.success).toBe(true);
            });
        });

        it('should validate fee_type enum', () => {
            const validFeeTypes = ['per_day', 'per_hour', 'fixed'];

            validFeeTypes.forEach(feeType => {
                const data = {
                    project_types: ['photoshoot'],
                    default_fee_type: feeType,
                    schedule: [
                        {
                            date: '2025-01-15',
                            startTime: '09:00 AM',
                            endTime: '05:00 PM',
                        },
                    ],
                };

                const result = projectFormSchema.safeParse(data);
                expect(result.success).toBe(true);
            });
        });

        it('should accept all valid project types', () => {
            const projectTypes = [
                'photoshoot',
                'tv_commercial',
                'ecommerce',
                'runway',
                'social_media',
                'cinema',
                'editorial',
                'music_video',
                'activation',
            ];

            projectTypes.forEach(type => {
                const data = {
                    project_types: [type],
                    schedule: [
                        {
                            date: '2025-01-15',
                            startTime: '09:00 AM',
                            endTime: '05:00 PM',
                        },
                    ],
                };

                const result = projectFormSchema.safeParse(data);
                expect(result.success).toBe(true);
            });
        });
    });

    describe('Schedule validation edge cases', () => {
        it('should allow overnight schedules (e.g., night shoots)', () => {
            // PM to AM is valid for night productions
            const nightShoot = {
                project_types: ['photoshoot'],
                schedule: [
                    {
                        date: '2025-01-15',
                        startTime: '08:00 PM',
                        endTime: '02:00 AM', // Next day
                    },
                ],
            };

            const result = projectFormSchema.safeParse(nightShoot);
            // This should pass based on the schema comment about midnight crossing
            expect(result.success).toBe(true);
        });
    });
});
