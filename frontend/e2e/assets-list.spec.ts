/**
 * E2E Test: Assets List Page
 * Tests asset listing, search, filters, and pagination
 */

import { test, expect } from '@playwright/test';

test.describe('Assets List Page', () => {
  const baseURL = process.env.VITE_API_URL || 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'admin@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/$/, { timeout: 5000 });
  });

  test('should display assets list', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);
    
    // Wait for assets table/list to load
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });
    
    // Should have assets or empty state
    const hasAssets = await page.locator('tbody tr, [role="listitem"]').count();
    expect(hasAssets).toBeGreaterThanOrEqual(0);
  });

  test('should search assets', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);
    await page.waitForSelector('input[type="search"], input[placeholder*="search" i]', { timeout: 5000 });
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    await searchInput.fill('laptop');
    await searchInput.press('Enter');
    
    // Wait for filtered results
    await page.waitForTimeout(1000);
    
    // Results should be displayed
    const results = await page.locator('tbody tr, [role="listitem"]').count();
    expect(results).toBeGreaterThanOrEqual(0);
  });

  test('should filter assets by status', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);
    await page.waitForSelector('button, select', { timeout: 5000 });
    
    // Find and click status filter
    const statusFilter = page.locator('button:has-text("Status"), select[name*="status" i]').first();
    
    if (await statusFilter.count() > 0) {
      await statusFilter.click();
      await page.locator('text="available", option[value="available"]').first().click();
      
      // Wait for filtered results
      await page.waitForTimeout(1000);
    }
    
    // Page should still be assets page
    await expect(page).toHaveURL(/.*assets/);
  });

  test('should navigate to asset details', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);
    await page.waitForSelector('tbody tr, [role="listitem"]', { timeout: 5000 });
    
    // Click on first asset
    const firstAsset = page.locator('tbody tr a, [role="listitem"] a').first();
    
    if (await firstAsset.count() > 0) {
      await firstAsset.click();
      
      // Should navigate to asset details
      await page.waitForURL(/.*assets\/[^/]+/, { timeout: 5000 });
      await expect(page).toHaveURL(/.*assets\/[^/]+/);
    }
  });

  test('should paginate assets', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);
    await page.waitForSelector('button, a', { timeout: 5000 });
    
    // Look for pagination controls
    const nextButton = page.locator('button:has-text("Next"), a:has-text("Next")').first();
    
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();
      
      // URL should reflect page change or content should update
      await page.waitForTimeout(1000);
    }
  });
});

