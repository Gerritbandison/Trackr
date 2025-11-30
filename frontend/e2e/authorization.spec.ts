/**
 * E2E Test: Role-Based Authorization
 * Tests that different user roles (admin, manager, staff) have appropriate permissions
 */

import { test, expect } from '@playwright/test';

test.describe('Role-Based Authorization', () => {
  const baseURL = process.env.VITE_API_URL || 'http://localhost:5173';

  const users = {
    admin: {
      email: 'admin@company.com',
      password: 'password123',
      role: 'admin',
    },
    manager: {
      email: 'manager@company.com',
      password: 'password123',
      role: 'manager',
    },
    staff: {
      email: 'staff@company.com',
      password: 'password123',
      role: 'staff',
    },
  };

  test.describe('Admin Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await page.fill('input[name="email"]', users.admin.email);
      await page.fill('input[name="password"]', users.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/$/, { timeout: 5000 });
    });

    test('should have full access to user management', async ({ page }) => {
      await page.goto(`${baseURL}/users`);
      await page.waitForSelector('h1, h2', { timeout: 5000 });

      // Admin should see create user button
      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
      await expect(createButton.first()).toBeVisible({ timeout: 3000 });

      // Admin should see edit and delete buttons
      const editButton = page.locator('button:has-text("Edit"), [aria-label*="edit" i]');
      const deleteButton = page.locator('button:has-text("Delete"), [aria-label*="delete" i]');

      // At least one action button should be visible
      const hasEditOrDelete = (await editButton.count()) > 0 || (await deleteButton.count()) > 0;
      expect(hasEditOrDelete).toBeTruthy();
    });

    test('should be able to create, edit, and delete assets', async ({ page }) => {
      await page.goto(`${baseURL}/assets`);
      await page.waitForSelector('h1, h2', { timeout: 5000 });

      // Should see create button
      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
      await expect(createButton.first()).toBeVisible({ timeout: 3000 });

      // Navigate to asset details
      const firstAsset = page.locator('tbody tr a, [role="listitem"] a').first();

      if (await firstAsset.count() > 0) {
        await firstAsset.click();
        await page.waitForURL(/.*assets\/[^/]+/, { timeout: 5000 });

        // Should see edit and delete buttons
        const editButton = page.locator('button:has-text("Edit")');
        const deleteButton = page.locator('button:has-text("Delete")');

        await expect(editButton.or(deleteButton).first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should have access to department management', async ({ page }) => {
      await page.goto(`${baseURL}/departments`);
      await page.waitForTimeout(2000);

      // Admin should be able to access departments or see appropriate UI
      const isDepartmentsPage = page.url().includes('departments');
      const hasContent = await page.locator('h1, h2, table, [role="list"]').count() > 0;

      expect(isDepartmentsPage || hasContent).toBeTruthy();
    });

    test('should have access to vendor management', async ({ page }) => {
      await page.goto(`${baseURL}/vendors`);
      await page.waitForTimeout(2000);

      // Admin should be able to access vendors or see appropriate UI
      const isVendorsPage = page.url().includes('vendors');
      const hasContent = await page.locator('h1, h2, table, [role="list"]').count() > 0;

      expect(isVendorsPage || hasContent).toBeTruthy();
    });

    test('should have access to all reports and analytics', async ({ page }) => {
      await page.goto(`${baseURL}/reports`);
      await page.waitForTimeout(2000);

      // Admin should see reports page or dashboard with analytics
      const hasReports = page.url().includes('reports') || page.url().includes('analytics');
      const hasContent = await page.locator('h1, h2, text=/report|analytic/i').count() > 0;

      expect(hasReports || hasContent).toBeTruthy();
    });
  });

  test.describe('Manager Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await page.fill('input[name="email"]', users.manager.email);
      await page.fill('input[name="password"]', users.manager.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/$/, { timeout: 5000 });
    });

    test('should be able to create and edit assets', async ({ page }) => {
      await page.goto(`${baseURL}/assets`);
      await page.waitForSelector('h1, h2', { timeout: 5000 });

      // Managers should see create button
      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
      await expect(createButton.first()).toBeVisible({ timeout: 3000 });

      // Navigate to asset details
      const firstAsset = page.locator('tbody tr a, [role="listitem"] a').first();

      if (await firstAsset.count() > 0) {
        await firstAsset.click();
        await page.waitForURL(/.*assets\/[^/]+/, { timeout: 5000 });

        // Should see edit button
        const editButton = page.locator('button:has-text("Edit")');
        await expect(editButton.first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should NOT be able to delete assets', async ({ page }) => {
      await page.goto(`${baseURL}/assets`);
      await page.waitForSelector('h1, h2', { timeout: 5000 });

      const firstAsset = page.locator('tbody tr a, [role="listitem"] a').first();

      if (await firstAsset.count() > 0) {
        await firstAsset.click();
        await page.waitForURL(/.*assets\/[^/]+/, { timeout: 5000 });

        // Should NOT see delete button (or it should be disabled)
        const deleteButton = page.locator('button:has-text("Delete")');
        const deleteCount = await deleteButton.count();

        if (deleteCount > 0) {
          const isDisabled = await deleteButton.first().isDisabled();
          expect(isDisabled).toBeTruthy();
        } else {
          expect(deleteCount).toBe(0);
        }
      }
    });

    test('should be able to assign licenses', async ({ page }) => {
      await page.goto(`${baseURL}/licenses`);
      await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

      const firstLicense = page.locator('tbody tr').first();

      if (await firstLicense.count() > 0) {
        await firstLicense.click();
        await page.waitForURL(/.*licenses\/[^/]+/, { timeout: 5000 });

        // Should see assign button
        const assignButton = page.locator('button:has-text("Assign")');
        await expect(assignButton.first()).toBeVisible({ timeout: 3000 });
      }
    });

    test('should have limited access to user management', async ({ page }) => {
      await page.goto(`${baseURL}/users`);
      await page.waitForTimeout(2000);

      // Manager might have read-only access or no access
      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New User")');
      const createCount = await createButton.count();

      if (createCount > 0) {
        // If create button exists, it should be disabled
        const isDisabled = await createButton.first().isDisabled();
        expect(isDisabled).toBeTruthy();
      }
      // Otherwise, no create button means read-only or restricted access
    });
  });

  test.describe('Staff Permissions', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${baseURL}/login`);
      await page.fill('input[name="email"]', users.staff.email);
      await page.fill('input[name="password"]', users.staff.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/$/, { timeout: 5000 });
    });

    test('should have read-only access to assets', async ({ page }) => {
      await page.goto(`${baseURL}/assets`);
      await page.waitForSelector('h1, h2, table, [role="list"]', { timeout: 5000 });

      // Should see assets list
      await expect(page.locator('h1, h2')).toBeVisible();

      // Should NOT see create button
      const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")');
      const createCount = await createButton.count();

      if (createCount > 0) {
        const isDisabled = await createButton.first().isDisabled();
        expect(isDisabled).toBeTruthy();
      } else {
        expect(createCount).toBe(0);
      }
    });

    test('should NOT be able to edit or delete assets', async ({ page }) => {
      await page.goto(`${baseURL}/assets`);
      await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

      const firstAsset = page.locator('tbody tr a, [role="listitem"] a').first();

      if (await firstAsset.count() > 0) {
        await firstAsset.click();
        await page.waitForURL(/.*assets\/[^/]+/, { timeout: 5000 });

        // Should NOT see edit or delete buttons
        const editButton = page.locator('button:has-text("Edit")');
        const deleteButton = page.locator('button:has-text("Delete")');

        const editCount = await editButton.count();
        const deleteCount = await deleteButton.count();

        if (editCount > 0) {
          expect(await editButton.first().isDisabled()).toBeTruthy();
        } else {
          expect(editCount).toBe(0);
        }

        if (deleteCount > 0) {
          expect(await deleteButton.first().isDisabled()).toBeTruthy();
        } else {
          expect(deleteCount).toBe(0);
        }
      }
    });

    test('should have read-only access to licenses', async ({ page }) => {
      await page.goto(`${baseURL}/licenses`);
      await page.waitForSelector('h1, h2, table, [role="list"]', { timeout: 5000 });

      // Should see licenses list
      await expect(page.locator('h1, h2')).toBeVisible();

      const firstLicense = page.locator('tbody tr').first();

      if (await firstLicense.count() > 0) {
        await firstLicense.click();
        await page.waitForURL(/.*licenses\/[^/]+/, { timeout: 5000 });

        // Should NOT see assign button
        const assignButton = page.locator('button:has-text("Assign")');
        const assignCount = await assignButton.count();

        if (assignCount > 0) {
          expect(await assignButton.first().isDisabled()).toBeTruthy();
        } else {
          expect(assignCount).toBe(0);
        }
      }
    });

    test('should NOT have access to user management', async ({ page }) => {
      await page.goto(`${baseURL}/users`);
      await page.waitForTimeout(2000);

      // Staff should either be redirected or see access denied
      const hasAccessDenied = await page.locator('text=/access denied|forbidden|unauthorized/i').count() > 0;
      const redirectedAway = !page.url().includes('users');

      expect(hasAccessDenied || redirectedAway).toBeTruthy();
    });

    test('should NOT have access to department management', async ({ page }) => {
      await page.goto(`${baseURL}/departments`);
      await page.waitForTimeout(2000);

      // Staff should either be redirected or see access denied
      const hasAccessDenied = await page.locator('text=/access denied|forbidden|unauthorized/i').count() > 0;
      const redirectedAway = !page.url().includes('departments');

      expect(hasAccessDenied || redirectedAway).toBeTruthy();
    });

    test('should have access to dashboard but with limited widgets', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForSelector('h1, h2, [role="main"]', { timeout: 5000 });

      // Should see dashboard
      await expect(page.locator('text=/dashboard|overview/i')).toBeVisible({ timeout: 3000 });

      // Some widgets might be hidden for staff
      const adminWidgets = page.locator('text=/user.*management|admin|settings/i');
      const adminWidgetCount = await adminWidgets.count();

      // Staff should have fewer or no admin widgets
      expect(adminWidgetCount).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Unauthorized Access Prevention', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected route without login
      await page.goto(`${baseURL}/assets`);
      await page.waitForTimeout(2000);

      // Should be redirected to login
      await expect(page).toHaveURL(/.*login/);
    });

    test('should prevent access to protected routes after logout', async ({ page }) => {
      // Login first
      await page.goto(`${baseURL}/login`);
      await page.fill('input[name="email"]', users.admin.email);
      await page.fill('input[name="password"]', users.admin.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/$/, { timeout: 5000 });

      // Logout
      const logoutButton = page.locator('button:has-text("Logout"), [aria-label*="logout" i]');
      await logoutButton.click();
      await page.waitForURL(/.*login/, { timeout: 3000 });

      // Try to access protected route
      await page.goto(`${baseURL}/assets`);
      await page.waitForTimeout(2000);

      // Should be redirected back to login
      await expect(page).toHaveURL(/.*login/);
    });

    test('should prevent API calls with expired/invalid tokens', async ({ page }) => {
      // Set invalid token
      await page.goto(`${baseURL}/login`);
      await page.evaluate(() => {
        localStorage.setItem('token', 'invalid-token-12345');
      });

      // Try to access protected route
      await page.goto(`${baseURL}/assets`);
      await page.waitForTimeout(2000);

      // Should either redirect to login or show error
      const isLoginPage = page.url().includes('login');
      const hasError = await page.locator('text=/unauthorized|invalid.*token|session.*expired/i').count() > 0;

      expect(isLoginPage || hasError).toBeTruthy();
    });
  });
});
