# 🚀 Campus Connect - Quick Start Guide

## Prerequisites
- Node.js installed
- MySQL installed and running
- Git installed

---

## 🎯 First Time Setup

### 1. Install Dependencies

**Backend:**
```powershell
cd FYP-2-
npm install
```

**Frontend:**
```powershell
cd FYP-2-/frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campus_connect
JWT_SECRET=your_secret_key
```

### 3. Setup Database

**Run main schema:**
```powershell
cd FYP-2-
node backend/scripts/run_schema.js
```

**Run venue migration:**
```powershell
node backend/database/scripts/run_venues_migration.js
```

**Seed data:**
```powershell
node backend/database/seed.js
```

---

## ▶️ Running the System

### Start Backend Server
```powershell
cd FYP-2-
node server.js
```
**Expected:** Server running on http://localhost:5000

### Start Frontend Server
```powershell
cd FYP-2-/frontend
npm start
```
**Expected:** React app running on http://localhost:3000

---

## 🧪 Verify System Health

Run the health check script:
```powershell
cd FYP-2-
.\test-system-health.ps1
```

**Expected Output:**
- ✅ All tests passed
- ✅ System is healthy

---

## 🔑 Test Credentials

### System Admin
- **Email:** admin@uog.edu.pk
- **Password:** admin123
- **Access:** Full system control

### Director SSC
- **Email:** director@uog.edu.pk
- **Password:** director123
- **Access:** Society management, budget, analytics

### Finance Secretary
- **Email:** finance@uog.edu.pk
- **Password:** finance123
- **Access:** View societies, analytics

### President (Society Leader)
- **Email:** president@uog.edu.pk
- **Password:** president123
- **Access:** Create proposals, manage society

---

## 🏛️ Testing Venue Management

### As System Admin:
1. Login with admin credentials
2. Go to **Super Admin Dashboard**
3. Click **"🏛️ Venue Management"** tab
4. Try:
   - Add new venue
   - Edit venue
   - Toggle availability
   - Delete venue

### As President:
1. Login with president credentials
2. Go to **Dashboard**
3. Click **"Create New Proposal"**
4. Select venue from dropdown
5. Try creating proposal
6. Try creating conflicting proposal (same venue + date)

### View Calendar:
1. Login as any user
2. Go to **Calendar** tab
3. View approved events with venue information

---

## 🛑 Stopping Servers

### Stop Backend
Press `Ctrl + C` in backend terminal

### Stop Frontend
Press `Ctrl + C` in frontend terminal

### Or Use Script
```powershell
.\stop-servers.ps1
```

---

## 🔧 Common Issues

### Port Already in Use
**Backend (5000):**
```powershell
# Find process
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F
```

**Frontend (3000):**
```powershell
# Find process
netstat -ano | findstr :3000
# Kill process
taskkill /PID <PID> /F
```

### Database Connection Error
- Verify MySQL is running
- Check `.env` credentials
- Ensure database exists

### Migration Errors
- Check if tables already exist
- Drop tables if needed
- Re-run migration

---

## 📚 Documentation

- **Complete Verification:** `COMPLETE_SYSTEM_VERIFICATION.md`
- **Venue Guide:** `VENUE_MANAGEMENT_GUIDE.md`
- **System Status:** `FINAL_SYSTEM_STATUS.md`
- **Login Credentials:** `LOGIN_CREDENTIALS.md`

---

## 🎯 Quick Feature Test

1. **Login** → Test authentication
2. **Create Proposal** → Test venue selection
3. **Try Conflict** → Test magic blocker
4. **View Calendar** → Test venue display
5. **Manage Venues** → Test CRUD operations

---

## ✅ Success Indicators

- ✅ Backend shows "Server running on port 5000"
- ✅ Frontend shows "Compiled successfully"
- ✅ Can login with test credentials
- ✅ Can view dashboard
- ✅ Can create proposals
- ✅ Venue dropdown shows venues
- ✅ Calendar displays events

---

## 🚀 You're Ready!

If all the above works, your system is **fully operational** and ready to use!

For detailed information, check the comprehensive documentation files.

---

**Need Help?**
- Check `COMPLETE_SYSTEM_VERIFICATION.md` for detailed verification
- Run `test-system-health.ps1` for automated checks
- Review backend logs for errors
- Check browser console for frontend issues
