import { test, expect } from '@playwright/test';

test.describe('License Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to licenses page', async ({ page }) => {
    await page.click('a[href="/licenses"]');
    await expect(page).toHaveURL('/licenses');
    await expect(page.locator('h1')).toContainText(/license/i);
  });

  test('should view license details', async ({ page }) => {
    await page.goto('/licenses');
    // Click on first license in table
    const firstLicenseRow = page.locator('table tbody tr').first();
    if (await firstLicenseRow.count() > 0) {
      await firstLicenseRow.click();
      await expect(page).toHaveURL(/\/licenses\/\w+/);
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });

  test('should filter licenses by status', async ({ page }) => {
    await page.goto('/licenses');
    // Look for status filter
    const statusFilter = page.locator('button:has-text("Status")').or(page.locator('select[name*="status"]')).first();
    if (await statusFilter.count() > 0) {
      await statusFilter.click();
      await page.click('text=Active');
      await page.waitForTimeout(500);
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should view license renewals', async ({ page }) => {
    await page.goto('/licenses/renewals');
    await expect(page).toHaveURL('/licenses/renewals');
    await expect(page.locator('h1, h2')).toContainText(/renew/i);
  });

  test('should search licenses', async ({ page }) => {
    await page.goto('/licenses');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('microsoft');
    await page.waitForTimeout(500);
    await expect(page.locator('table')).toBeVisible();
  });
});


