# Campus Connect v4.0 - Startup Verification Guide

## 🎯 Pre-Flight Checklist

This guide helps you verify that all components are properly configured before starting the application.

---

## ✅ 1. SYSTEM REQUIREMENTS

### Required Software
- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm v8+ installed (`npm --version`)
- [ ] MySQL v8.0+ installed and running
- [ ] Git installed (for version control)

### Optional but Recommended
- [ ] Redis v6.0+ installed (for caching)
- [ ] PM2 installed globally (for production)
- [ ] Postman or similar (for API testing)

### Verification Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check MySQL status
mysql --version

# Check Redis (optional)
redis-cli ping
```

---

## ✅ 2. DEPENDENCIES INSTALLATION

### Backend Dependencies
```bash
# Install backend dependencies
npm install

# Expected packages (17 total):
# - express, cors, dotenv
# - mysql2, redis
# - bcryptjs, jsonwebtoken
# - multer, nodemailer
# - socket.io, helmet
# - compression, express-rate-limit
# - express-validator
```

### Frontend Dependencies
```bash
# Install frontend dependencies
cd frontend
npm install

# Expected packages:
# - react, react-dom
# - react-scripts
# - axios, socket.io-client
# - react-router-dom, recharts
```

### Quick Install All
```bash
npm run install:all
```

---

## ✅ 3. ENVIRONMENT CONFIGURATION

### Create .env File
```bash
# Copy example file
cp .env.example .env

# Edit with your settings
nano .env  # or use your preferred editor
```

### Required Environment Variables
```env
# Database (REQUIRED)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_connect

# Server (REQUIRED)
PORT=5000
CORS_ORIGIN=http://localhost:3000

# JWT (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email/SMTP (REQUIRED for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@campusconnect.edu

# Redis (OPTIONAL - app works without it)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Verification
```bash
# Check if .env exists
ls -la .env

# Verify no syntax errors (should show your variables)
cat .env
```

---

## ✅ 4. DATABASE SETUP

### Create Database
```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE campus_connect;
USE campus_connect;
exit;
```

### Run Schema
```bash
# Run schema creation script
node backend/scripts/run_schema.js

# Expected output:
# ✓ Connected to MySQL
# ✓ Database 'campus_connect' selected
# ✓ Schema executed successfully
# ✓ 16 tables created
```

### Seed Sample Data
```bash
# Run seed script
node backend/database/seed_v3.js

# Expected output:
# ✓ Sample societies created
# ✓ Sample users created
# ✓ Sample proposals created
# ✓ Seed completed successfully
```

### Verify Database
```bash
# Check tables
mysql -u root -p campus_connect -e "SHOW TABLES;"

# Expected tables (16):
# - users
# - societies
# - society_roles
# - proposals
# - proposal_attachments
# - approval_history
# - refresh_tokens
# - password_reset_tokens
# - notifications
# - notification_preferences
# - proposal_comments
# - draft_proposals
# - budget_allocations
# - saved_search_filters
# - calendar_events
# - activity_logs
```

---

## ✅ 5. DIRECTORY STRUCTURE

### Create Upload Directories
```bash
# Run directory setup script
node backend/scripts/setup_directories.js

# Or manually create:
mkdir -p uploads/profiles
mkdir -p uploads/proposals
```

### Verify Directories
```bash
# Check directory structure
ls -la uploads/
# Should show:
# - profiles/
# - proposals/
```

---

## ✅ 6. FILE INTEGRITY CHECK

### Backend Files (Critical)
```bash
# Check if all controller files exist
ls backend/controllers/
# Expected: 11 files
# - authController.js
# - proposalController.js
# - proposalWorkflowController.js
# - societyController.js
# - userController.js
# - notificationController.js
# - commentController.js
# - analyticsController.js
# - searchController.js
# - budgetController.js
# - calendarController.js

# Check middleware files
ls backend/middleware/
# Expected: 5 files
# - auth.js
# - validator.js
# - rateLimiter.js
# - cache.js
# - activityLogger.js

# Check config files
ls backend/config/
# Expected: 4 files
# - database.js
# - jwt.js
# - redis.js
# - socket.js
```

### Frontend Files (Critical)
```bash
# Check components
ls frontend/src/components/
# Expected: 17+ files

# Check utilit