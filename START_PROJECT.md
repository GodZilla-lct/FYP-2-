# 🚀 Campus Connect v4.0 - Quick Start

## Project Cleaned Up! ✅

Unnecessary documentation has been moved to `docs/archive/`

## Essential Files Kept:
- ✅ README.md - Main documentation
- ✅ QUICK_START.md - Quick start guide
- ✅ INSTALLATION_GUIDE.md - Detailed setup
- ✅ API_TESTING_GUIDE.md - API reference
- ✅ DEPLOYMENT_CHECKLIST.md - Deployment guide
- ✅ SECURITY_SUMMARY.md - Security overview

---

## 🔧 Prerequisites

1. **MySQL** - Running on localhost:3306
2. **Node.js** - v16+ installed
3. **Redis** (Optional) - For caching

---

## 🚀 Start the Project

### Option 1: Quick Start (Recommended)

```bash
npm start
```

### Option 2: Development Mode with Auto-Reload

```bash
npm run dev
```

### Option 3: Start Both Backend and Frontend

```bash
npm run dev:full
```

---

## 📋 First Time Setup

If this is your first time running the project:

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Setup Database
```bash
# Create database and tables
npm run setup

# Seed with sample data
npm run seed
```

### 3. Start Server
```bash
npm start
```

---

## 🌐 Access the Application

- **Backend API:** http://localhost:5001
- **Frontend:** http://localhost:3000 (if running frontend)
- **Health Check:** http://localhost:5001/health

---

## 🔐 Default Login Credentials

**Admin (Director SSC):**
- Email: `director@uog.edu.pk`
- Password: `password123`

**Society President:**
- Email: `2021-CS-001@uog.edu.pk`
- Password: `password123`

---

## 🔍 Verify Installation

Check if server is running:
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "OK",
  "version": "4.0",
  "security": {
    "helmet": "enabled",
    "cors": "restricted",
    "rateLimiting": "enabled",
    "xssProtection": "enabled",
    "sqlInjectionProtection": "enabled"
  }
}
```

---

## 🛠️ Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5002
```

### Database Connection Error
- Check MySQL is running
- Verify credentials in .env
- Ensure database `campus_connect` exists

### Redis Connection Error (Optional)
- Redis is optional, server will run without it
- To disable: Comment out Redis initialization in server.js

---

## 📚 Documentation

- **API Testing:** See `API_TESTING_GUIDE.md`
- **Security:** See `SECURITY_SUMMARY.md`
- **Deployment:** See `DEPLOYMENT_CHECKLIST.md`

---

## ✅ Project Status

- ✅ Security packages installed
- ✅ Documentation organized
- ✅ Ready to run
- ✅ Production-ready

**Start the server with:** `npm start`

