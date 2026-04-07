# Campus Connect v4.0 - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites Check
```bash
node --version    # Should be v16+
mysql --version   # Should be v8.0+
redis-cli ping    # Should return PONG
```

### Installation
```bash
# 1. Clone and install
git clone https://github.com/GodZilla-lct/FYP-2-.git
cd FYP-2-
npm run install:all

# 2. Configure environment
cp .env.example .env
# Edit .env with your MySQL and SMTP credentials

# 3. Setup database and directories
npm run setup:full

# 4. Start servers
npm run dev:full
```

### Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### Default Login
- **Email**: `director@uog.edu.pk`
- **Password**: `password123`

---

## 🎯 What's New in v4.0?

### Real-Time Features
- ✅ Live notifications via WebSocket
- ✅ Real-time proposal updates
- ✅ Live comment threads

### New Dashboards
- ✅ Analytics with interactive charts
- ✅ Budget management
- ✅ Calendar view
- ✅ Advanced search

### Enhanced Workflow
- ✅ Draft proposals (save before submit)
- ✅ Email notifications
- ✅ User profiles with activity history
- ✅ Comments and collaboration

### Security & Performance
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Redis caching
- ✅ Input validation
- ✅ Activity logging

---

## 📱 User Roles & Access

| Role | Access |
|------|--------|
| **Society President/VP/GS** | Create proposals, view drafts, manage cabinet |
| **Coordinator** | Approve/reject proposals at first level |
| **Director SSC** | Full admin access, hierarchy management, analytics |
| **Asst. Director** | Approve proposals, view analytics |
| **Finance Secretary** | Budget approval, financial analytics |
| **Registrar** | Proposal approval, system oversight |
| **Vice Chancellor** | Final approval authority |

---

## 🔧 Common Commands

```bash
# Start backend only
npm start

# Start with auto-reload
npm run dev

# Start both servers
npm run dev:full

# Reset database
npm run setup:full

# Build for production
npm run build

# Run tests
npm test

# Start Redis
npm run redis:start
```

---

## 📊 Testing the System

### 1. Test Authentication
- Register new user
- Login with credentials
- Test forgot password flow

### 2. Test Proposal Flow
- Create a proposal as society leader
- Save as draft
- Publish draft
- Track approval workflow

### 3. Test Real-Time Features
- Open two browser windows
- Create notification in one
- See it appear in other instantly

### 4. Test Analytics
- Login as Director SSC
- View analytics dashboard
- Check proposal statistics

---

## 🆘 Quick Troubleshooting

### Backend won't start
```bash
# Check if port is in use
lsof -ti:5000 | xargs kill -9

# Check MySQL connection
mysql -u root -p -e "USE campus_connect; SHOW TABLES;"

# Check Redis
redis-cli ping
```

### Frontend won't start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Database errors
```bash
# Re-run schema
node backend/scripts/run_schema.js

# Re-seed data
node backend/database/seed_v3.js
```

---

## 📚 Next Steps

1. **Explore Features**: Login and test all dashboards
2. **Read Docs**: Check `docs/V4_FEATURES.md` for complete feature list
3. **Customize**: Update branding, colors, and content
4. **Deploy**: Follow `DEPLOYMENT.md` for production setup

---

## 🎉 You're Ready!

Campus Connect v4.0 is now running. Start by logging in with the default credentials and exploring the new features!

For detailed documentation, see:
- [Installation Guide](INSTALLATION_GUIDE.md)
- [V4.0 Features](docs/V4_FEATURES.md)
- [API Documentation](docs/WORKFLOW_API_DOCUMENTATION.md)
