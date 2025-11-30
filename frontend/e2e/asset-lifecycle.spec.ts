/**
 * E2E Test: Asset Lifecycle
 * Tests complete asset management workflow: create, view, update, delete
 */

import { test, expect } from '@playwright/test';

test.describe('Asset Lifecycle', () => {
  const baseURL = process.env.VITE_API_URL || 'http://localhost:5173';
  const testAsset = {
    assetTag: `TEST-ASSET-${Date.now()}`,
    name: 'Test Laptop',
    category: 'hardware',
    status: 'available',
    serialNumber: `SN-${Date.now()}`,
    model: 'ThinkPad X1 Carbon',
    manufacturer: 'Lenovo',
    purchasePrice: 1500,
    purchaseDate: '2024-01-15',
  };

  test.beforeEach(async ({ page }) => {
    // Login as admin (required for create/update/delete)
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'admin@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/$/, { timeout: 5000 });
  });

  test('should complete full asset lifecycle: create -> view -> update -> delete', async ({ page }) => {
    // STEP 1: Navigate to assets page
    await page.goto(`${baseURL}/assets`);
    await page.waitForSelector('h1, h2', { timeout: 5000 });

    // STEP 2: Create new asset
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    await createButton.click();

    // Fill out asset form
    await page.fill('input[name="assetTag"]', testAsset.assetTag);
    await page.fill('input[name="name"]', testAsset.name);
    await page.fill('input[name="serialNumber"]', testAsset.serialNumber);
    await page.fill('input[name="model"]', testAsset.model);
    await page.fill('input[name="manufacturer"]', testAsset.manufacturer);
    await page.fill('input[name="purchasePrice"]', testAsset.purchasePrice.toString());
    await page.fill('input[name="purchaseDate"]', testAsset.purchaseDate);

    // Select category (could be dropdown or input)
    const categoryField = page.locator('select[name="category"], input[name="category"]');
    if (await categoryField.evaluate(el => el.tagName) === 'SELECT') {
      await page.selectOption('select[name="category"]', testAsset.category);
    } else {
      await page.fill('input[name="category"]', testAsset.category);
    }

    // Select status
    const statusField = page.locator('select[name="status"], input[name="status"]');
    if (await statusField.evaluate(el => el.tagName) === 'SELECT') {
      await page.selectOption('select[name="status"]', testAsset.status);
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to assets list or success message
    await page.waitForTimeout(2000);
    await expect(page.locator('text=/created|success/i, [role="alert"]')).toBeVisible({ timeout: 5000 });

    // STEP 3: Search for created asset
    await page.goto(`${baseURL}/assets`);
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    await searchInput.fill(testAsset.assetTag);
    await page.waitForTimeout(1000);

    // Verify asset appears in search results
    await expect(page.locator(`text="${testAsset.assetTag}"`)).toBeVisible();
    await expect(page.locator(`text="${testAsset.name}"`)).toBeVisible();

    // STEP 4: View asset details
    await page.click(`text="${testAsset.assetTag}"`);
    await page.waitForURL(/.*assets\/[^/]+/, { timeout: 5000 });

    // Verify asset details are displayed
    await expect(page.locator(`text="${testAsset.assetTag}"`)).toBeVisible();
    await expect(page.locator(`text="${testAsset.name}"`)).toBeVisible();
    await expect(page.locator(`text="${testAsset.model}"`)).toBeVisible();
    await expect(page.locator(`text="${testAsset.manufacturer}"`)).toBeVisible();

    // STEP 5: Update asset
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();

    // Update asset name
    const updatedName = `${testAsset.name} - Updated`;
    await page.fill('input[name="name"]', updatedName);

    // Update status to in-use
    const statusFieldUpdate = page.locator('select[name="status"]');
    if (await statusFieldUpdate.count() > 0) {
      await page.selectOption('select[name="status"]', 'in-use');
    }

    // Save changes
    await page.click('button[type="submit"]:has-text("Save"), button:has-text("Update")');
    await page.waitForTimeout(2000);

    // Verify update success
    await expect(page.locator('text=/updated|success/i, [role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator(`text="${updatedName}"`)).toBeVisible();

    // STEP 6: Delete asset
    const deleteButton = page.locator('button:has-text("Delete")').first();
    await deleteButton.click();

    // Confirm deletion in modal/dialog
    const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")').last();
    await confirmButton.click();
    await page.waitForTimeout(2000);

    // Verify deletion success and redirect to assets list
    await expect(page).toHaveURL(/.*assets\/?$/);

    // Verify asset no longer appears in list
    await page.waitForTimeout(1000);
    const searchAfterDelete = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    await searchAfterDelete.fill(testAsset.assetTag);
    await page.waitForTimeout(1000);

    // Asset should not be found or show empty state
    const assetExists = await page.locator(`text="${testAsset.assetTag}"`).count();
    expect(assetExists).toBe(0);
  });

  test('should validate required fields when creating asset', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);

    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    await createButton.click();

    // Try to submit empty form
    await page.click('button[type="submit"]');
    await page.waitForTimeout(500);

    // Should show validation errors
    const errorMessages = page.locator('text=/required|invalid/i, [role="alert"]');
    await expect(errorMessages.first()).toBeVisible({ timeout: 3000 });
  });

  test('should prevent duplicate asset tags', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);

    // Create first asset with unique tag
    const duplicateTag = `DUPLICATE-${Date.now()}`;

    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    await createButton.click();

    await page.fill('input[name="assetTag"]', duplicateTag);
    await page.fill('input[name="name"]', 'First Asset');

    const categoryField = page.locator('select[name="category"]');
    if (await categoryField.count() > 0) {
      await page.selectOption('select[name="category"]', 'hardware');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Try to create another asset with same tag
    await page.goto(`${baseURL}/assets`);
    const createButton2 = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first();
    await createButton2.click();

    await page.fill('input[name="assetTag"]', duplicateTag);
    await page.fill('input[name="name"]', 'Second Asset');

    const categoryField2 = page.locator('select[name="category"]');
    if (await categoryField2.count() > 0) {
      await page.selectOption('select[name="category"]', 'hardware');
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Should show duplicate error
    await expect(page.locator('text=/duplicate|exists|already/i')).toBeVisible({ timeout: 5000 });
  });

  test('should filter assets by status', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);
    await page.waitForSelector('button, select', { timeout: 5000 });

    // Apply available status filter
    const statusFilter = page.locator('select[name*="status"]').or(page.locator('button:has-text("Status")')).first();

    if (await statusFilter.count() > 0) {
      const isSelect = await statusFilter.evaluate(el => el.tagName === 'SELECT');

      if (isSelect) {
        await page.selectOption('select[name*="status"]', 'available');
      } else {
        await statusFilter.click();
        await page.click('text="Available", [data-value="available"]');
      }

      await page.waitForTimeout(1000);

      // All visible assets should show 'available' status
      const statusBadges = page.locator('[data-status="available"], text=/available/i').first();
      await expect(statusBadges).toBeVisible({ timeout: 3000 });
    }
  });

  test('should view asset depreciation details', async ({ page }) => {
    await page.goto(`${baseURL}/assets`);
    await page.waitForSelector('tbody tr, [role="listitem"]', { timeout: 5000 });

    // Click on first asset
    const firstAsset = page.locator('tbody tr a, [role="listitem"] a').first();

    if (await firstAsset.count() > 0) {
      await firstAsset.click();
      await page.waitForURL(/.*assets\/[^/]+/, { timeout: 5000 });

      // Look for depreciation section or tab
      const depreciationSection = page.locator('text=/depreciation/i, [data-tab="depreciation"]').first();

      if (await depreciationSection.count() > 0) {
        await depreciationSection.click();
        await page.waitForTimeout(500);

        // Verify depreciation data is shown
        await expect(page.locator('text=/current value|book value|depreciation/i')).toBeVisible({ timeout: 3000 });
      }
    }
  });
});
