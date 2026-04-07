# ⚠️ IMPORTANT: Always Run Commands from FYP-2- Directory!

## 🚨 Common Error

If you see this error:
```
npm error path C:\Users\chahm\final year project\package.json
npm error errno -4058
npm error enoent Could not read package.json
```

**You are in the WRONG directory!**

---

## ✅ Correct Directory

Always run npm commands from the **FYP-2-** directory:

```bash
# WRONG ❌
C:\Users\chahm\final year project> npm start

# CORRECT ✅
C:\Users\chahm\final year project\FYP-2-> npm start
```

---

## 🔧 How to Fix

### Option 1: Change Directory
```bash
cd FYP-2-
npm start
```

### Option 2: Use Full Path
```bash
cd "C:\Users\chahm\final year project\FYP-2-"
npm start
```

---

## 📁 Directory Structure

```
C:\Users\chahm\final year project\
├── FYP-1-/                    ← Different project
└── FYP-2-/                    ← YOUR PROJECT (run commands here!)
    ├── package.json           ← This is what npm needs
    ├── server.js
    ├── backend/
    ├── frontend/
    └── ...
```

---

## ✅ Server Status

**The server is ALREADY RUNNING!**

You don't need to start it again. It's running on:
- **Port:** 5001
- **URL:** http://localhost:5001
- **Health:** http://localhost:5001/health

---

## 🎯 Quick Commands (from FYP-2- directory)

```bash
# Check if you're in the right directory
pwd                    # Should show: .../FYP-2-

# Start server (if not running)
npm start

# Start frontend
cd frontend
npm start

# Development mode
npm run dev
```

---

## 🔍 How to Check Current Directory

### Windows PowerShell:
```powershell
pwd
# Should show: C:\Users\chahm\final year project\FYP-2-
```

### Windows CMD:
```cmd
cd
# Should show: C:\Users\chahm\final year project\FYP-2-
```

---

## 📝 Remember

✅ **Always be in FYP-2- directory**  
✅ **Check with `pwd` or `cd` command**  
✅ **Server is already running on port 5001**  
❌ **Don't run npm commands from parent directory**

---

## 🆘 Still Having Issues?

1. **Check current directory:**
   ```bash
   pwd
   ```

2. **Navigate to FYP-2-:**
   ```bash
   cd FYP-2-
   ```

3. **Verify package.json exists:**
   ```bash
   ls package.json
   ```

4. **Then run your command:**
   ```bash
   npm start
   ```

---

**Current Status:** ✅ Server is running on port 5001  
**No action needed!** Just access http://localhost:5001

