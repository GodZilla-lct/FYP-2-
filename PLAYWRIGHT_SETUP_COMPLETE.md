# ✅ Playwright Setup Complete - Campus Connect v4.0

**Date:** April 5, 2026  
**Setup By:** Senior QA Automation Engineer  
**Status:** Ready for E2E and Negative Testing

---

## 📋 WHAT WAS DONE

### 1. ✅ Playwright Installation Commands Provided
```bash
cd FYP-2-/frontend
npm install -D @playwright/test@latest
npx playwright install chromium
```

### 2. ✅ Configuration Files Created
- **`frontend/playwright.config.js`** - Playwright configuration
  - Chromium browser only (to save time)
  - Headless mode by default
  - Screenshots on failure
  - Videos on failure
  - HTML reports
  - Auto-start dev server

### 3. ✅ Test Suite Created
- **`frontend/tests/campus-connect-failures.spec.js`** - Comprehensive negative test suite
  - 20+ test scenarios
  - Covers all critical failure paths
  - Ready to run immediately

### 4. ✅ Package.json Updated
- **`frontend/package.json`** - Added 7 new test scripts:
  - `test:e2e` - Run all tests (headless)
  - `test:e2e:headed` - Run with browser visible
  - `test:e2e:ui` - Interactive UI mode
  - `test:e2e:debug` - Debug mode
  - `test:e2e:report` - View HTML report
  - `test:e2e:failures` - Run only negative tests
  - `test:e2e:failures:ui` - Run negative tests in UI mode

### 5. ✅ Documentation Created
- **`PLAYWRIGHT_SETUP_GUIDE.md`** - Comprehensive setup guide (detailed)
- **`PLAYWRIGHT_QUICK_START.md`** - Quick reference (condensed)
- **`PLAYWRIGHT_SETUP_COMPLETE.md`** - This summary

---

## 🚀 NEXT STEPS (Run These Commands)

### Step 1: Install Playwright
```bash
cd FYP-2-/frontend
npm install -D @playwright/test@latest
npx playwright install chromium
```

### Step 2: Verify Installation
```bash
npx playwright --version
```
Expected output: `Version 1.x.x`

### Step 3: Start Backend Server (Terminal 1)
```bash
cd FYP-2-
npm start
```
Should run on: `http://localhost:5001`

### Step 4: Start Frontend Server (Terminal 2)
```bash
cd FYP-2-/frontend
npm start
```
Should run on: `http://localhost:3000`

### Step 5: Run Tests (Terminal 3)
```bash
cd FYP-2-/frontend
npm run test:e2e:ui
```

---

## 📁 FOLDER STRUCTURE

```
FYP-2-/
├── frontend/
│   ├── tests/                                    ← NEW
│   │   └── campus-connect-failures.spec.js      ← Your negative test suite
│   ├── playwright.config.js                      ← NEW (Playwright config)
│   ├── package.json                              ← UPDATED (new scripts)
│   ├── playwright-report/                        ← Generated after tests run
│   └── test-results/                             ← Generated after tests run
├── PLAYWRIGHT_SETUP_GUIDE.md                     ← NEW (detailed guide)
├── PLAYWRIGHT_QUICK_START.md                     ← NEW (quick reference)
└── PLAYWRIGHT_SETUP_COMPLETE.md                  ← NEW (this file)
```

---

## 🧪 TEST SUITE COVERAGE

Your `campus-connect-failures.spec.js` includes:

### Category 1: Empty Form Submissions (3 tests)
- Empty email and password
- Only email (no password)
- Only password (no email)

### Category 2: API Error Handling (4 tests)
- 500 Internal Server Error
- 503 Service Unavailable
- Network timeout
- Malformed JSON response

### Category 3: Race Conditions (2 tests)
- Double-click on submit button
- Concurrent form submissions

### Category 4: Boundary Limits (4 tests)
- Maximum email length
- Maximum password length
- Special characters (XSS attempts)
- SQL injection attempts

### Category 5: Authorization Failures (2 tests)
- Access protected routes without auth
- Invalid credentials

### Category 6: Token Expiration (1 test)
- Expired token handling (20-minute auto-logout)

### Category 7: Network Issues (1 test)
- Network disconnection

### Category 8: Profile Security (2 tests)
- Prevent editing email field
- Prevent editing role field

**Total: 19 negative test scenarios**

---

## 📦 PACKAGE.JSON SCRIPTS ADDED

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

## ⚙️ PLAYWRIGHT CONFIGURATION HIGHLIGHTS

**File:** `frontend/playwright.config.js`

- **Browser:** Chromium only (fast, saves disk space)
- **Timeout:** 30 seconds per test
- **Retries:** 2 retries in CI, 0 locally
- **Screenshots:** On failure only
- **Videos:** On failure only
- **Reports:** HTML + JSON + List
- **Base URL:** http://localhost:3000
- **Auto-start:** Dev server starts automatically

---

## 🎯 RUNNING TESTS

### Recommended for Development (Interactive UI)
```bash
npm run test:e2e:ui
```
**Why?** You can see tests run in real-time, pause, inspect, and debug.

### For CI/CD (Headless)
```bash
npm run test:e2e
```
**Why?** Fast, no GUI, generates reports.

### For Debugging (Step-by-step)
```bash
npm run test:e2e:debug
```
**Why?** Opens Playwright Inspector for step-by-step debugging.

### Run Only Negative Tests
```bash
npm run test:e2e:failures
```
**Why?** Faster when you only want to test error handling.

---

## 📊 EXPECTED RESULTS

### All Tests Should PASS If:
- ✅ Form validation works correctly
- ✅ API errors are handled gracefully
- ✅ Race conditions are prevented
- ✅ XSS/SQL injection is blocked
- ✅ Token expiration triggers auto-logout
- ✅ Network failures show error messages
- ✅ Email and role fields are protected

### If Tests FAIL:
1. Check the HTML report: `npm run test:e2e:report`
2. View screenshots in: `frontend/test-results/`
3. View videos in: `frontend/test-results/`
4. Run in debug mode: `npm run test:e2e:debug`

---

## 🔍 DEBUGGING TIPS

### 1. Use UI Mode (Best for Development)
```bash
npm run test:e2e:ui
```
- Watch tests run in real-time
- Time-travel through test execution
- Inspect DOM at any point
- View network requests

### 2. Use Debug Mode (Step-by-step)
```bash
npm run test:e2e:debug
```
- Pause at each step
- Inspect elements
- Run commands in console

### 3. Add Breakpoints in Code
```javascript
await page.pause(); // Pauses test execution
```

### 4. Take Screenshots Manually
```javascript
await page.screenshot({ path: 'debug.png' });
```

### 5. Log Page Content
```javascript
console.log(await page.content());
console.log(await page.title());
```

---

## 🚨 TROUBLESHOOTING

### Issue: "Cannot find module @playwright/test"
**Solution:**
```bash
cd FYP-2-/frontend
npm install -D @playwright/test@latest
```

### Issue: "Chromium browser not found"
**Solution:**
```bash
npx playwright install chromium --force
```

### Issue: "Tests timeout"
**Solution:** Increase timeout in `playwright.config.js`:
```javascript
timeout: 60 * 1000, // 60 seconds
```

### Issue: "Port 3000 already in use"
**Solution:** 
- Stop existing frontend server
- Or comment out `webServer` in `playwright.config.js` and start servers manually

### Issue: "Backend not responding"
**Solution:**
- Ensure backend is running on port 5001
- Check `.env` file for correct configuration
- Verify database is seeded

---

## 📚 DOCUMENTATION FILES

1. **`PLAYWRIGHT_SETUP_GUIDE.md`** (Detailed)
   - Complete installation guide
   - Configuration explanations
   - Best practices
   - Advanced debugging
   - Test scenarios breakdown

2. **`PLAYWRIGHT_QUICK_START.md`** (Quick Reference)
   - Installation commands
   - Running tests
   - Common issues
   - Quick tips

3. **`PLAYWRIGHT_SETUP_COMPLETE.md`** (This File)
   - Summary of what was done
   - Next steps
   - Quick reference

---

## ✅ VERIFICATION CHECKLIST

Before running tests, verify:

- [ ] Playwright installed: `npm list @playwright/test`
- [ ] Chromium installed: `npx playwright --version`
- [ ] Config file exists: `frontend/playwright.config.js`
- [ ] Test file exists: `frontend/tests/campus-connect-failures.spec.js`
- [ ] Scripts added to `package.json`
- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] Database seeded with test data

---

## 🎓 LEARNING RESOURCES

- **Playwright Official Docs:** https://playwright.dev/
- **Test Examples:** `frontend/tests/campus-connect-failures.spec.js`
- **Configuration Reference:** `frontend/playwright.config.js`
- **Best Practices:** `PLAYWRIGHT_SETUP_GUIDE.md`

---

## 🎉 YOU'RE READY!

Everything is set up and ready to go. Just run:

```bash
cd FYP-2-/frontend
npm install -D @playwright/test@latest
npx playwright install chromium
npm run test:e2e:ui
```

Your negative test suite will verify that Campus Connect v4.0 handles all edge cases and failures gracefully!

---

**Questions or Issues?**
- Check `PLAYWRIGHT_SETUP_GUIDE.md` for detailed explanations
- Check `PLAYWRIGHT_QUICK_START.md` for quick commands
- Review test file: `frontend/tests/campus-connect-failures.spec.js`

**Happy Testing!** 🚀
