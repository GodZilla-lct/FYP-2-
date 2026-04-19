# 🔧 Login Error Troubleshooting Guide

## Problem: Network Error When Trying to Login

### ✅ Solution Applied

**Issue:** Frontend was trying to connect to wrong backend URL  
**Fix:** Created `frontend/.env` file with correct backend URL

---

## 🚀 Steps to Fix

### 1. **Stop All Servers**
```powershell
# Press Ctrl+C in both terminal windows (backend and frontend)
# Or run:
.\stop-servers.ps1
```

### 2. **Restart Backend Server**
```powershell
cd FYP-2-
node server.js
```

**Expected Output:**
```
✓ Server running on port 5001
✓ Environment: development
✓ API: http://localhost:5001/api
```

### 3. **Restart Frontend Server**
```powershell
# Open NEW terminal window
cd FYP-2-/frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
Local: http://localhost:3000
```

### 4. **Test Login**
- Go to http://localhost:3000
- Try logging in with:
  - **Email:** admin@uog.edu.pk
  - **Password:** admin123

---

## 🔍 Common Issues & Solutions

### Issue 1: "Network Error" or "Failed to Fetch"

**Cause:** Backend not running or wrong URL

**Solution:**
1. Check backend is running on port 5001
2. Check `FYP-2-/frontend/.env` has:
   ```
   REACT_APP_API_URL=http://localhost:5001/api
   ```
3. Restart frontend after changing .env

---

### Issue 2: "CORS Error"

**Cause:** Backend CORS not configured for frontend URL

**Solution:**
Check `FYP-2-/.env` has:
```
FRONTEND_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000
```

---

### Issue 3: "Invalid Credentials"

**Cause:** User doesn't exist in database

**Solution:**
Run seed script:
```powershell
cd FYP-2-
node backend/database/seed.js
```

---

### Issue 4: Backend Port Conflict

**Cause:** Port 5001 already in use

**Solution:**
```powershell
# Find process using port 5001
netstat -ano | findstr :5001

# Kill the process (replace <PID> with actual process ID)
taskkill /PID <PID> /F

# Or change port in FYP-2-/.env
PORT=5002
```

---

## 📋 Quick Checklist

Before trying to login, verify:

- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] `FYP-2-/.env` has `PORT=5001`
- [ ] `FYP-2-/frontend/.env` has `REACT_APP_API_URL=http://localhost:5001/api`
- [ ] Database is running (MySQL)
- [ ] Database has users (run seed.js if needed)
- [ ] No console errors in browser (F12 → Console)

---

## 🧪 Test Backend Directly

Test if backend is responding:

### Method 1: Browser
Open: http://localhost:5001/health

**Expected Response:**
```json
{
  "status": "OK",
  "version": "4.0",
  "timestamp": "2026-04-18T..."
}
```

### Method 2: PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/health"
```

### Method 3: Test Login Endpoint
```powershell
$body = @{
    email = "admin@uog.edu.pk"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

---

## 🔍 Check Browser Console

1. Open browser (Chrome/Edge)
2. Press **F12** to open Developer Tools
3. Go to **Console** tab
4. Try logging in
5. Look for errors:

**Good (No Errors):**
```
POST http://localhost:5001/api/auth/login 200 OK
```

**Bad (Network Error):**
```
POST http://localhost:5001/api/auth/login net::ERR_CONNECTION_REFUSED
```
→ Backend not running

**Bad (404 Error):**
```
POST http://localhost:5000/api/auth/login 404 Not Found
```
→ Wrong port (should be 5001)

---

## 📞 Still Having Issues?

### Check Backend Logs
Look at the terminal where backend is running for errors like:
- Database connection errors
- Port already in use
- Missing environment variables

### Check Database
```powershell
# Connect to MySQL
mysql -u root -p

# Check if database exists
SHOW DATABASES;

# Check if users table has data
USE campus_connect;
SELECT id, email, role FROM users LIMIT 5;
```

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Backend shows "Server running on port 5001"
- ✅ Frontend shows "Compiled successfully"
- ✅ Browser console shows no errors
- ✅ Login redirects to dashboard
- ✅ You see your name in the header

---

## 🎯 Quick Fix Summary

**The main fix was creating `FYP-2-/frontend/.env` with:**
```
REACT_APP_API_URL=http://localhost:5001/api
```

**Now:**
1. Restart both servers
2. Try logging in again
3. Should work! ✅

---

**Last Updated:** April 18, 2026  
**Issue:** Network error on login  
**Status:** ✅ FIXED
