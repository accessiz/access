/**
 * Integration tests for src/lib/actions/storage.ts
 *
 * These tests mock the external dependencies (R2/S3, Supabase, Next.js)
 * and verify the complete upload/delete/cleanup flows end-to-end.
 */

// ─── Mock setup (must be before imports) ───

const mockR2Send = jest.fn();
const mockSupabaseUpdate = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseSingle = jest.fn();
const mockSupabaseFrom = jest.fn();
const mockSupabaseEq = jest.fn();
const mockUserGetUser = jest.fn();
const mockRevalidatePath = jest.fn();
const mockGenerateBlurDataURL = jest.fn();

// Mock R2 S3 client
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockR2Send })),
  PutObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'PutObject' })),
  DeleteObjectCommand: jest.fn().mockImplementation((params) => ({ ...params, _type: 'DeleteObject' })),
  ListObjectsV2Command: jest.fn().mockImplementation((params) => ({ ...params, _type: 'ListObjects' })),
}));

// Mock Supabase admin client
jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

// Mock Supabase server client (user auth)
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn().mockResolvedValue({
    auth: { getUser: () => mockUserGetUser() },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { id: 'test-model-id' }, error: null }),
        }),
      }),
    }),
  }),
}));

// Mock Next.js cache
jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

// Mock blur hash generation
jest.mock('@/lib/utils/blur-hash', () => ({
  generateBlurDataURL: (...args: unknown[]) => mockGenerateBlurDataURL(...args),
}));

// Mock error logger
jest.mock('@/lib/utils/errors', () => ({
  logError: jest.fn(),
}));

// ─── Import the module under test ───
import { uploadModelImage, deleteModelImage, cleanupOrphanedGalleryPaths, getFirstFileInFolder } from '@/lib/actions/storage';

// ─── Helpers ───

function createMockFormData(overrides: Record<string, unknown> = {}): FormData {
  const defaults = {
    file: new File(['fake-image-data'], 'test-photo.webp', { type: 'image/webp' }),
    modelId: '550e8400-e29b-41d4-a716-446655440000',
    category: 'Portada',
    slotIndex: null,
  };
  const merged = { ...defaults, ...overrides };

  const fd = new FormData();
  fd.append('file', merged.file as File);
  fd.append('modelId', merged.modelId as string);
  fd.append('category', merged.category as string);
  if (merged.slotIndex !== null && merged.slotIndex !== undefined) {
    fd.append('slotIndex', String(merged.slotIndex));
  }
  return fd;
}

function setupSupabaseMock(selectData: unknown = null, updateError: unknown = null) {
  mockSupabaseEq.mockReturnValue({ single: () => Promise.resolve({ data: selectData, error: null }) });
  mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq });
  mockSupabaseUpdate.mockReturnValue({
    eq: () => Promise.resolve({ error: updateError }),
  });
  mockSupabaseFrom.mockReturnValue({
    update: mockSupabaseUpdate,
    select: mockSupabaseSelect,
  });
}

// ─── Tests ───

describe('storage.ts server actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: user authenticated
    mockUserGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });
    // Default: R2 operations succeed
    mockR2Send.mockResolvedValue({});
    // Default: blur hash returns a data URI
    mockGenerateBlurDataURL.mockResolvedValue('data:image/webp;base64,AAAA');
    // Set env vars
    process.env.R2_ACCOUNT_ID = 'test-account';
    process.env.R2_ACCESS_KEY_ID = 'test-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
    process.env.R2_BUCKET_NAME = 'test-bucket';
    process.env.R2_PUBLIC_URL = 'https://r2.test.dev';
  });

  // ────────────────────────────────────────────
  // uploadModelImage
  // ────────────────────────────────────────────

  describe('uploadModelImage', () => {
    it('should reject unauthenticated users', async () => {
      mockUserGetUser.mockResolvedValue({ data: { user: null } });

      const fd = createMockFormData();
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(false);
      expect(result.error).toContain('no autenticado');
    });

    it('should reject invalid category', async () => {
      const fd = createMockFormData({ category: 'InvalidCategory' });
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(false);
      expect(result.error).toContain('inválidos');
    });

    it('should reject oversized files (>8MB)', async () => {
      // Create a file larger than 8MB
      const bigContent = new Uint8Array(9 * 1024 * 1024);
      const bigFile = new File([bigContent], 'huge.webp', { type: 'image/webp' });

      const fd = createMockFormData({ file: bigFile });
      setupSupabaseMock();
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(false);
      expect(result.error).toContain('demasiado grande');
    });

    it('should upload Portada, generate blur hash, and update DB', async () => {
      setupSupabaseMock();
      // Mock: deleteOldFileFromCategory lists nothing
      mockR2Send.mockResolvedValue({ Contents: [] });

      const fd = createMockFormData({ category: 'Portada' });
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(true);
      expect(result.path).toContain('Portada');
      expect(result.path).toContain('-cover.webp');
      // Blur hash was generated
      expect(mockGenerateBlurDataURL).toHaveBeenCalledTimes(1);
      // DB update includes blur hash
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          cover_blur_hash: 'data:image/webp;base64,AAAA',
        })
      );
      // revalidatePath was called
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it('should upload Contraportada with slotIndex and update arrays', async () => {
      setupSupabaseMock(
        { comp_card_paths: [null, null, null, null], comp_card_blur_hashes: [null, null, null, null] }
      );

      const fd = createMockFormData({ category: 'Contraportada', slotIndex: 2 });
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(true);
      expect(result.path).toContain('Contraportada');
      expect(result.path).toContain('-comp_2.webp');
      // DB update includes blur hashes array
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          comp_card_blur_hashes: expect.any(Array),
        })
      );
    });

    it('should upload PortfolioGallery and append to arrays', async () => {
      setupSupabaseMock(
        { gallery_paths: ['existing/path.webp'], gallery_blur_hashes: ['data:existing'] }
      );

      const fd = createMockFormData({ category: 'PortfolioGallery' });
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(true);
      expect(result.path).toContain('PortfolioGallery');
      // Should append, not replace
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          gallery_paths: expect.arrayContaining(['existing/path.webp']),
          gallery_blur_hashes: expect.arrayContaining(['data:existing']),
        })
      );
    });

    it('should still succeed if blur hash generation fails', async () => {
      mockGenerateBlurDataURL.mockRejectedValue(new Error('sharp not available'));
      setupSupabaseMock();
      mockR2Send.mockResolvedValue({ Contents: [] });

      const fd = createMockFormData({ category: 'Portada' });
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(true);
      // DB update should have null for blur hash
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          cover_blur_hash: null,
        })
      );
    });

    it('should delete old file before uploading Portada', async () => {
      // First call: ListObjects returns existing file
      // Second call: DeleteObject succeeds
      // Third call: PutObject succeeds
      mockR2Send
        .mockResolvedValueOnce({ Contents: [{ Key: 'model-id/Portada/old-cover.webp' }] })
        .mockResolvedValueOnce({}) // delete
        .mockResolvedValueOnce({}); // put
      setupSupabaseMock();

      const fd = createMockFormData({ category: 'Portada' });
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(true);
      // R2 was called 3 times: list, delete old, put new
      expect(mockR2Send).toHaveBeenCalledTimes(3);
    });

    it('should return error when R2 upload fails', async () => {
      // List returns empty, then PutObject fails
      mockR2Send
        .mockResolvedValueOnce({ Contents: [] })
        .mockRejectedValueOnce(new Error('R2 connection timeout'));
      setupSupabaseMock();

      const fd = createMockFormData({ category: 'Portada' });
      const result = await uploadModelImage(fd);

      expect(result.success).toBe(false);
      expect(result.error).toContain('R2 connection timeout');
    });
  });

  // ────────────────────────────────────────────
  // deleteModelImage
  // ────────────────────────────────────────────

  describe('deleteModelImage', () => {
    it('should reject unauthenticated users', async () => {
      mockUserGetUser.mockResolvedValue({ data: { user: null } });

      const result = await deleteModelImage('model-id', 'path.webp', 'Portada');

      expect(result.success).toBe(false);
      expect(result.error).toContain('no autenticado');
    });

    it('should delete Portada and clear blur hash', async () => {
      setupSupabaseMock();

      const result = await deleteModelImage(
        '550e8400-e29b-41d4-a716-446655440000',
        'model-id/Portada/cover.webp',
        'Portada'
      );

      expect(result.success).toBe(true);
      // R2 delete was called
      expect(mockR2Send).toHaveBeenCalledTimes(1);
      // DB was updated with null path AND null blur hash
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          cover_path: null,
          cover_blur_hash: null,
        })
      );
      expect(mockRevalidatePath).toHaveBeenCalled();
    });

    it('should delete Contraportada slot and clear blur hash at index', async () => {
      setupSupabaseMock({
        comp_card_paths: ['path0', 'path1', 'path2', 'path3'],
        comp_card_blur_hashes: ['blur0', 'blur1', 'blur2', 'blur3'],
      });

      const result = await deleteModelImage(
        '550e8400-e29b-41d4-a716-446655440000',
        'model-id/Contraportada/comp_1.webp',
        'Contraportada',
        1
      );

      expect(result.success).toBe(true);
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          comp_card_paths: ['path0', null, 'path2', 'path3'],
          comp_card_blur_hashes: ['blur0', null, 'blur2', 'blur3'],
        })
      );
    });

    it('should delete PortfolioGallery image and its blur hash', async () => {
      setupSupabaseMock({
        gallery_paths: ['a.webp', 'target.webp', 'c.webp'],
        gallery_blur_hashes: ['blurA', 'blurTarget', 'blurC'],
      });

      const result = await deleteModelImage(
        '550e8400-e29b-41d4-a716-446655440000',
        'target.webp',
        'PortfolioGallery'
      );

      expect(result.success).toBe(true);
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          gallery_paths: ['a.webp', 'c.webp'],
          gallery_blur_hashes: ['blurA', 'blurC'],
        })
      );
    });

    it('should handle R2 delete failure gracefully', async () => {
      mockR2Send.mockRejectedValue(new Error('R2 unavailable'));

      const result = await deleteModelImage(
        '550e8400-e29b-41d4-a716-446655440000',
        'path.webp',
        'Portada'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ────────────────────────────────────────────
  // cleanupOrphanedGalleryPaths
  // ────────────────────────────────────────────

  describe('cleanupOrphanedGalleryPaths', () => {
    it('should reject unauthenticated users', async () => {
      mockUserGetUser.mockResolvedValue({ data: { user: null } });

      const result = await cleanupOrphanedGalleryPaths('model-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('no autenticado');
    });

    it('should return removed=0 when gallery is empty', async () => {
      // First from() call is for ownership check (uses createClient mock)
      // Second from() call is for select gallery_paths (uses supabaseAdmin mock)
      setupSupabaseMock({ gallery_paths: [] });

      const result = await cleanupOrphanedGalleryPaths('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.removed).toBe(0);
    });

    it('should remove paths not found in R2', async () => {
      setupSupabaseMock({ gallery_paths: ['exists.webp', 'orphan.webp'] });
      // R2 list returns only 'exists.webp'
      mockR2Send.mockResolvedValue({
        Contents: [{ Key: 'exists.webp' }],
      });

      const result = await cleanupOrphanedGalleryPaths('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(true);
      expect(result.removed).toBe(1);
      // DB update should contain only the valid path
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          gallery_paths: ['exists.webp'],
        })
      );
    });

    it('should handle R2 list failure gracefully', async () => {
      setupSupabaseMock({ gallery_paths: ['a.webp'] });
      mockR2Send.mockRejectedValue(new Error('R2 list failed'));

      const result = await cleanupOrphanedGalleryPaths('550e8400-e29b-41d4-a716-446655440000');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ────────────────────────────────────────────
  // getFirstFileInFolder
  // ────────────────────────────────────────────

  describe('getFirstFileInFolder', () => {
    it('should return the most recent file key', async () => {
      mockR2Send.mockResolvedValue({
        Contents: [
          { Key: 'model/Portada/old.webp', LastModified: '2026-01-01T00:00:00Z' },
          { Key: 'model/Portada/new.webp', LastModified: '2026-03-01T00:00:00Z' },
        ],
      });

      const result = await getFirstFileInFolder('model', 'Portada');
      expect(result).toBe('model/Portada/new.webp');
    });

    it('should exclude directory keys', async () => {
      mockR2Send.mockResolvedValue({
        Contents: [
          { Key: 'model/Portada/' }, // directory placeholder
          { Key: 'model/Portada/file.webp', LastModified: '2026-01-01T00:00:00Z' },
        ],
      });

      const result = await getFirstFileInFolder('model', 'Portada');
      expect(result).toBe('model/Portada/file.webp');
    });

    it('should return null when folder is empty', async () => {
      mockR2Send.mockResolvedValue({ Contents: [] });

      const result = await getFirstFileInFolder('model', 'Portada');
      expect(result).toBeNull();
    });

    it('should return null when Contents is undefined', async () => {
      mockR2Send.mockResolvedValue({});

      const result = await getFirstFileInFolder('model', 'Portada');
      expect(result).toBeNull();
    });

    it('should return null on R2 error', async () => {
      mockR2Send.mockRejectedValue(new Error('R2 timeout'));

      const result = await getFirstFileInFolder('model', 'Contraportada');
      expect(result).toBeNull();
    });
  });
});
