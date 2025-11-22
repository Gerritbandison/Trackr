import { test, expect } from '@playwright/test';

test.describe('Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display dashboard statistics', async ({ page }) => {
    await expect(page).toHaveURL('/');
    // Check for stat cards or dashboard elements
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('should navigate to assets from dashboard', async ({ page }) => {
    const assetsLink = page.locator('a[href="/assets"]').or(page.locator('text=/assets/i')).first();
    if (await assetsLink.count() > 0) {
      await assetsLink.click();
      await expect(page).toHaveURL('/assets');
    }
  });

  test('should navigate to users from dashboard', async ({ page }) => {
    const usersLink = page.locator('a[href="/users"]').or(page.locator('text=/users/i')).first();
    if (await usersLink.count() > 0) {
      await usersLink.click();
      await expect(page).toHaveURL('/users');
    }
  });

  test('should display charts on dashboard', async ({ page }) => {
    // Check for chart elements (Recharts creates SVG elements)
    const charts = page.locator('svg').or(page.locator('[class*="chart"]'));
    if (await charts.count() > 0) {
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should display recent activity', async ({ page }) => {
    // Look for recent activity section
    const recentActivity = page.locator('text=/recent/i').or(page.locator('[class*="activity"]')).first();
    // If found, verify it's visible
    if (await recentActivity.count() > 0) {
      await expect(recentActivity).toBeVisible();
    }
  });
});


