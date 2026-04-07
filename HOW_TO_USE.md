# 🚀 How to Use Campus Connect v4.0

## ✅ SERVER IS ALREADY RUNNING!

**Good news:** The server is operational on port 5001!

---

## 🌐 Access the Application

### Backend API (Already Running)
```
http://localhost:5001
```

### Health Check
```
http://localhost:5001/health
```

### API Endpoints
```
http://localhost:5001/api
```

---

## 🎯 What You Can Do Now

### Option 1: Start the Frontend

```bash
# Open a NEW terminal/PowerShell window
cd "C:\Users\chahm\final year project\FYP-2-\frontend"
npm start
```

Then open your browser to: **http://localhost:3000**

### Option 2: Test the API

```bash
# Test health endpoint
curl http://localhost:5001/health

# Test API (requires authentication)
curl http://localhost:5001/api/societies
```

### Option 3: Login to the Application

Once frontend is running (Option 1):

1. Open browser: http://localhost:3000
2. Login with:
   - **Email:** director@uog.edu.pk
   - **Password:** password123

---

## 📋 Step-by-Step Guide

### Step 1: Verify Backend is Running ✅

The backend is already running! You can verify:

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "OK",
  "version": "4.0"
}
```

### Step 2: Start Frontend (Optional)

Open a **NEW** terminal window:

```bash
# Navigate to frontend directory
cd "C:\Users\chahm\final year project\FYP-2-\frontend"

# Install dependencies (first time only)
npm install

# Start frontend
npm start
```

Frontend will open automatically at: http://localhost:3000

### Step 3: Use the Application

1. **Backend:** http://localhost:5001 ✅ Running
2. **Frontend:** http://localhost:3000 (after Step 2)
3. **Login:** Use credentials above

---

## 🔐 Login Credentials

### Admin (Director SSC)
```
Email:    director@uog.edu.pk
Password: password123
```

### Society President
```
Email:    2021-CS-001@uog.edu.pk
Password: password123
```

---

## 🛠️ Common Commands

### Backend Commands (from FYP-2- directory)

```bash
# Server is already running, but if you need to restart:
npm start

# Development mode (auto-reload)
npm run dev

# Setup database
npm run setup

# Seed sample data
npm run seed
```

### Frontend Commands (from FYP-2-/frontend directory)

```bash
# Start frontend
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## ⚠️ Important Notes

### 1. Directory Matters!

Always run commands from the correct directory:

```bash
# Backend commands - run from FYP-2-/
cd "C:\Users\chahm\final year project\FYP-2-"
npm start

# Frontend commands - run from FYP-2-/frontend/
cd "C:\Users\chahm\final year project\FYP-2-\frontend"
npm start
```

### 2. Server is Already Running

You don't need to start the backend again. It's running on port 5001.

### 3. Two Separate Servers

- **Backend:** Port 5001 (already running)
- **Frontend:** Port 3000 (start when needed)

---

## 🔍 Verify Everything is Working

### Test 1: Backend Health
```bash
curl http://localhost:5001/health
```
✅ Should return: `{"status":"OK"}`

### Test 2: Backend API
```bash
curl http://localhost:5001/api/societies
```
✅ Should return: `401` (authentication required)

### Test 3: Frontend (after starting)
Open browser: http://localhost:3000
✅ Should show login page

---

## 📊 Current Status

| Component | Status | URL |
|-----------|--------|-----|
| Backend | ✅ Running | http://localhost:5001 |
| Frontend | 🔲 Not started | http://localhost:3000 |
| Database | ✅ Connected | localhost:3306 |
| Security | ✅ Enabled | All features active |

---

## 🆘 Troubleshooting

### "npm error enoent package.json"
**Problem:** You're in the wrong directory  
**Solution:** Navigate to FYP-2- directory
```bash
cd "C:\Users\chahm\final year project\FYP-2-"
```

### "Port 5001 already in use"
**Problem:** Server is already running  
**Solution:** No action needed! Server is working.

### "Cannot connect to database"
**Problem:** MySQL not running  
**Solution:** Start MySQL service

### Frontend won't start
**Problem:** Dependencies not installed  
**Solution:**
```bash
cd frontend
npm install
npm start
```

---

## 🎯 Quick Start Checklist

- [x] Backend server running on port 5001
- [x] Security features enabled
- [x] Database connected
- [ ] Frontend started (optional)
- [ ] Logged into application (optional)

---

## 📚 Documentation

- **QUICK_REFERENCE.md** - Quick commands
- **CURRENT_STATUS.md** - Current status
- **API_TESTING_GUIDE.md** - API documentation
- **SECURITY_SUMMARY.md** - Security features

---

## ✅ Summary

**What's Working:**
- ✅ Backend server on port 5001
- ✅ All security features enabled
- ✅ Database connected
- ✅ API endpoints ready

**What You Can Do:**
1. Start frontend: `cd frontend && npm start`
2. Test API: `curl http://localhost:5001/health`
3. Login to app: http://localhost:3000 (after starting frontend)

**No errors, everything is operational!** 🎉

