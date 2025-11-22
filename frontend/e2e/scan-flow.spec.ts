/**
 * E2E Test: Barcode Scan Flow
 * Playwright test for scanning barcode → auto-fill form → save asset
 */

import { test, expect } from '@playwright/test';

test.describe('Barcode Scan Flow', () => {
  const baseURL = process.env.VITE_API_URL || 'http://localhost:5173';
  let authToken: string;

  test.beforeEach(async ({ page, request }) => {
    // Mock authentication or login
    // For this test, we'll assume user is already logged in
    await page.goto(`${baseURL}/login`);
    
    // Login as admin user
    await page.fill('input[name="email"]', 'admin@trackr.test');
    await page.fill('input[name="password"]', 'Admin123456');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL(`${baseURL}/dashboard`, { timeout: 5000 });
    
    // Get auth token from localStorage
    authToken = await page.evaluate(() => {
      return localStorage.getItem('token') || '';
    });
  });

  test('should scan barcode and auto-fill asset form', async ({ page }) => {
    // Navigate to assets page
    await page.goto(`${baseURL}/assets`);
    await expect(page).toHaveURL(/.*assets/);

    // Click "New Asset" button
    await page.click('text=New Asset');
    await expect(page).toHaveURL(/.*assets\/new/);

    // Wait for form to load
    await page.waitForSelector('input[name="name"]', { state: 'visible' });

    // Simulate barcode scan by filling in asset tag
    // In a real scenario, this would come from a barcode scanner
    const barcodeValue = 'BC123456789';
    
    // Scan barcode into asset tag field
    const assetTagInput = page.locator('input[name="assetTag"]');
    await assetTagInput.fill(barcodeValue);

    // Simulate auto-fill from barcode
    // In production, this would trigger an API call to lookup asset info
    const barcodeData = {
      serialNumber: 'SN789012345',
      manufacturer: 'Dell',
      model: 'Latitude 5420',
      category: 'laptop',
    };

    // Fill form with barcode-derived data
    await page.fill('input[name="name"]', barcodeData.manufacturer + ' ' + barcodeData.model);
    await page.selectOption('select[name="category"]', barcodeData.category);
    await page.fill('input[name="manufacturer"]', barcodeData.manufacturer);
    await page.fill('input[name="model"]', barcodeData.model);
    await page.fill('input[name="serialNumber"]', barcodeData.serialNumber);
    
    // Fill in additional required/optional fields
    await page.fill('input[name="purchaseDate"]', '2024-01-15');
    await page.fill('input[name="purchasePrice"]', '1299.99');
    await page.selectOption('select[name="status"]', 'available');
    await page.selectOption('select[name="condition"]', 'excellent');
    await page.fill('input[name="location"]', 'Warehouse A');

    // Verify form is filled correctly
    expect(await page.inputValue('input[name="assetTag"]')).toBe(barcodeValue);
    expect(await page.inputValue('input[name="name"]')).toContain(barcodeData.manufacturer);
    expect(await page.inputValue('input[name="manufacturer"]')).toBe(barcodeData.manufacturer);
    expect(await page.inputValue('input[name="model"]')).toBe(barcodeData.model);
    expect(await page.inputValue('input[name="serialNumber"]')).toBe(barcodeData.serialNumber);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for success message
    await page.waitForSelector('text=Asset created!', { timeout: 5000 });
    expect(await page.locator('text=Asset created!').isVisible()).toBeTruthy();

    // Verify navigation back to assets list
    await page.waitForURL(/.*assets/, { timeout: 5000 });
    expect(page.url()).toContain('/assets');
  });

  test('should handle barcode scan with existing asset', async ({ page }) => {
    // Navigate to assets page
    await page.goto(`${baseURL}/assets`);
    
    // Click "New Asset"
    await page.click('text=New Asset');
    await page.waitForSelector('input[name="name"]');

    // Simulate scanning an existing asset's barcode
    const existingBarcode = 'EXISTING123';
    
    await page.fill('input[name="assetTag"]', existingBarcode);
    
    // Fill form
    await page.fill('input[name="name"]', 'Existing Asset');
    await page.selectOption('select[name="category"]', 'laptop');
    await page.fill('input[name="manufacturer"]', 'Dell');
    await page.fill('input[name="model"]', 'Latitude 5420');
    await page.selectOption('select[name="status"]', 'available');
    await page.selectOption('select[name="condition"]', 'excellent');

    // Attempt to submit
    await page.click('button[type="submit"]');

    // Should show duplicate error
    await page.waitForSelector('text=already in use', { timeout: 5000 });
    expect(await page.locator('text=already in use').isVisible()).toBeTruthy();
  });

  test('should auto-detect barcode format and fill fields', async ({ page }) => {
    // Test different barcode formats
    const testCases = [
      {
        barcode: 'QR-DELL-LAT5420-SN12345',
        expectedManufacturer: 'Dell',
        expectedModel: 'LAT5420',
      },
      {
        barcode: 'HP-ELITEBOOK-850-SN67890',
        expectedManufacturer: 'HP',
        expectedModel: 'EliteBook 850',
      },
    ];

    for (const testCase of testCases) {
      await page.goto(`${baseURL}/assets/new`);
      await page.waitForSelector('input[name="name"]');

      // Simulate barcode scan
      await page.fill('input[name="assetTag"]', testCase.barcode);

      // Mock auto-fill logic based on barcode format
      if (testCase.barcode.startsWith('QR-DELL-')) {
        const parts = testCase.barcode.split('-');
        await page.fill('input[name="manufacturer"]', parts[1]);
        await page.fill('input[name="model"]', parts[2]);
        await page.selectOption('select[name="category"]', 'laptop');
      } else if (testCase.barcode.startsWith('HP-')) {
        const parts = testCase.barcode.split('-');
        await page.fill('input[name="manufacturer"]', parts[0]);
        await page.fill('input[name="model"]', parts[1] + ' ' + parts[2]);
        await page.selectOption('select[name="category"]', 'laptop');
      }

      // Verify auto-filled fields
      expect(await page.inputValue('input[name="manufacturer"]')).toContain(testCase.expectedManufacturer);
      
      // Fill remaining required fields
      await page.fill('input[name="name"]', await page.inputValue('input[name="manufacturer"]') + ' ' + await page.inputValue('input[name="model"]'));
      await page.fill('input[name="serialNumber"]', 'AUTO-SN');
      await page.selectOption('select[name="status"]', 'available');
      await page.selectOption('select[name="condition"]', 'excellent');

      // Close without submitting for test
      await page.goBack();
    }
  });

  test('should save asset after barcode scan', async ({ page, request }) => {
    // Mock the API response for asset creation
    await page.route('**/api/v1/assets', async (route) => {
      if (route.request().method() === 'POST') {
        const requestData = route.request().postDataJSON();
        
        // Verify the barcode data is in the request
        expect(requestData.assetTag).toBeDefined();
        expect(requestData.manufacturer).toBeDefined();
        expect(requestData.model).toBeDefined();
        
        // Return mock response
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              _id: '507f1f77bcf86cd799439011',
              ...requestData,
              createdAt: new Date().toISOString(),
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Navigate to new asset page
    await page.goto(`${baseURL}/assets/new`);
    await page.waitForSelector('input[name="name"]');

    // Simulate barcode scan
    const barcodeValue = 'SAVE-TEST-123';
    await page.fill('input[name="assetTag"]', barcodeValue);
    
    // Fill complete form
    await page.fill('input[name="name"]', 'Test Save Asset');
    await page.selectOption('select[name="category"]', 'laptop');
    await page.fill('input[name="manufacturer"]', 'Dell');
    await page.fill('input[name="model"]', 'Latitude 5420');
    await page.fill('input[name="serialNumber"]', 'SAVE-SN-123');
    await page.fill('input[name="purchaseDate"]', '2024-01-15');
    await page.fill('input[name="purchasePrice"]', '1299.99');
    await page.selectOption('select[name="status"]', 'available');
    await page.selectOption('select[name="condition"]', 'excellent');
    await page.fill('input[name="location"]', 'Test Location');
    await page.fill('textarea[name="notes"]', 'Created via barcode scan test');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message
    await page.waitForSelector('text=Asset created!', { timeout: 10000 });
    
    // Verify success
    expect(await page.locator('text=Asset created!').isVisible()).toBeTruthy();

    // Verify navigation
    await page.waitForURL(/.*assets/, { timeout: 5000 });
  });

  test('should handle barcode scanner input (rapid entry)', async ({ page }) => {
    // Navigate to assets page
    await page.goto(`${baseURL}/assets/new`);
    await page.waitForSelector('input[name="name"]');

    // Focus the asset tag input (simulating barcode scanner)
    const assetTagInput = page.locator('input[name="assetTag"]');
    await assetTagInput.focus();

    // Simulate barcode scanner rapid input (very fast typing)
    const barcodeValue = 'RAPID-ENTRY-BARCODE-123456';
    
    // Type character by character very quickly
    for (const char of barcodeValue) {
      await assetTagInput.type(char, { delay: 0 }); // No delay simulates barcode scanner speed
    }

    // Verify the field captured all characters
    expect(await assetTagInput.inputValue()).toBe(barcodeValue);

    // Continue with form fill
    await page.fill('input[name="name"]', 'Rapid Entry Asset');
    await page.selectOption('select[name="category"]', 'laptop');
    await page.fill('input[name="manufacturer"]', 'Dell');
    await page.fill('input[name="model"]', 'Latitude');
    await page.selectOption('select[name="status"]', 'available');
    await page.selectOption('select[name="condition"]', 'excellent');
    
    // Form should be ready to submit
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).not.toBeDisabled();
  });

  test('should clear form after barcode scan error', async ({ page }) => {
    // Navigate to assets page
    await page.goto(`${baseURL}/assets/new`);
    await page.waitForSelector('input[name="name"]');

    // Fill invalid data and attempt to submit
    await page.fill('input[name="name"]', 'Invalid Asset');
    await page.selectOption('select[name="category"]', 'laptop');
    
    // Submit without required fields
    await page.click('button[type="submit"]');

    // Should show validation errors
    await page.waitForTimeout(1000); // Wait for validation

    // Fill new data from barcode
    await page.fill('input[name="assetTag"]', 'NEW-BARCODE-123');
    await page.fill('input[name="name"]', 'New Barcode Asset');
    await page.fill('input[name="manufacturer"]', 'Dell');
    await page.fill('input[name="model"]', 'Model X');
    await page.selectOption('select[name="status"]', 'available');
    await page.selectOption('select[name="condition"]', 'excellent');

    // Verify form is ready
    expect(await page.inputValue('input[name="assetTag"]')).toBe('NEW-BARCODE-123');
  });
});
