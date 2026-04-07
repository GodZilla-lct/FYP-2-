# Playwright E2E Testing Setup Guide
## Campus Connect v4.0 - QA Automation

---

## 📋 STEP 1: PLAYWRIGHT INSTALLATION

Run these commands in your terminal from the **frontend directory**:

```bash
cd FYP-2-/frontend
npm install -D @playwright/test@latest
npx playwright install chromium
```

**What this does:**
- Installs Playwright test runner as a dev dependency
- Downloads Chromium browser binaries (only Chromium to save time and disk space)
- Creates default configuration files

**Alternative (if you want the init wizard):**
```bash
cd FYP-2-/frontend
npm init playwright@latest
```
When prompted:
- ✅ Choose "TypeScript or JavaScript" → **JavaScript**
- ✅ Where to put tests? → **tests** (default)
- ✅ Add GitHub Actions workflow? → **No** (for now)
- ✅ Install Playwright browsers? → **Yes, only Chromium**

---

## 📁 STEP 2: PROJECT STRUCTURE

After installation, your frontend folder structure will look like this:

```
FYP-2-/frontend/
├── node_modules/
├── public/
├── src/
├── tests/                          ← NEW (Playwright tests)
│   ├── campus-connect-failures.spec.js  ← Your negative test suite
│   └── example.spec.js             ← Default example (can delete)
├── playwright.config.js            ← NEW (Playwright configuration)
├── package.json                    ← UPDATED (new scripts)
└── package-lock.json
```

**Where to create your test file:**
```
FYP-2-/frontend/tests/campus-connect-failures.spec.js
```

---

## ⚙️ STEP 3: PLAYWRIGHT CONFIGURATION

The `playwright.config.js` file will be auto-generated. Here's the recommended configuration for Campus Connect:

**File:** `FYP-2-/frontend/playwright.config.js`

```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  
  // Maximum time one test can run
  timeout: 30 * 1000,
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for your application
    baseURL: 'http://localhost:3000',
    
    // Collect trace on failure for debugging
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // API testing context
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Uncomment these when you want to test on more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting tests
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

---

## 📦 STEP 4: PACKAGE.JSON SCRIPTS

Add these scripts to your `frontend/package.json`:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:e2e:failures": "playwright test campus-connect-failures.spec.js",
    "test:e2e:failures:ui": "playwright test campus-connect-failures.spec.js --ui"
  }
}
```

**Script Explanations:**
- `test:e2e` - Run all tests in headless mode (CI/CD ready)
- `test:e2e:headed` - Run tests with browser visible (see what's happening)
- `test:e2e:ui` - Open Playwright UI mode (interactive debugging)
- `test:e2e:debug` - Run tests in debug mode with Playwright Inspector
- `test:e2e:report` - Open HTML test report
- `test:e2e:failures` - Run only the negative test suite
- `test:e2e:failures:ui` - Run negative tests in UI mode

---

## 🧪 STEP 5: CREATE YOUR TEST FILE

Create the file at: `FYP-2-/frontend/tests/campus-connect-failures.spec.js`

**Template structure** (you mentioned you have the code ready):

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Campus Connect - Negative Testing Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('http://localhost:3000');
  });

  test('should handle empty form submission gracefully', async ({ page }) => {
    // Your test code here
  });

  test('should handle 500 API error with proper error message', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    // Your test code here
  });

  test('should handle race conditions in concurrent requests', async ({ page }) => {
    // Your test code here
  });

  test('should enforce boundary limits on input fields', async ({ page }) => {
    // Your test code here
  });

});
```

---

## 🚀 STEP 6: RUNNING THE TESTS

### Option 1: Headless Mode (CI/CD)
```bash
cd FYP-2-/frontend
npm run test:e2e
```

### Option 2: UI Mode (Interactive Debugging)
```bash
cd FYP-2-/frontend
npm run test:e2e:ui
```

### Option 3: Run Only Negative Tests
```bash
cd FYP-2-/frontend
npm run test:e2e:failures
```

### Option 4: Debug Mode (Step-by-step)
```bash
cd FYP-2-/frontend
npm run test:e2e:debug
```

### Option 5: View Test Report
```bash
cd FYP-2-/frontend
npm run test:e2e:report
```

---

## 📊 TEST REPORTS

After running tests, Playwright generates reports in:
```
FYP-2-/frontend/playwright-report/
FYP-2-/frontend/test-results/
```

**HTML Report Features:**
- ✅ Test execution timeline
- ✅ Screenshots on failure
- ✅ Video recordings
- ✅ Network logs
- ✅ Console logs
- ✅ Trace viewer (step-by-step replay)

---

## 🔍 DEBUGGING TIPS

### 1. Use Playwright Inspector
```bash
npm run test:e2e:debug
```
This opens a GUI where you can:
- Step through each test action
- Inspect DOM elements
- View network requests
- See console logs

### 2. Use UI Mode (Recommended)
```bash
npm run test:e2e:ui
```
This opens an interactive UI where you can:
- Run tests individually
- Watch tests in real-time
- Time-travel through test execution
- Inspect failures instantly

### 3. Add Debug Statements
```javascript
await page.pause(); // Pauses test execution
console.log(await page.title()); // Log page title
await page.screenshot({ path: 'debug.png' }); // Take screenshot
```

---

## 🎯 NEGATIVE TEST SCENARIOS TO COVER

Based on Campus Connect v4.0, here are the critical negative tests:

### Authentication Failures
- ✅ Empty email/password submission
- ✅ Invalid email format
- ✅ Wrong credentials (401)
- ✅ Server error (500)
- ✅ Network timeout
- ✅ Token expiration (20-minute auto-logout)

### Authorization Failures
- ✅ Student accessing admin routes
- ✅ Unauthenticated user accessing protected routes
- ✅ Role spoofing attempts (sending role: "VC" in request)

### Form Validation
- ✅ Boundary limits (max length, min length)
- ✅ Special characters in input
- ✅ SQL injection attempts
- ✅ XSS attempts
- ✅ Empty required fields

### API Failures
- ✅ 500 Internal Server Error
- ✅ 503 Service Unavailable
- ✅ Network disconnection
- ✅ Slow API responses (timeout)
- ✅ Malformed JSON responses

### Race Conditions
- ✅ Concurrent form submissions
- ✅ Double-click on submit button
- ✅ Rapid navigation between pages

### File Upload Failures
- ✅ File too large (>10MB)
- ✅ Invalid file type
- ✅ Corrupted file
- ✅ No file selected

---

## 📝 BEST PRACTICES

### 1. Test Isolation
Each test should be independent and not rely on other tests.

```javascript
test.beforeEach(async ({ page }) => {
  // Reset state before each test
  await page.goto('http://localhost:3000');
  await page.evaluate(() => localStorage.clear());
});
```

### 2. Use Page Object Model (POM)
Create reusable page objects for common actions:

```javascript
// pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
```

### 3. Use Fixtures for Test Data
```javascript
const testUsers = {
  admin: { email: 'director.ssc@uog.edu.pk', password: 'password123' },
  president: { email: 'president.hbs@uog.edu.pk', password: 'password123' },
};
```

### 4. Mock API Responses
```javascript
await page.route('**/api/**', route => {
  route.fulfill({
    status: 500,
    body: JSON.stringify({ error: 'Server error' })
  });
});
```

---

## 🔧 TROUBLESHOOTING

### Issue: Tests fail with "Target closed"
**Solution:** Increase timeout in `playwright.config.js`
```javascript
timeout: 60 * 1000, // 60 seconds
```

### Issue: "Cannot find module @playwright/test"
**Solution:** Reinstall Playwright
```bash
npm install -D @playwright/test@latest
```

### Issue: Browser not launching
**Solution:** Reinstall browser binaries
```bash
npx playwright install chromium --force
```

### Issue: Tests pass locally but fail in CI
**Solution:** Add retry logic
```javascript
retries: process.env.CI ? 2 : 0,
```

---

## ✅ VERIFICATION CHECKLIST

Before running your test suite, verify:

- [ ] Playwright installed: `npm list @playwright/test`
- [ ] Chromium browser installed: `npx playwright --version`
- [ ] Config file exists: `frontend/playwright.config.js`
- [ ] Test directory exists: `frontend/tests/`
- [ ] Scripts added to `package.json`
- [ ] Backend server running on port 5001
- [ ] Frontend server running on port 3000

---

## 🎓 NEXT STEPS

1. **Install Playwright** (Step 1 commands)
2. **Verify installation** with example test
3. **Create your negative test suite** in `tests/campus-connect-failures.spec.js`
4. **Run tests in UI mode** to see them in action
5. **Integrate with CI/CD** (GitHub Actions, Jenkins, etc.)

---

**Ready to proceed!** 🚀

Once you run the installation commands, you can paste your negative test suite code into the `campus-connect-failures.spec.js` file, and I'll help you refine it if needed.
