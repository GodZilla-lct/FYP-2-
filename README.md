# Campus Connect v4.0

> A comprehensive proposal management system for University of Gujrat societies with real-time notifications, advanced analytics, draft management, and enterprise-grade security.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-orange.svg)](https://mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-6+-red.svg)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4+-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-Educational-yellow.svg)](#)

## 🎯 Features

### 🆕 NEW in v4.0
- **🔔 Real-Time Notifications**: WebSocket-powered instant updates
- **📝 Draft Proposals**: Save and edit proposals before submission
- **📊 Advanced Analytics**: Interactive charts and comprehensive metrics
- **🔍 Advanced Search**: Full-text search with saved filters
- **💬 Comments System**: Collaborate on proposals with threaded discussions
- **📅 Calendar Integration**: Event management with iCal export
- **💰 Budget Management**: Track allocations and utilization
- **👤 User Profiles**: Customizable profiles with activity history
- **🔐 Enhanced Security**: Rate limiting, validation, activity logging
- **⚡ Redis Caching**: Improved performance with intelligent caching

### For Admins (Director SSC)
- **🎨 Creative Hierarchy Manager**: Masonry grid layout with floating label inputs
- **📊 Proposal Dashboard**: View and process all society proposals
- **👥 Dynamic Role Management**: Add/remove society roles with auto-user creation
- **🔄 Multi-tier Approval Workflow**: 7-level approval system with null coordinator check
- **📈 Analytics Dashboard**: Real-time metrics and insights
- **💰 Budget Oversight**: Monitor and manage society budgets

### For Society Leaders
- **📝 Proposal Creation**: Create proposals with file attachments
- **📝 Draft Management**: Save drafts and publish when ready
- **👥 My Cabinet View**: Read-only view of society leadership structure
- **📈 Proposal Tracking**: Track proposal status through approval workflow
- **🔄 SOFT vs HARD Rejection**: Edit and resubmit soft-rejected proposals
- **💬 Collaboration**: Comment on proposals and discuss with team
- **📅 Event Calendar**: View and manage society events

## 🔐 Security Features

Campus Connect v4.0 implements **enterprise-grade security** measures:

### Security Packages:
- **Helmet** - Secure HTTP headers (CSP, HSTS, X-Frame-Options)
- **CORS** - Restricted to specific origin (no wildcard)
- **Rate Limiting** - 100 req/15min per IP, 5 login attempts/15min
- **XSS Clean** - Sanitizes all user inputs
- **Mongo Sanitize** - Prevents NoSQL injection
- **HPP** - HTTP Parameter Pollution protection

### Attack Vectors Protected:
- ✅ XSS (Cross-Site Scripting)
- ✅ SQL/NoSQL Injection
- ✅ CSRF (Cross-Site Request Forgery)
- ✅ Clickjacking
- ✅ Brute-force attacks
- ✅ DDoS attacks
- ✅ Parameter pollution
- ✅ MIME sniffing
- ✅ Information disclosure

### Compliance:
- ✅ OWASP Top 10
- ✅ CWE/SANS Top 25
- ✅ GDPR (data protection)
- ✅ ISO 27001 guidelines

See [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) for complete details.

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/GodZilla-lct/FYP-2-.git
cd FYP-2-

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your database, Redis, and SMTP credentials

# Install and start Redis
# Linux: sudo apt-get install redis-server && redis-server
# Mac: brew install redis && redis-server
# Windows: Download from https://redis.io/download

# Setup database
node backend/scripts/run_schema.js
node backend/database/seed_v3.js

# Start development servers
npm start                    # Backend (port 5000)
cd frontend && npm start     # Frontend (port 3000)
```

## 📁 Project Structure

```
campus-connect/
├── 📂 backend/              # Backend application
│   ├── controllers/         # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Auth middleware
│   ├── database/            # Schema & seeds
│   └── scripts/             # Utility scripts
├── 📂 frontend/             # React application
│   └── src/components/      # UI components
├── 📂 docs/                 # Documentation
├── 📄 server.js             # Entry point
└── 📄 README.md             # This file
```

## 🔐 Demo Credentials

**Admin (Director SSC):**
- Email: `director@uog.edu.pk`
- Password: `password123`

**Society President:**
- Email: `2021-CS-001@uog.edu.pk`
- Password: `password123`

## 🛠️ Technology Stack

**Backend:**
- Node.js + Express
- MySQL (with mysql2)
- Redis (caching)
- Socket.IO (real-time)
- Multer (file uploads)
- JWT Authentication
- Nodemailer (email)
- Helmet (security)

**Frontend:**
- React 18
- Socket.IO Client
- Recharts (analytics)
- React Router
- CSS3 (with creative animations)
- Fetch API

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campus_connect

# Server
PORT=5000
CORS_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@campusconnect.edu

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Application
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## 🎨 UI Features

- **Creative Masonry Grid**: Modern card-based layout for societies
- **Floating Label Inputs**: Professional form styling
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Role Icons**: Visual indicators for different positions
- **Smooth Animations**: Hover effects and transitions

## 🚦 Approval Workflow

1. **PENDING_COORDINATOR** (if coordinator exists)
2. **PENDING_DIRECTOR_SSC**
3. **PENDING_ASST_DIRECTOR**
4. **PENDING_FINANCE_SECRETARY**
5. **PENDING_REGISTRAR**
6. **PENDING_VC**
7. **APPROVED**

**Rejection Types:**
- **SOFT**: Returned for revision (editable)
- **HARD**: Final rejection (cannot be resubmitted)

## 📚 Documentation

- [📖 Setup Guide](docs/SETUP_GUIDE.md) - Detailed installation instructions
- [🏗️ Architecture](docs/ARCHITECTURE.md) - System architecture overview
- [🔌 API Documentation](docs/WORKFLOW_API_DOCUMENTATION.md) - API endpoints reference
- [🚀 Deployment Guide](docs/RUN_SERVERS.md) - Server management guide
- [📁 Project Structure](PROJECT_STRUCTURE.md) - Detailed structure guide
- [✨ V4.0 Features](docs/V4_FEATURES.md) - Complete feature list and migration guide
- [🧪 Test Scenarios](docs/TEST_SCENARIOS.md) - Testing guidelines

## 🚀 Deployment

### Development
```bash
npm run dev          # Start both servers
```

### Production
```bash
npm run build        # Build frontend
npm start           # Start production server
```

## 🧪 Testing

### Automated API Testing
```bash
# Linux/Mac
bash test-api-endpoints.sh

# Windows PowerShell
.\test-api-endpoints.ps1
```

### Manual Testing
```bash
npm test            # Run backend tests
cd frontend && npm test  # Run frontend tests
```

## 📦 Database Schema

The system uses a dynamic role-based hierarchy with the following key tables:

**Core Tables:**
- `users` - User accounts
- `societies` - Society information
- `society_roles` - Dynamic role assignments
- `proposals` - Event proposals
- `proposal_attachments` - File attachments
- `approval_history` - Approval workflow tracking

**V4.0 New Tables:**
- `refresh_tokens` - JWT refresh token storage
- `password_reset_tokens` - Password reset tokens
- `notifications` - Notification records
- `notification_preferences` - User notification settings
- `proposal_comments` - Comments on proposals
- `draft_proposals` - Draft proposal storage
- `budget_allocations` - Budget tracking
- `saved_search_filters` - Saved search queries
- `calendar_events` - Event management
- `activity_logs` - User activity tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is for educational purposes - University of Gujrat.

## 🔧 Recent Fixes (April 5, 2026)

### API Route Corrections
- Fixed search controller method names (`saveSearchFilter`, `getSavedFilters`, `deleteSavedFilter`)
- Fixed budget controller method names (`getBudgetAllocations`, `setBudgetAllocation`, `getBudgetSummary`, `checkBudgetAvailability`)
- Fixed calendar controller method names (`getCalendarEvents`, `createCalendarEvent`, etc.)
- Added missing routes: user search, budget checks, calendar conflict detection, iCal export

### Code Quality Improvements
- Removed duplicate `module.exports` in proposalController and userController
- All controllers now have single, comprehensive exports
- Zero syntax errors across all files

See [FIXES_APPLIED.md](FIXES_APPLIED.md) for detailed information.

## 👥 Contributors

Campus Connect v4.0 - University of Gujrat

---

**🎓 University of Gujrat | Final Year Project | 2026**
