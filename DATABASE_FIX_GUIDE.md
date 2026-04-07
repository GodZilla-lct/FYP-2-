# 🔧 Database Issue - Quick Fix Guide

## Problem: Login Failed (500 Error)

This means the database connection or data is missing.

---

## ✅ Quick Fix Steps

### Step 1: Check MySQL is Running

**Windows:**
```powershell
# Check if MySQL service is running
Get-Service -Name "MySQL*"

# If not running, start it:
Start-Service -Name "MySQL80"  # or your MySQL version
```

**Or use MySQL Workbench/XAMPP/WAMP to start MySQL**

---

### Step 2: Verify Database Exists

Open MySQL command line or MySQL Workbench and run:

```sql
-- Check if database exists
SHOW DATABASES;

-- If 'campus_connect' is not listed, create it:
CREATE DATABASE campus_connect;
```

---

### Step 3: Verify .env Configuration

Check `FYP-2-/.env` file has correct credentials:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=campus_connect
```

**Fix:** Update `DB_PASSWORD` with your actual MySQL root password.

---

### Step 4: Create Tables (if needed)

Run from `FYP-2-` directory:

```bash
node backend/scripts/run_schema.js
```

If you get "Table already exists" error, that's OK - tables exist.

---

### Step 5: Seed Sample Data

Run from `FYP-2-` directory:

```bash
node backend/database/seed_v3.js
```

This creates the admin user and sample data.

---

## 🎯 Most Common Issues

### Issue 1: MySQL Not Running
**Fix:** Start MySQL service
- Windows: Services → MySQL → Start
- XAMPP: Start MySQL from control panel
- WAMP: Start MySQL from tray icon

### Issue 2: Wrong Password in .env
**Fix:** Update `DB_PASSWORD` in `.env` file with your MySQL root password

### Issue 3: Database Doesn't Exist
**Fix:** Create database:
```sql
CREATE DATABASE campus_connect;
```

### Issue 4: No Users in Database
**Fix:** Run seed script:
```bash
cd FYP-2-
node backend/database/seed_v3.js
```

---

## 🔍 Test Database Connection

After fixing, test with:

```bash
# Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"director@uog.edu.pk\",\"password\":\"password123\"}"
```

**Expected:** Should return a token (success)

---

## 📝 Where to Fix

### File 1: `.env` (Database Credentials)
**Location:** `FYP-2-/.env`

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE  ← Fix this
DB_NAME=campus_connect
```

### File 2: MySQL Database
**Action:** Ensure MySQL is running and database exists

```sql
-- In MySQL:
CREATE DATABASE IF NOT EXISTS campus_connect;
USE campus_connect;
```

### File 3: Seed Data
**Location:** `FYP-2-/backend/database/seed_v3.js`
**Action:** Run this to create users

```bash
cd FYP-2-
node backend/database/seed_v3.js
```

---

## ✅ Complete Fix Checklist

- [ ] MySQL service is running
- [ ] Database `campus_connect` exists
- [ ] `.env` has correct `DB_PASSWORD`
- [ ] Tables created (run `run_schema.js`)
- [ ] Sample data seeded (run `seed_v3.js`)
- [ ] Server restarted (`npm start`)
- [ ] Login tested and working

---

## 🆘 Still Not Working?

### Check Server Logs

The server is running in the background. Check for errors:

```powershell
# In PowerShell, check if you see database errors
# Look for messages like:
# - "Access denied for user"
# - "Unknown database"
# - "Connection refused"
```

### Manual Database Test

Test MySQL connection directly:

```bash
mysql -u root -p
# Enter your password
# Then:
USE campus_connect;
SELECT * FROM users;
```

If this works, database is fine. Issue is in `.env` file.

---

## 🎯 Quick Summary

**Most likely fix:**

1. **Update `.env` file:**
   ```env
   DB_PASSWORD=your_actual_mysql_password
   ```

2. **Seed the database:**
   ```bash
   cd FYP-2-
   node backend/database/seed_v3.js
   ```

3. **Restart server:**
   - Server will auto-restart if using `npm run dev`
   - Or stop and run `npm start` again

---

**After fixing, login should work with:**
- Email: director@uog.edu.pk
- Password: password123

