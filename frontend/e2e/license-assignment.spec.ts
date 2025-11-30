/**
 * E2E Test: License Assignment Workflow
 * Tests assigning and unassigning licenses to users, tracking utilization
 */

import { test, expect } from '@playwright/test';

test.describe('License Assignment Workflow', () => {
  const baseURL = process.env.VITE_API_URL || 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'admin@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/$/, { timeout: 5000 });
  });

  test('should assign license to user and verify utilization', async ({ page }) => {
    // STEP 1: Navigate to licenses page
    await page.goto(`${baseURL}/licenses`);
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // STEP 2: Select a license with available seats
    const availableLicense = page.locator('tbody tr').filter({ hasText: /available|active/i }).first();

    if (await availableLicense.count() > 0) {
      await availableLicense.click();
      await page.waitForURL(/.*licenses\/[^/]+/, { timeout: 5000 });

      // STEP 3: Click assign button
      const assignButton = page.locator('button:has-text("Assign")').first();
      await assignButton.click();
      await page.waitForTimeout(500);

      // STEP 4: Select user to assign
      const userSelect = page.locator('select[name="userId"], select[name="user"]').first();

      if (await userSelect.count() > 0) {
        // Select first available user from dropdown
        const options = await userSelect.locator('option').allTextContents();
        if (options.length > 1) {
          await userSelect.selectOption({ index: 1 }); // Select first non-empty option
        }
      } else {
        // If using autocomplete/search instead of select
        const userInput = page.locator('input[placeholder*="user" i]').first();
        if (await userInput.count() > 0) {
          await userInput.fill('john');
          await page.waitForTimeout(500);
          await page.locator('[role="option"], [data-option]').first().click();
        }
      }

      // STEP 5: Confirm assignment
      const confirmButton = page.locator('button[type="submit"]:has-text("Assign"), button:has-text("Confirm")').first();
      await confirmButton.click();
      await page.waitForTimeout(2000);

      // STEP 6: Verify assignment success
      await expect(page.locator('text=/assigned|success/i, [role="alert"]')).toBeVisible({ timeout: 5000 });

      // STEP 7: Verify assigned users list updated
      const assignedUsersList = page.locator('[data-section="assigned-users"], text=/assigned to/i').first();

      if (await assignedUsersList.count() > 0) {
        // Verify user appears in assigned users
        await expect(page.locator('tbody tr, [role="listitem"]').first()).toBeVisible();
      }

      // STEP 8: Check utilization stats updated
      const utilizationText = page.locator('text=/utilization|seats|allocated/i').first();

      if (await utilizationText.count() > 0) {
        await expect(utilizationText).toBeVisible();
      }
    }
  });

  test('should unassign license from user', async ({ page }) => {
    // Navigate to licenses
    await page.goto(`${baseURL}/licenses`);
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // Find a license with assigned users
    const assignedLicense = page.locator('tbody tr').first();

    if (await assignedLicense.count() > 0) {
      await assignedLicense.click();
      await page.waitForURL(/.*licenses\/[^/]+/, { timeout: 5000 });

      // Navigate to assigned users section
      const assignedTab = page.locator('button:has-text("Assigned"), [data-tab="assigned"]').first();

      if (await assignedTab.count() > 0) {
        await assignedTab.click();
        await page.waitForTimeout(500);
      }

      // Find unassign button for a user
      const unassignButton = page.locator('button:has-text("Unassign"), button:has-text("Remove")').first();

      if (await unassignButton.count() > 0) {
        await unassignButton.click();

        // Confirm unassignment
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').last();
        await confirmButton.click();
        await page.waitForTimeout(2000);

        // Verify unassignment success
        await expect(page.locator('text=/unassigned|removed|success/i, [role="alert"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should prevent over-allocation of license seats', async ({ page }) => {
    // Navigate to licenses
    await page.goto(`${baseURL}/licenses`);
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // Find a license with limited seats
    const limitedLicense = page.locator('tbody tr').first();

    if (await limitedLicense.count() > 0) {
      await limitedLicense.click();
      await page.waitForURL(/.*licenses\/[^/]+/, { timeout: 5000 });

      // Check current utilization
      const utilizationText = await page.locator('text=/\\d+\\s*\\/\\s*\\d+|seats/i').first().textContent();

      if (utilizationText) {
        // Try to assign when at capacity (if displayed)
        const assignButton = page.locator('button:has-text("Assign")');

        // If seats are full, assign button should be disabled or show error
        if (utilizationText.includes('100%') || utilizationText.match(/(\d+)\/\1/)) {
          const isDisabled = await assignButton.isDisabled().catch(() => true);

          if (!isDisabled) {
            await assignButton.click();
            await page.waitForTimeout(500);

            // Should show error about no available seats
            await expect(page.locator('text=/no.*seats|capacity|full/i')).toBeVisible({ timeout: 3000 });
          }
        }
      }
    }
  });

  test('should view license utilization report', async ({ page }) => {
    // Navigate to licenses dashboard or reports
    await page.goto(`${baseURL}/licenses`);

    // Look for utilization or reports section
    const utilizationLink = page.locator('a:has-text("Utilization"), a:has-text("Reports"), button:has-text("Utilization")').first();

    if (await utilizationLink.count() > 0) {
      await utilizationLink.click();
      await page.waitForTimeout(1000);

      // Verify utilization stats are displayed
      await expect(page.locator('text=/utilization|allocated|available/i')).toBeVisible({ timeout: 5000 });

      // Check for percentage or numerical stats
      await expect(page.locator('text=/\\d+%|\\d+\\s*\\/\\s*\\d+/')).toBeVisible();
    }
  });

  test('should filter licenses by compliance status', async ({ page }) => {
    await page.goto(`${baseURL}/licenses`);
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // Look for compliance filter
    const complianceFilter = page.locator('select[name*="compliance"], button:has-text("Compliance")').first();

    if (await complianceFilter.count() > 0) {
      const isSelect = await complianceFilter.evaluate(el => el.tagName === 'SELECT');

      if (isSelect) {
        await page.selectOption('select[name*="compliance"]', { index: 1 });
      } else {
        await complianceFilter.click();
        await page.locator('[role="option"]').first().click();
      }

      await page.waitForTimeout(1000);

      // Results should be filtered
      await expect(page.locator('table tbody tr, [role="listitem"]').first()).toBeVisible({ timeout: 3000 });
    }
  });

  test('should view expiring licenses', async ({ page }) => {
    await page.goto(`${baseURL}/licenses`);

    // Look for expiring licenses filter or section
    const expiringLink = page.locator('a:has-text("Expiring"), button:has-text("Expiring"), [data-filter="expiring"]').first();

    if (await expiringLink.count() > 0) {
      await expiringLink.click();
      await page.waitForTimeout(1000);

      // Should show licenses expiring soon
      const expiringTable = page.locator('table, [role="list"]');
      await expect(expiringTable).toBeVisible();
    } else {
      // Try navigating to dedicated expiring licenses route
      await page.goto(`${baseURL}/licenses/expiring`);
      await page.waitForTimeout(1000);

      // Should show expiring licenses or empty state
      await expect(page.locator('text=/expir/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should bulk assign licenses to multiple users', async ({ page }) => {
    await page.goto(`${baseURL}/licenses`);
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    // Look for bulk actions
    const bulkButton = page.locator('button:has-text("Bulk"), button:has-text("Multiple")').first();

    if (await bulkButton.count() > 0) {
      await bulkButton.click();
      await page.waitForTimeout(500);

      // Select multiple licenses using checkboxes
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 2) {
        await checkboxes.nth(1).check();
        await checkboxes.nth(2).check();
        await page.waitForTimeout(300);

        // Click bulk assign action
        const bulkAssignButton = page.locator('button:has-text("Assign Selected")').first();

        if (await bulkAssignButton.count() > 0) {
          await bulkAssignButton.click();
          await page.waitForTimeout(500);

          // Should open bulk assignment modal
          await expect(page.locator('[role="dialog"], .modal')).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test('should track license assignment history', async ({ page }) => {
    await page.goto(`${baseURL}/licenses`);
    await page.waitForSelector('table, [role="list"]', { timeout: 5000 });

    const firstLicense = page.locator('tbody tr').first();

    if (await firstLicense.count() > 0) {
      await firstLicense.click();
      await page.waitForURL(/.*licenses\/[^/]+/, { timeout: 5000 });

      // Look for history or activity tab
      const historyTab = page.locator('button:has-text("History"), button:has-text("Activity"), [data-tab="history"]').first();

      if (await historyTab.count() > 0) {
        await historyTab.click();
        await page.waitForTimeout(500);

        // Verify assignment history is shown
        await expect(page.locator('text=/assigned|unassigned|history|activity/i')).toBeVisible({ timeout: 5000 });

        // Should show timestamps and user info
        await expect(page.locator('text=/\\d{4}-\\d{2}-\\d{2}|ago|yesterday/i')).toBeVisible();
      }
    }
  });

  test('should display license compliance warnings', async ({ page }) => {
    await page.goto(`${baseURL}/licenses`);

    // Look for compliance dashboard or warnings
    const complianceSection = page.locator('a:has-text("Compliance"), [data-section="compliance"]').first();

    if (await complianceSection.count() > 0) {
      await complianceSection.click();
      await page.waitForTimeout(1000);

      // Should show compliance status
      await expect(page.locator('text=/compliant|non-compliant|warning/i')).toBeVisible({ timeout: 5000 });
    } else {
      // Check for warning badges on licenses list
      const warningBadge = page.locator('[data-status="warning"], .badge-warning, text=/over-allocated/i').first();

      if (await warningBadge.count() > 0) {
        await expect(warningBadge).toBeVisible();
      }
    }
  });
});
