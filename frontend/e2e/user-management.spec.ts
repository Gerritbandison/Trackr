import { test, expect } from '@playwright/test';

test.describe('User Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@company.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to users page', async ({ page }) => {
    await page.click('a[href="/users"]');
    await expect(page).toHaveURL('/users');
    await expect(page.locator('h1')).toContainText(/users/i);
  });

  test('should search for users', async ({ page }) => {
    await page.goto('/users');
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill('john');
    await page.waitForTimeout(500); // Wait for debounce
    // Verify search results are displayed
    await expect(page.locator('table')).toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    await page.goto('/users');
    // Look for role filter button or dropdown
    const roleFilter = page.locator('button:has-text("Role")').or(page.locator('select[name*="role"]')).first();
    if (await roleFilter.count() > 0) {
      await roleFilter.click();
      await page.click('text=Manager');
      await page.waitForTimeout(500);
      // Verify filtered results
      await expect(page.locator('table')).toBeVisible();
    }
  });

  test('should paginate through users', async ({ page }) => {
    await page.goto('/users');
    const nextButton = page.locator('button:has-text("Next")').first();
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test('should view user details', async ({ page }) => {
    await page.goto('/users');
    // Click on first user in table
    const firstUserRow = page.locator('table tbody tr').first();
    if (await firstUserRow.count() > 0) {
      await firstUserRow.click();
      await expect(page).toHaveURL(/\/users\/\w+/);
      await expect(page.locator('h1, h2')).toBeVisible();
    }
  });
});


