# 🚀 Campus Connect v4.0 - Quick Reference Card

## 🌐 Server URLs

```
Backend:  http://localhost:5001
API:      http://localhost:5001/api
Health:   http://localhost:5001/health
Frontend: http://localhost:3000 (when running)
```

## 🔐 Login Credentials

**Admin:**
```
Email:    director@uog.edu.pk
Password: password123
```

**Society President:**
```
Email:    2021-CS-001@uog.edu.pk
Password: password123
```

## ⚡ Quick Commands

```bash
# Start backend (already running)
npm start

# Start frontend
cd frontend && npm start

# Development mode
npm run dev

# Both servers
npm run dev:full

# Setup database
npm run setup

# Seed data
npm run seed
```

## 🧪 Quick Tests

```bash
# Health check
curl http://localhost:5001/health

# Test auth (should return 401)
curl http://localhost:5001/api/societies

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"director@uog.edu.pk","password":"password123"}'
```

## 📁 Essential Files

```
README.md                    - Main docs
QUICK_START.md              - Quick start
API_TESTING_GUIDE.md        - API reference
SECURITY_SUMMARY.md         - Security info
CURRENT_STATUS.md           - Current status
```

## 🔒 Security Features

✅ Helmet - HTTP headers  
✅ CORS - Restricted origin  
✅ Rate Limiting - 100/15min  
✅ XSS Protection  
✅ NoSQL Injection Protection  
✅ Parameter Pollution Protection  
✅ JWT Authentication  
✅ Activity Logging  

## 📊 Status

```
Server:   🟢 Running (Port 5001)
Database: 🟢 Connected
Security: 🟢 All enabled
Redis:    🟡 Optional (not running)
```

## 🆘 Troubleshooting

**Port in use?** Change PORT in .env  
**DB error?** Check MySQL is running  
**Auth error?** Verify JWT_SECRET in .env  
**Redis warning?** It's optional, ignore it  

## 📞 Support

Check these files for help:
- CURRENT_STATUS.md - Current state
- START_PROJECT.md - Startup guide
- API_TESTING_GUIDE.md - API docs
- SECURITY_SUMMARY.md - Security details

---

**Status:** ✅ OPERATIONAL  
**Version:** 4.0.0  
**Last Updated:** April 5, 2026
