import { test, expect } from '@playwright/test';

/**
 * E2E smoke tests for IZ ACCESS.
 *
 * These verify the critical user flows work end-to-end:
 * 1. Public pages load (login, 404)
 * 2. Auth redirect works (unauthenticated → login)
 * 3. Health endpoint responds
 * 4. Security headers are present
 */

test.describe('Public pages', () => {
  test('login page loads and has correct title', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/IZ ACCESS|Iniciar sesión/i);
    // Form should be present
    await expect(page.locator('form')).toBeVisible();
  });

  test('login page has skip-to-content link', async ({ page }) => {
    await page.goto('/login');
    const skipLink = page.locator('a[href="#login-form"]');
    await expect(skipLink).toBeAttached();
  });

  test('404 page renders for unknown routes', async ({ page }) => {
    const response = await page.goto('/this-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.locator('h1')).toContainText('no encontrada');
  });
});

test.describe('Auth guard', () => {
  test('redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('redirect includes ?next= parameter', async ({ page }) => {
    await page.goto('/dashboard/models');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('next=');
  });
});

test.describe('API health', () => {
  test('GET /api/health returns 200 with status ok', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
  });
});

test.describe('Security headers', () => {
  test('responses include CSP header', async ({ page }) => {
    const response = await page.goto('/login');
    const csp = response?.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('report-uri /api/csp-report');
    expect(csp).toContain('report-to csp-endpoint');
  });

  test('responses include Reporting-Endpoints header (Reporting API v2)', async ({ page }) => {
    const response = await page.goto('/login');
    const reportingEndpoints = response?.headers()['reporting-endpoints'];
    expect(reportingEndpoints).toBeTruthy();
    expect(reportingEndpoints).toContain('csp-endpoint');
  });

  test('responses include HSTS header', async ({ page }) => {
    const response = await page.goto('/login');
    const hsts = response?.headers()['strict-transport-security'];
    expect(hsts).toBeTruthy();
    expect(hsts).toContain('max-age=');
  });

  test('responses include X-Content-Type-Options', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('responses include X-Frame-Options', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.headers()['x-frame-options']).toBe('DENY');
  });
});

test.describe('Accessibility', () => {
  test('login page has <main> landmark', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('main')).toBeVisible();
  });

  test('dashboard redirect preserves skip-to-content in login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/);
    // After redirect, login page should have skip link
    const skipLink = page.locator('a[href="#login-form"]');
    await expect(skipLink).toBeAttached();
  });
});
