# 🚀 Campus Connect v4.0 - START HERE

**Welcome to Campus Connect v4.0!**  
This is your quick start guide to get up and running.

---

## 📖 What is Campus Connect?

Campus Connect is a comprehensive university proposal management system that streamlines the process of submitting, reviewing, and approving society proposals with multi-stage workflows, budget management, and real-time notifications.

---

## ⚡ Quick Start (5 Minutes)

### 1. Prerequisites
```bash
✅ Node.js 16+ installed
✅ MySQL 8.0+ installed and running
✅ Redis 6.0+ installed and running
✅ Git installed
```

### 2. Installation
```bash
# Clone the repository
git clone <repository-url>
cd FYP-2-

# Install all dependencies (backend + frontend)
npm run install:all

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# (Use any text editor)
```

### 3. Database Setup
```bash
# Run complete setup (creates database, tables, seeds data)
npm run setup:full

# Or run individually:
npm run setup    # Creates database and tables
npm run seed     # Seeds initial data
```

### 4. Start the Application
```bash
# Start both backend and frontend
npm run dev:full

# Or start separately:
npm start              # Backend only (port 5000)
cd frontend && npm start  # Frontend only (port 3000)
```

### 5. Access the Application
```
Frontend: http://localhost:3000
Backend:  http://localhost:5000
Health:   http://localhost:5000/api/health
```

### 6. Login
```
Super Admin:
Email: admin@uog.edu.pk
Password: admin123

Test User:
Email: student@uog.edu.pk
Password: student123
```

---

## 📚 Documentation Guide

### New to the Project?
1. **START_HERE.md** (this file) - Quick start
2. **README.md** - Project overview
3. **docs/ARCHITECTURE.md** - System architecture
4. **REFACTORING_COMPLETE.md** - What's been done

### Want to Understand the Code?
1. **docs/ROUTING_ARCHITECTURE.md** - Frontend routing
2. **ROUTING_QUICK_REFERENCE.md** - Quick routing reference
3. **API_TESTING_GUIDE.md** - API endpoints

### Ready to Deploy?
1. **DEPLOYMENT_CHECKLIST.md** - Pre-deployment checklist
2. **DEPLOYMENT_GUIDE.md** - Step-by-step deployment
3. **DATABASE_SSL_GUIDE.md** - Database SSL setup
4. **REDIS_SETUP_GUIDE.md** - Redis configuration

### Want to Test?
1. **PHASE_4_TESTING_GUIDE.md** - Testing overview
2. **tests/auth.test.js** - Authentication tests
3. **tests/rbac.test.js** - RBAC tests

### Need Phase Details?
1. **PHASE_3_ROUTING_COMPLETE.md** - Frontend refactoring
2. **PHASE_4_COMPLETE.md** - Testing & JWT security
3. **FINAL_PHASE_AUDIT_REPORT.md** - Cleanup audit
4. **CLEANUP_SUMMARY.md** - Cleanup results

---

## 🎯 Common Tasks

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- tests/auth.test.js
```

### Database Operations
```bash
# Run migrations
npm run migrate

# Seed database
npm run seed

# List users
node backend/database/scripts/list_users.js

# Create super admin
node backend/scripts/setup-superadmin.js
```

### Building for Production
```bash
# Build frontend
npm run build

# Start production server
NODE_ENV=production npm start
```

### Utility Scripts
```bash
# Fix user roles
node backend/scripts/fix-roles.js

# Make user admin
node backend/scripts/make-admin.js

# Setup directories
node backend/scripts/setup_directories.js
```

---

## 🏗️ Project Structure

```
FYP-2-/
├── backend/              # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # Business logic
│   ├── database/         # Database files
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── scripts/          # Utility scripts
│   ├── services/         # Business services
│   ├── utils/            # Utilities
│   └── validators/       # Input validation
├── frontend/             # React frontend
│   ├── public/           # Static files
│   └── src/              # Source code
│       ├── components/   # React components
│       ├── hooks/        # Custom hooks
│       ├── services/     # API services
│       └── utils/        # Utilities
├── tests/                # Test files
├── docs/                 # Documentation
├── .env                  # Environment variables
├── server.js             # Backend entry point
└── package.json          # Dependencies
```

---

## 🔧 Technology Stack

### Frontend
- React 18.2.0
- React Router DOM 6.20.0
- Native Fetch API
- CSS Modules

### Backend
- Node.js + Express.js
- MySQL2
- JWT Authentication
- Redis (caching)
- Socket.io (real-time)

### Testing
- Jest 29.7.0
- Supertest 6.3.3
- 53+ automated tests

---

## 🎯 Key Features

### ✅ User Management
- Role-based access control (RBAC)
- JWT authentication with refresh tokens
- Password reset with OTP
- Profile management with avatar upload

### ✅ Proposal System
- Multi-stage approval workflow
- Draft proposals
- Comments and feedback
- Status tracking
- Budget management

### ✅ Society Management
- Society registration
- Cabinet management
- Coordinator assignment
- Member roles

### ✅ Admin Features
- Super admin dashboard
- User management
- Force status changes
- System settings
- Support tickets

### ✅ Real-time Features
- Notifications
- Live updates
- Activity tracking

---

## 📊 API Endpoints

### Public (No Auth Required)
```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/verify-otp
POST   /api/auth/reset-password
GET    /api/health
```

### Protected (Auth Required)
```
53 total endpoints across:
- Authentication (3)
- Proposals (14)
- Societies (7)
- Cabinet (5)
- Users (7)
- Profile (4)
- Notifications (5)
- Analytics (3)
- Budget (4)
- Calendar (6)
- Search (5)
- Dashboard (1)
- Tickets (1)
- Super Admin (11)
```

See `API_TESTING_GUIDE.md` for complete list.

---

## 🔐 Security Features

- ✅ JWT with short-lived access tokens (15 min)
- ✅ Refresh tokens with database storage (7 days)
- ✅ Token revocation support
- ✅ Password hashing with bcrypt
- ✅ Input validation with Zod
- ✅ SQL injection prevention
- ✅ XSS protection
- ✅ Rate limiting
- ✅ CORS configured
- ✅ Helmet security headers

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
- ✅ 53+ automated tests
- ✅ Authentication tests (25)
- ✅ RBAC tests (28)
- ✅ 100% pass rate

### Test Files
- `tests/auth.test.js` - Authentication
- `tests/rbac.test.js` - Role-based access control

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check MySQL is running
mysql -u root -p

# Verify .env database credentials
# DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping
# Should return: PONG

# Start Redis if not running
redis-server
```

### Port Already in Use
```bash
# Backend (port 5000)
# Kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (port 3000)
# Kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module Not Found
```bash
# Reinstall dependencies
npm run install:all

# Or individually
npm install
cd frontend && npm install
```

### Database Schema Issues
```bash
# Drop and recreate database
mysql -u root -p
DROP DATABASE campus_connect;

# Run setup again
npm run setup:full
```

---

## 📞 Getting Help

### Documentation
- Check `docs/` folder for detailed guides
- Review `API_TESTING_GUIDE.md` for API reference
- See `DEPLOYMENT_GUIDE.md` for deployment help

### Common Issues
- Database connection: Check `.env` file
- Redis connection: Ensure Redis is running
- Port conflicts: Kill processes using ports 3000/5000
- Module errors: Run `npm run install:all`

### Testing
- Run `npm test` to verify everything works
- Check `tests/` folder for test examples
- Review `PHASE_4_TESTING_GUIDE.md` for testing help

---

## 🎉 You're Ready!

You now have Campus Connect v4.0 running locally. Here's what to do next:

1. ✅ Explore the application at http://localhost:3000
2. ✅ Login with test credentials
3. ✅ Create a test proposal
4. ✅ Review the documentation
5. ✅ Run the test suite
6. ✅ Start building!

---

## 📚 Next Steps

### For Developers
1. Read `docs/ARCHITECTURE.md` - Understand the system
2. Review `ROUTING_QUICK_REFERENCE.md` - Learn routing
3. Check `API_TESTING_GUIDE.md` - Explore APIs
4. Run `npm test` - See tests in action

### For Deployment
1. Review `DEPLOYMENT_CHECKLIST.md` - Pre-deployment
2. Follow `DEPLOYMENT_GUIDE.md` - Deploy step-by-step
3. Configure production `.env` - Set environment
4. Run `npm run build` - Build for production

### For Testing
1. Read `PHASE_4_TESTING_GUIDE.md` - Testing overview
2. Run `npm test` - Execute tests
3. Review test files in `tests/` - Learn patterns
4. Write new tests - Expand coverage

---

## ✅ Quick Checklist

Before you start developing:

- [ ] Node.js 16+ installed
- [ ] MySQL 8.0+ installed and running
- [ ] Redis 6.0+ installed and running
- [ ] Dependencies installed (`npm run install:all`)
- [ ] `.env` file configured
- [ ] Database setup complete (`npm run setup:full`)
- [ ] Application running (`npm run dev:full`)
- [ ] Can access http://localhost:3000
- [ ] Can login with test credentials
- [ ] Tests passing (`npm test`)

---

## 🎯 Project Status

```
✅ Frontend: Production Ready
✅ Backend: Production Ready
✅ Tests: 53+ Passing
✅ Security: Enhanced
✅ Documentation: Complete
✅ Deployment: Ready
```

---

**Welcome to Campus Connect v4.0!** 🎉  
**Happy Coding!** 💻

---

**Last Updated**: April 17, 2026  
**Version**: 4.0  
**Status**: Production Ready

