/**
 * E2E Test: Authentication Flow
 * Tests login, logout, and protected routes
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const baseURL = process.env.VITE_API_URL || 'http://localhost:5173';

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await expect(page).toHaveURL(/.*login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    await page.fill('input[name="email"]', 'admin@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/.*\/$/, { timeout: 5000 });
    
    // Verify token is stored
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto(`${baseURL}/login`);
    
    await page.fill('input[name="email"]', 'invalid@company.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=/invalid|error/i', { timeout: 3000 });
    
    // Should still be on login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Login first
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'admin@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/$/, { timeout: 5000 });
    
    // Logout
    await page.click('button:has-text("Logout"), [aria-label*="logout" i]');
    await page.waitForURL(/.*login/, { timeout: 3000 });
    
    // Verify token is removed
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();
  });

  test('should persist session on page refresh', async ({ page }) => {
    // Login
    await page.goto(`${baseURL}/login`);
    await page.fill('input[name="email"]', 'admin@company.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/$/, { timeout: 5000 });
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).not.toHaveURL(/.*login/);
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });
});

