# Playwright Quick Start - Campus Connect v4.0

## 🚀 Installation Commands

Run these commands in order:

```bash
# Step 1: Navigate to frontend directory
cd FYP-2-/frontend

# Step 2: Install Playwright
npm install -D @playwright/test@latest

# Step 3: Install Chromium browser only
npx playwright install chromium

# Step 4: Verify installation
npx playwright --version
```

---

## 📁 Folder Structure

After installation, your structure will be:

```
FYP-2-/frontend/
├── tests/                                    ← NEW
│   └── campus-connect-failures.spec.js      ← Your negative tests
├── playwright.config.js                      ← NEW
├── package.json                              ← UPDATED
└── ...
```

---

## 📦 Updated package.json Scripts

Your `frontend/package.json` now includes:

```json
{
  "scripts": {
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

---

## 🧪 Running Tests

### Option 1: Run All Tests (Headless)
```bash
npm run test:e2e
```

### Option 2: Run with UI Mode (Recommended for Development)
```bash
npm run test:e2e:ui
```

### Option 3: Run Only Negative Tests
```bash
npm run test:e2e:failures
```

### Option 4: Run with Browser Visible
```bash
npm run test:e2e:headed
```

### Option 5: Debug Mode (Step-by-step)
```bash
npm run test:e2e:debug
```

### Option 6: View Test Report
```bash
npm run test:e2e:report
```

---

## ✅ Pre-Test Checklist

Before running tests, ensure:

1. **Backend is running:**
   ```bash
   cd FYP-2-
   npm start
   ```
   Should be on: `http://localhost:5001`

2. **Frontend is running:**
   ```bash
   cd FYP-2-/frontend
   npm start
   ```
   Should be on: `http://localhost:3000`

3. **Database is seeded:**
   ```bash
   cd FYP-2-
   npm run seed
   ```

---

## 📊 Test Coverage

The `campus-connect-failures.spec.js` file includes:

### 1. Empty Form Submissions
- ✅ Empty email and password
- ✅ Only email (no password)
- ✅ Only password (no email)

### 2. API Error Handling
- ✅ 500 Internal Server Error
- ✅ 503 Service Unavailable
- ✅ Network timeout
- ✅ Malformed JSON response

### 3. Race Conditions
- ✅ Double-click on submit button
- ✅ Concurrent form submissions

### 4. Boundary Limits
- ✅ Maximum email length
- ✅ Maximum password length
- ✅ Special characters (XSS attempts)
- ✅ SQL injection attempts

### 5. Authorization Failures
- ✅ Access protected routes without auth
- ✅ Invalid credentials

### 6. Token Expiration
- ✅ Expired token handling (20-minute auto-logout)

### 7. Network Issues
- ✅ Network disconnection

### 8. Profile Security
- ✅ Prevent editing email field
- ✅ Prevent editing role field

---

## 🎯 Expected Test Results

All tests should **PASS** if your application properly handles:
- Form validation
- API errors
- Race conditions
- Security vulnerabilities
- Token expiration
- Network failures

---

## 🔍 Debugging Failed Tests

If a test fails:

1. **Run in UI mode:**
   ```bash
   npm run test:e2e:ui
   ```

2. **Run in debug mode:**
   ```bash
   npm run test:e2e:debug
   ```

3. **Check the HTML report:**
   ```bash
   npm run test:e2e:report
   ```

4. **View screenshots:**
   - Located in: `frontend/test-results/`

5. **View videos:**
   - Located in: `frontend/test-results/`

---

## 📝 Customizing Tests

To add your own tests, edit:
```
FYP-2-/frontend/tests/campus-connect-failures.spec.js
```

Example test structure:
```javascript
test('should handle my custom scenario', async ({ page }) => {
  await page.goto('/');
  // Your test code here
  await expect(page.locator('selector')).toBeVisible();
});
```

---

## 🚨 Common Issues

### Issue: "Cannot find module @playwright/test"
**Solution:**
```bash
cd FYP-2-/frontend
npm install -D @playwright/test@latest
```

### Issue: "Browser not found"
**Solution:**
```bash
npx playwright install chromium
```

### Issue: "Tests timeout"
**Solution:** Increase timeout in `playwright.config.js`:
```javascript
timeout: 60 * 1000, // 60 seconds
```

### Issue: "Port 3000 already in use"
**Solution:** Stop existing frontend server or change port in config

---

## 📚 Additional Resources

- **Full Setup Guide:** `PLAYWRIGHT_SETUP_GUIDE.md`
- **Playwright Docs:** https://playwright.dev/
- **Test Examples:** `frontend/tests/campus-connect-failures.spec.js`

---

**Ready to test!** 🎉

Run `npm run test:e2e:ui` to see your tests in action.
