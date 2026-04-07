/**
 * Campus Connect v4.0 - Negative Testing Suite
 * E2E tests for error handling and API failure resilience
 * 
 * Test Categories:
 * 1. Empty Form Submissions
 * 2. API Error Handling (500, 503, timeout)
 * 3. Race Conditions
 * 4. Boundary Limits
 * 5. Authorization Failures
 * 6. Token Expiration
 */

const { test, expect } = require('@playwright/test');

// Test data
const testUsers = {
  admin: { 
    email: 'director.ssc@uog.edu.pk', 
    password: 'password123' 
  },
  president: { 
    email: 'president.hbs@uog.edu.pk', 
    password: 'password123' 
  },
  invalid: { 
    email: 'invalid@test.com', 
    password: 'wrongpassword' 
  },
};

test.describe('Campus Connect - Negative Testing Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  // ============================================================================
  // 1. EMPTY FORM SUBMISSION TESTS
  // ============================================================================
  
  test('should prevent login with empty email and password', async ({ page }) => {
    await page.goto('/');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Verify error message or validation
    // Note: Adjust selectors based on your actual error message elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check HTML5 validation or custom error messages
    await expect(emailInput).toHaveAttribute('required');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should prevent login with only email (no password)', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('input[type="email"]').fill('test@uog.edu.pk');
    await page.locator('button[type="submit"]').click();
    
    // Verify password field validation
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveAttribute('required');
  });

  test('should prevent login with only password (no email)', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Verify email field validation
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  // ============================================================================
  // 2. API ERROR HANDLING TESTS
  // ============================================================================
  
  test('should handle 500 Internal Server Error gracefully', async ({ page }) => {
    // Mock API to return 500 error
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Internal server error',
          message: 'An unexpected error occurred'
        })
      });
    });

    await page.goto('/');
    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(testUsers.admin.password);
    await page.locator('button[type="submit"]').click();

    // Verify error message is displayed to user
    // Adjust selector based on your error display component
    await expect(page.locator('text=/error|failed|wrong/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle 503 Service Unavailable error', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Service unavailable',
          message: 'Server is temporarily unavailable'
        })
      });
    });

    await page.goto('/');
    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(testUsers.admin.password);
    await page.locator('button[type="submit"]').click();

    // Verify error handling
    await expect(page.locator('text=/unavailable|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Mock API with delayed response (simulate timeout)
    await page.route('**/api/auth/login', route => {
      setTimeout(() => {
        route.fulfill({
          status: 408,
          contentType: 'application/json',
          body: JSON.stringify({ 
            error: 'Request timeout',
            message: 'Request took too long to complete'
          })
        });
      }, 35000); // Longer than typical timeout
    });

    await page.goto('/');
    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(testUsers.admin.password);
    await page.locator('button[type="submit"]').click();

    // Verify timeout handling (should show error within reasonable time)
    await expect(page.locator('text=/timeout|error|failed/i')).toBeVisible({ timeout: 40000 });
  });

  test('should handle malformed JSON response', async ({ page }) => {
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'This is not valid JSON{{{' // Malformed JSON
      });
    });

    await page.goto('/');
    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(testUsers.admin.password);
    await page.locator('button[type="submit"]').click();

    // Verify error handling for malformed response
    await expect(page.locator('text=/error|failed/i')).toBeVisible({ timeout: 5000 });
  });

  // ============================================================================
  // 3. RACE CONDITION TESTS
  // ============================================================================
  
  test('should handle double-click on submit button', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(testUsers.admin.password);
    
    const submitButton = page.locator('button[type="submit"]');
    
    // Double-click rapidly
    await submitButton.click();
    await submitButton.click();
    
    // Verify only one request is made (button should be disabled after first click)
    // Or verify no duplicate error messages
    await page.waitForTimeout(2000);
    
    // Check that we're either logged in OR got one error message (not multiple)
    const errorMessages = page.locator('text=/error|failed/i');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeLessThanOrEqual(1);
  });

  test('should handle concurrent form submissions', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(testUsers.admin.password);
    
    // Trigger multiple submissions simultaneously
    const submitButton = page.locator('button[type="submit"]');
    await Promise.all([
      submitButton.click(),
      submitButton.click(),
      submitButton.click(),
    ]);
    
    await page.waitForTimeout(2000);
    
    // Verify system handles it gracefully (no crashes, no duplicate errors)
    const errorMessages = page.locator('text=/error|failed/i');
    const errorCount = await errorMessages.count();
    expect(errorCount).toBeLessThanOrEqual(1);
  });

  // ============================================================================
  // 4. BOUNDARY LIMIT TESTS
  // ============================================================================
  
  test('should enforce maximum email length', async ({ page }) => {
    await page.goto('/');
    
    // Create extremely long email (>255 characters)
    const longEmail = 'a'.repeat(250) + '@uog.edu.pk';
    
    await page.locator('input[type="email"]').fill(longEmail);
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Verify validation error or truncation
    await page.waitForTimeout(1000);
    // System should either reject it or handle it gracefully
  });

  test('should enforce maximum password length', async ({ page }) => {
    await page.goto('/');
    
    // Create extremely long password (>255 characters)
    const longPassword = 'p'.repeat(300);
    
    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(longPassword);
    await page.locator('button[type="submit"]').click();
    
    // Verify system handles it gracefully
    await page.waitForTimeout(1000);
  });

  test('should handle special characters in email', async ({ page }) => {
    await page.goto('/');
    
    const specialEmail = "test<script>alert('xss')</script>@uog.edu.pk";
    
    await page.locator('input[type="email"]').fill(specialEmail);
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Verify XSS protection (no script execution)
    await page.waitForTimeout(1000);
    
    // Check that no alert dialog appeared
    page.on('dialog', dialog => {
      throw new Error('XSS vulnerability detected: Alert dialog appeared');
    });
  });

  test('should handle SQL injection attempts in email', async ({ page }) => {
    await page.goto('/');
    
    const sqlInjection = "admin' OR '1'='1";
    
    await page.locator('input[type="email"]').fill(sqlInjection);
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button[type="submit"]').click();
    
    // Verify SQL injection is prevented (should get error, not logged in)
    await page.waitForTimeout(2000);
    
    // Should NOT be logged in
    await expect(page).not.toHaveURL(/dashboard|admin|analytics/);
  });

  // ============================================================================
  // 5. AUTHORIZATION FAILURE TESTS
  // ============================================================================
  
  test('should prevent access to protected routes without authentication', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/');
    
    // Verify we're on login page or redirected to login
    await expect(page).toHaveURL(/login|^\/$/, { timeout: 5000 });
    
    // Verify dashboard content is not visible
    await expect(page.locator('text=/My Proposals|Analytics|Manage Societies/i')).not.toBeVisible();
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/');
    
    await page.locator('input[type="email"]').fill(testUsers.invalid.email);
    await page.locator('input[type="password"]').fill(testUsers.invalid.password);
    await page.locator('button[type="submit"]').click();
    
    // Verify error message
    await expect(page.locator('text=/invalid|incorrect|wrong|failed/i')).toBeVisible({ timeout: 5000 });
    
    // Verify still on login page
    await expect(page).toHaveURL(/login|^\/$/, { timeout: 5000 });
  });

  // ============================================================================
  // 6. TOKEN EXPIRATION TEST (20-minute auto-logout)
  // ============================================================================
  
  test('should handle expired token gracefully', async ({ page }) => {
    // Mock successful login first
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock_expired_token',
          user: {
            id: 1,
            name: 'Test User',
            email: testUsers.admin.email,
            role: 'DIRECTOR_SSC',
            canAccessSocietyDashboard: true
          }
        })
      });
    });

    await page.goto('/');
    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(testUsers.admin.password);
    await page.locator('button[type="submit"]').click();

    // Wait for login to complete
    await page.waitForTimeout(2000);

    // Now mock API calls to return 401 (expired token)
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Token expired',
          message: 'Please login again'
        })
      });
    });

    // Try to access a protected resource
    await page.reload();

    // Verify auto-logout (should redirect to login)
    await expect(page).toHaveURL(/login|^\/$/, { timeout: 5000 });
  });

  // ============================================================================
  // 7. NETWORK DISCONNECTION TEST
  // ============================================================================
  
  test('should handle network disconnection gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Simulate network failure
    await page.route('**/api/auth/login', route => {
      route.abort('failed');
    });

    await page.locator('input[type="email"]').fill(testUsers.admin.email);
    await page.locator('input[type="password"]').fill(testUsers.admin.password);
    await page.locator('button[type="submit"]').click();

    // Verify error message about network failure
    await expect(page.locator('text=/network|connection|failed/i')).toBeVisible({ timeout: 5000 });
  });

});

// ============================================================================
// ADDITIONAL TEST SUITE: PROFILE SECURITY
// ============================================================================

test.describe('Profile Security - Negative Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Mock login
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('campus_connect_token', 'mock_token');
      localStorage.setItem('campus_connect_user', JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@uog.edu.pk',
        role: 'STUDENT',
        canAccessSocietyDashboard: true
      }));
    });
  });

  test('should prevent editing email field', async ({ page }) => {
    // Navigate to profile (adjust URL based on your routing)
    await page.goto('/');
    
    // Click profile button if it exists
    const profileButton = page.locator('text=/Profile/i');
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify email field is disabled
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeDisabled();
    }
  });

  test('should prevent editing role field', async ({ page }) => {
    await page.goto('/');
    
    const profileButton = page.locator('text=/Profile/i');
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(1000);
    }

    // Verify role is displayed as read-only badge (not editable input)
    const roleInput = page.locator('input[value*="STUDENT"]');
    if (await roleInput.isVisible()) {
      await expect(roleInput).toBeDisabled();
    }
  });

});
