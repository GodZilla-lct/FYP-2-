# 🚀 Campus Connect - Complete Server Running Guide

## Prerequisites Checklist
- ✅ MySQL Server is running
- ✅ Database `campus_connect` exists (run `schema.sql` if needed)
- ✅ Node.js v14+ installed
- ✅ `.env` file configured with database credentials

---

## Quick Start (Recommended)

### Window 1: Backend Server

```powershell
# Navigate to project root
cd C:\Users\chahm\FYP

# Clear npm cache (prevents install issues)
npm cache clean --force

# Install dependencies (first time only)
npm install

# Start backend
npm start
```

**Expected Output:**
```
Server running on port 5000
Database connected successfully
```

### Window 2: Frontend Server

```powershell
# Navigate to frontend folder
cd C:\Users\chahm\FYP\frontend

# Clear npm cache
npm cache clean --force

# Install dependencies (first time only)
npm install

# Start frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view campus-connect-frontend in the browser.
  Local:            http://localhost:3000
```

---

## Troubleshooting Commands

### Issue: Port 5000 Already in Use

```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Then restart backend
npm start
```

### Issue: Port 3000 Already in Use

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Or run frontend on different port
$env:PORT=3001; npm start
```

### Issue: npm install Fails

```powershell
# Clear cache and reinstall
npm cache clean --force
rm -r node_modules
npm install
```

### Issue: Frontend node_modules Corrupted

```powershell
cd frontend
npm cache clean --force
rm -r node_modules
npm install
npm start
```

### Issue: Database Connection Error

```powershell
# Verify .env file has correct credentials
type .env

# Should contain:
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=<your_password>
# DB_NAME=campus_connect
# PORT=5000
# CORS_ORIGIN=http://localhost:3000
```

### Issue: Blank Page on Frontend

```powershell
# Wait 30 seconds for compilation, then refresh browser
# If still blank, check browser console for errors (F12)
# Restart frontend server
```

---

## Stopping Servers

### Graceful Stop
Press `Ctrl + C` in each PowerShell window

### Force Stop (if Ctrl+C doesn't work)

```powershell
# Stop backend (port 5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Stop frontend (port 3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## Complete Fresh Start (Nuclear Option)

Use this if everything is broken:

```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Backend fresh start
cd C:\Users\chahm\FYP
npm cache clean --force
rm -r node_modules
npm install
npm start

# In new window - Frontend fresh start
cd C:\Users\chahm\FYP\frontend
npm cache clean --force
rm -r node_modules
npm install
npm start
```

---

## Verify Servers Are Running

```powershell
# Check backend health
curl http://localhost:5000/health

# Check frontend (should return HTML)
curl http://localhost:3000
```

---

## Development Mode (Optional)

If you want auto-reload on file changes:

### Backend with Nodemon
```powershell
npm run dev
```

### Frontend (already has auto-reload)
```powershell
npm start
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `EADDRINUSE: address already in use` | Kill process on that port (see above) |
| `Cannot find module` | Run `npm install` in that directory |
| `Database connection failed` | Check MySQL is running and `.env` credentials |
| `CORS error` | Ensure `CORS_ORIGIN=http://localhost:3000` in `.env` |
| `Blank page on 3000` | Wait 30 seconds, refresh, check browser console |
| `npm ERR! code ERESOLVE` | Run `npm cache clean --force` then `npm install` |
| `Port 5000/3000 in use` | Use `netstat` and `taskkill` commands above |

---

## File Locations Reference

- **Backend**: `C:\Users\chahm\FYP\server.js`
- **Frontend**: `C:\Users\chahm\FYP\frontend\src\App.js`
- **Database Config**: `C:\Users\chahm\FYP\config\database.js`
- **Environment**: `C:\Users\chahm\FYP\.env`
- **Routes**: `C:\Users\chahm\FYP\proposalRoutes.js`

---

## Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

---

## Next Steps After Starting

1. ✅ Verify both servers are running
2. 📝 Create a test proposal in President Dashboard
3. 👁️ Switch to Admin View to manage societies
4. 🔄 Test the approval workflow
5. 📚 Review `ARCHITECTURE.md` for system design

---

## Emergency Commands

```powershell
# Kill all Node processes immediately
taskkill /F /IM node.exe

# Check all ports in use
netstat -ano

# Check specific ports
netstat -ano | findstr :5000
netstat -ano | findstr :3000

# Restart MySQL (if needed)
# Windows Services > MySQL80 > Restart
```

---

**Last Updated**: January 2026
**Project**: Campus Connect MVP
**Stack**: MERN (MySQL, Express, React, Node.js)
