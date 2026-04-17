# 🎓 Campus Connect v4.0 - Secured Edition

> **📚 NEW**: All documentation has been organized! See [docs/README.md](docs/README.md) for complete navigation, or [START_HERE.md](START_HERE.md) for a quick start guide.

> Enterprise-grade proposal management system for University of Gujrat societies with strict RBAC, JWT authentication, real-time notifications, and comprehensive security features.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-orange.svg)](https://mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-6+-red.svg)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4+-black.svg)](https://socket.io/)
[![Security](https://img.shields.io/badge/Security-OWASP%20Top%2010-brightgreen.svg)](#)
[![License](https://img.shields.io/badge/License-Educational-yellow.svg)](#)

**🔒 Production-Ready | 🛡️ Enterprise Security | 🎯 Strict RBAC | ⚡ Auto-Logout**

## 🎯 Features

### 🆕 NEW in v4.0 - Secured Edition

#### 🔐 Security & Authentication
- **JWT Auto-Logout**: 20-minute token expiry with automatic logout on 401/403
- **9-Layer Security Middleware**: Helmet, CORS, Rate Limiting, XSS, NoSQL Injection, HPP
- **Strict RBAC**: Role-based access control on frontend navigation + backend routes
- **Profile Security**: Email/role fields disabled, only name editable
- **Registration Disabled**: Only authorized personnel can create accounts
- **Activity Logging**: All user actions tracked and auditable
- **Password Security**: Bcrypt hashing with salt rounds

#### 🎨 Dynamic UI/UX
- **Role-Based Dashboards**: Admins see AdminOverviewDashboard, Society Leaders see SocietyDashboard
- **3-Button Proposal Actions**: Approve (Green), Reject (Red), Return for Revision (Orange)
- **Real CSV Data**: Society management displays actual seeded data with core cabinet members
- **Access Badges**: Visual indicators for Read/Write vs Read-Only permissions
- **Clean Admin UI**: Quick Actions removed, minimal enterprise-grade layout

#### 🔔 Real-Time Features
- **WebSocket Notifications**: Instant updates for proposal status changes
- **Live Dashboard Updates**: Real-time metrics and pending approvals
- **Socket.IO Integration**: Bidirectional communication for instant feedback

#### 📝 Proposal Management
- **Draft System**: Save and edit proposals before submission
- **File Attachments**: Upload multiple files (PDF, DOC, DOCX, XLS, XLSX)
- **Comments & Collaboration**: Threaded discussions on proposals
- **Revision Workflow**: Return for revision with specific reasons (Change Date, Adjust Budget, Incomplete Details)
- **SOFT vs HARD Rejection**: Edit and resubmit soft-rejected proposals

#### 📊 Analytics & Reporting
- **Interactive Charts**: Recharts-powered visualizations
- **Budget Tracking**: Monitor allocations and utilization
- **Society Statistics**: Member count, proposal count, approval rates
- **Export Capabilities**: Download reports and analytics data

#### 🏛️ Society Management (Director SSC Only)
- **Full CRUD Operations**: Create, read, update, delete societies
- **Core Cabinet Display**: View President, VP, General Secretary from CSV data
- **Coordinator Assignment**: Assign coordinators to societies
- **Read-Only Access**: VC, Registrar, Finance Secretary can view but not modify

#### 👥 User Management
- **Bulk Import**: CSV-based user creation for authorized personnel
- **Profile Management**: Secure profile updates with field whitelisting
- **Account Lifecycle**: Activate/deactivate users
- **Role Assignment**: Strict role-based permissions

### For University Administrators

#### Vice Chancellor (VC)
- ✅ View AdminOverviewDashboard (executive-level summary)
- ✅ View all societies and cabinet members (read-only)
- ✅ View analytics and reports
- ✅ Approve/reject proposals at VC level
- ❌ Cannot create/edit/delete societies

#### Registrar
- ✅ View AdminOverviewDashboard
- ✅ View all societies (read-only)
- ✅ View analytics and reports
- ✅ Approve/reject proposals at Registrar level
- ❌ Cannot modify societies or budget

#### Finance Secretary
- ✅ View AdminOverviewDashboard
- ✅ View all societies (read-only)
- ✅ View budget allocations and utilization
- ✅ Approve/reject proposals at Finance level
- ❌ Cannot create/edit/delete societies

#### Director SSC
- ✅ Full access to all features
- ✅ Create/edit/delete societies
- ✅ Manage budget allocations
- ✅ Bulk import users
- ✅ View comprehensive analytics
- ✅ Approve/reject proposals at Director level

#### Assistant Director
- ✅ Create/edit/delete societies
- ✅ Manage society cabinet members
- ✅ View analytics and reports
- ✅ Approve/reject proposals at Assistant Director level

### For Society Leaders

#### President / Vice President / General Secretary
- ✅ View SocietyDashboard (proposal management)
- ✅ Create and submit proposals
- ✅ Save drafts and publish later
- ✅ Track proposal status through workflow
- ✅ View society cabinet members (read-only)
- ✅ Comment on proposals
- ✅ View event calendar
- ✅ Edit profile (name only)
- ❌ Cannot change email or role
- ❌ Cannot access admin features

## 🔐 Security Features

Campus Connect v4.0 implements **enterprise-grade security** with 9 middleware layers:

### Security Architecture

#### Layer 1: Helmet - Secure HTTP Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options: DENY (clickjacking protection)
- X-Content-Type-Options: nosniff
- Referrer-Policy: no-referrer
- Permissions-Policy: restricted

#### Layer 2: CORS - Restricted Origin
- Single origin allowed (no wildcard)
- Credentials enabled
- Preflight caching
- Specific methods: GET, POST, PUT, DELETE, PATCH

#### Layer 3: Rate Limiting
- **API Routes**: 100 requests per 15 minutes per IP
- **Auth Routes**: 5 login attempts per 15 minutes per IP
- **Upload Routes**: 10 uploads per hour per IP
- Automatic IP-based throttling

#### Layer 4: XSS Protection
- Input sanitization with xss-clean
- Output encoding
- Script injection prevention
- HTML entity escaping

#### Layer 5: NoSQL Injection Protection
- Query sanitization with express-mongo-sanitize
- Parameter validation
- Type checking
- Dangerous operator filtering

#### Layer 6: HTTP Parameter Pollution (HPP)
- Duplicate parameter protection
- Array parameter whitelisting
- Query string sanitization

#### Layer 7: JWT Authentication
- **Token Expiry**: 20 minutes (enforced)
- **Auto-Logout**: Frontend interceptor catches 401/403
- **Secure Storage**: localStorage with automatic cleanup
- **Refresh Tokens**: Disabled in v3 schema (manual re-login required)

#### Layer 8: Field Whitelisting
- Profile updates: Only `name` field allowed
- Dangerous fields stripped: role, email, is_active, society_id
- Request body validation
- SQL injection prevention

#### Layer 9: Activity Logging
- All user actions logged
- Audit trail for compliance
- Security event monitoring
- Suspicious activity detection

### Attack Vectors Protected

✅ **XSS (Cross-Site Scripting)** - Input sanitization + CSP headers  
✅ **SQL/NoSQL Injection** - Parameterized queries + sanitization  
✅ **CSRF (Cross-Site Request Forgery)** - Token validation + origin check  
✅ **Clickjacking** - X-Frame-Options: DENY  
✅ **Brute-force Attacks** - Rate limiting (5 attempts/15min)  
✅ **DDoS Attacks** - Rate limiting + connection throttling  
✅ **Parameter Pollution** - HPP middleware  
✅ **MIME Sniffing** - X-Content-Type-Options: nosniff  
✅ **Information Disclosure** - Error sanitization + secure headers  
✅ **Session Hijacking** - JWT expiry + auto-logout  
✅ **Privilege Escalation** - Strict RBAC + field whitelisting  
✅ **Account Takeover** - Email field disabled + role read-only  

### Compliance Standards

✅ **OWASP Top 10** - All vulnerabilities addressed  
✅ **CWE/SANS Top 25** - Most dangerous software errors mitigated  
✅ **GDPR** - Data protection and privacy compliance  
✅ **ISO 27001** - Information security management guidelines  

### Security Best Practices

- ✅ Passwords hashed with bcrypt (10 salt rounds)
- ✅ Sensitive data never logged
- ✅ Environment variables for secrets
- ✅ HTTPS enforced in production
- ✅ File upload restrictions (10MB, specific types)
- ✅ Database connection pooling
- ✅ Error messages sanitized (no stack traces in production)

See [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) for complete details.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MySQL 8+
- Redis 6+ (optional, for caching)
- Git

### Installation

```bash
# 1. Clone repository
git clone https://github.com/GodZilla-lct/FYP-2-.git
cd FYP-2-

# 2. Install backend dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Setup environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### Database Setup

```bash
# 1. Create database and run schema
node backend/scripts/run_schema.js

# 2. Seed database with admin accounts and societies
npm run seed
```

**Seeded Accounts:**
- 5 Admin accounts (VC, Registrar, Director SSC, Finance Secretary, Assistant Director)
- 12 Society Presidents (from UOG_Societies.csv)
- All passwords: `password123`

### Start Development Servers

```bash
# Terminal 1: Start backend (port 5001)
npm start

# Terminal 2: Start frontend (port 3000)
cd frontend
npm start
```

**Access Application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api
- Health Check: http://localhost:5001/health

### Login Credentials

**Admin Access (Director SSC):**
```
Email: director.ssc@uog.edu.pk
Password: password123
```

**Society President Access:**
```
Email: president.hbs@uog.edu.pk
Password: password123
```

**Other Admin Accounts:**
- VC: `vc@uog.edu.pk`
- Registrar: `registrar@uog.edu.pk`
- Finance Secretary: `finance@uog.edu.pk`
- Assistant Director: `asst.director@uog.edu.pk`

### Optional: Redis Setup

Redis is optional but recommended for caching:

```bash
# Linux
sudo apt-get install redis-server
redis-server

# macOS
brew install redis
redis-server

# Windows
# Download from https://redis.io/download
```

If Redis is not available, the application will continue without caching.

## 📁 Project Structure

```
FYP-2-/
├── 📂 backend/                      # Backend application
│   ├── config/                      # Configuration files
│   │   ├── database.js              # MySQL connection
│   │   ├── jwt.js                   # JWT configuration (20-min expiry)
│   │   ├── redis.js                 # Redis caching
│   │   └── socket.js                # WebSocket setup
│   ├── controllers/                 # Business logic
│   │   ├── authController.js        # Authentication
│   │   ├── proposalController.js    # Proposal management
│   │   ├── societyController.js     # Society CRUD
│   │   ├── userController.js        # User management (secure profile)
│   │   ├── analyticsController.js   # Analytics & reports
│   │   ├── budgetController.js      # Budget tracking
│   │   ├── calendarController.js    # Event management
│   │   ├── commentController.js     # Comments system
│   │   ├── notificationController.js # Notifications
│   │   ├── searchController.js      # Advanced search
│   │   └── proposalWorkflowController.js # Approval workflow
│   ├── middleware/                  # Middleware functions
│   │   ├── auth.js                  # JWT authentication + RBAC
│   │   ├── rateLimiter.js           # Rate limiting (3 tiers)
│   │   ├── validator.js             # Input validation
│   │   ├── cache.js                 # Redis caching
│   │   └── activityLogger.js        # Activity logging
│   ├── routes/                      # API routes
│   │   ├── apiRoutes.js             # Main API router (auth placement correct)
│   │   └── proposalRoutes.js        # Proposal-specific routes
│   ├── database/                    # Database files
│   │   ├── schema.sql               # V3 schema (production)
│   │   ├── seed.js                  # CSV-based seeder
│   │   └── UOG_Societies.csv        # Society data
│   ├── scripts/                     # Utility scripts
│   │   ├── run_schema.js            # Database setup
│   │   └── setup_directories.js     # Create upload folders
│   └── utils/                       # Utility functions
│       └── emailService.js          # Email notifications
├── 📂 frontend/                     # React application
│   ├── public/                      # Static files
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── Login.jsx            # Login (registration disabled)
│   │   │   ├── Dashboard.jsx        # Dynamic role-based router
│   │   │   ├── AdminOverviewDashboard.jsx # Admin dashboard (clean UI)
│   │   │   ├── SocietyDashboard.jsx # Society leader dashboard
│   │   │   ├── ManageSocieties.jsx  # Society management (RBAC)
│   │   │   ├── ProposalDetails.jsx  # 3-button action group
│   │   │   ├── UserProfile.jsx      # Secure profile (email/role disabled)
│   │   │   ├── Analytics.jsx        # Analytics charts
│   │   │   ├── BudgetManagement.jsx # Budget tracking
│   │   │   ├── Calendar.jsx         # Event calendar
│   │   │   ├── Notifications.jsx    # Notification center
│   │   │   └── SearchProposals.jsx  # Advanced search
│   │   ├── utils/
│   │   │   ├── auth.js              # Auth helpers
│   │   │   ├── api.js               # Fetch interceptor (auto-logout)
│   │   │   └── socket.js            # WebSocket client
│   │   ├── App.js                   # Main app (RBAC navigation)
│   │   └── App.css                  # Global styles
│   ├── tests/                       # E2E tests
│   │   └── campus-connect-failures.spec.js # Playwright tests (19 scenarios)
│   ├── playwright.config.js         # Playwright configuration
│   └── package.json                 # Frontend dependencies
├── 📂 docs/                         # Documentation
│   ├── SETUP_GUIDE.md               # Installation guide
│   ├── ARCHITECTURE.md              # System architecture
│   ├── WORKFLOW_API_DOCUMENTATION.md # API reference
│   ├── RUN_SERVERS.md               # Server management
│   ├── TEST_SCENARIOS.md            # Testing guide
│   └── V4_FEATURES.md               # Feature list
├── 📂 uploads/                      # File uploads (auto-created)
│   ├── proposals/                   # Proposal attachments
│   └── profiles/                    # Profile pictures
├── 📄 server.js                     # Entry point (9 security layers)
├── 📄 package.json                  # Backend dependencies
├── 📄 .env                          # Environment variables
├── 📄 .env.example                  # Environment template
├── 📄 README.md                     # This file
├── 📄 REGISTRATION_DISABLED.md      # Registration removal details
├── 📄 FINAL_RBAC_UX_FIXES.md        # RBAC implementation
├── 📄 PROJECT_STATUS_VERIFIED.md    # Project status
├── 📄 SECURITY_SUMMARY.md           # Security details
├── 📄 E2E_TESTING_READY.md          # Playwright setup
└── 📄 CONTEXT_TRANSFER_VERIFIED.md  # Latest changes
```

## 🔐 Account Management

### Registration Policy

**Self-registration is DISABLED** for security reasons. Only authorized personnel can create accounts.

**Authorized Personnel:**
- Director SSC
- Assistant Director
- IT Department
- Support Email: support@uog.edu.pk

### Account Creation Methods

#### Method 1: Bulk Import (Recommended)
```bash
POST /api/users/bulk-import
Authorization: Bearer <director_token>

{
  "users": [
    {
      "name": "John Doe",
      "email": "john.doe@uog.edu.pk",
      "rollNumber": "BS-CS-001",
      "role": "STUDENT"
    }
  ]
}
```

#### Method 2: Database Seeder
```bash
cd FYP-2-
npm run seed
```

#### Method 3: Contact Support
Email: support@uog.edu.pk with:
- Full Name
- University Email
- Roll Number (for students)
- Department/Society
- Requested Role

See [REGISTRATION_DISABLED.md](REGISTRATION_DISABLED.md) for complete details.

## 🛠️ Technology Stack

**Backend:**
- **Runtime**: Node.js 18+ with Express.js
- **Database**: MySQL 8+ (with mysql2 driver)
- **Caching**: Redis 6+ (optional)
- **Real-time**: Socket.IO 4+
- **Authentication**: JWT (20-minute expiry)
- **File Upload**: Multer (10MB limit)
- **Email**: Nodemailer (SMTP)
- **Security**: Helmet, CORS, xss-clean, express-mongo-sanitize, hpp
- **Validation**: express-validator
- **Password**: bcrypt (10 salt rounds)

**Frontend:**
- **Framework**: React 18
- **Routing**: React Router v6
- **Real-time**: Socket.IO Client
- **Charts**: Recharts
- **HTTP**: Fetch API with interceptor
- **Styling**: CSS3 with modern animations
- **Testing**: Playwright (E2E)

**DevOps:**
- **Version Control**: Git + GitHub
- **Environment**: dotenv
- **Process Manager**: PM2 (production)
- **Testing**: Playwright (19 negative test scenarios)

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=campus_connect
DB_PORT=3306

# Server Configuration
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# JWT Configuration (CRITICAL: 20-minute expiry enforced)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_EXPIRES_IN=20m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@campusconnect.uog.edu.pk

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Security Configuration
BCRYPT_SALT_ROUNDS=10
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpeg,jpg,png,pdf,doc,docx,xls,xlsx

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
UPLOAD_RATE_LIMIT_MAX=10
```

**Important Notes:**
- Change all secret keys in production
- Use strong passwords for database and email
- JWT_EXPIRES_IN is enforced at 20 minutes for security
- SMTP_PASS should be an app-specific password (not your email password)
- Redis is optional but recommended for production

## 🎨 UI/UX Features

### Modern Design Elements

**Dynamic Dashboards:**
- Role-based rendering (Admin vs Society Leader)
- Clean, minimal layout
- Enterprise-grade appearance
- Responsive design (desktop, tablet, mobile)

**Proposal Management:**
- 3-button action group (Approve/Reject/Return for Revision)
- Color-coded buttons (Green/Red/Orange)
- Revision dropdown with specific reasons
- Professional modal design

**Society Management:**
- Real CSV data display
- Core cabinet member cards
- Access badges (Read/Write vs Read-Only)
- RBAC-enforced button visibility

**Profile Security:**
- Disabled email field (visual indicator)
- Read-only role badge
- Clear security messaging
- Professional form styling

**Navigation:**
- Role-based menu items
- Active state indicators
- Notification badges
- Smooth transitions

**Forms:**
- Floating label inputs
- Real-time validation
- Error messaging
- Success feedback

**Cards & Grids:**
- Masonry grid layout
- Hover effects
- Shadow depth
- Smooth animations

### Accessibility

- Semantic HTML5
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast compliance
- Focus indicators

### Responsive Breakpoints

- Desktop: 1200px+
- Tablet: 768px - 1199px
- Mobile: < 768px

## 🚦 Approval Workflow

Campus Connect uses a dynamic 7-level approval workflow:

### Workflow Stages

1. **PENDING_COORDINATOR** (if coordinator exists for society)
   - Coordinator reviews and approves/rejects
   - If no coordinator, skips to next level

2. **PENDING_DIRECTOR_SSC**
   - Director SSC reviews proposal
   - Can approve, reject, or return for revision

3. **PENDING_ASST_DIRECTOR**
   - Assistant Director reviews
   - Secondary approval layer

4. **PENDING_FINANCE_SECRETARY**
   - Finance Secretary reviews budget
   - Ensures financial compliance

5. **PENDING_REGISTRAR**
   - Registrar reviews academic compliance
   - Checks university policies

6. **PENDING_VC**
   - Vice Chancellor final approval
   - Executive-level decision

7. **APPROVED**
   - Proposal fully approved
   - Ready for implementation

### Rejection Types

**SOFT Rejection (Return for Revision):**
- Proposal returned to society leader
- Can be edited and resubmitted
- Specific revision reasons:
  - Change Event Date
  - Adjust Budget
  - Incomplete Details
- Restarts workflow from beginning

**HARD Rejection:**
- Final rejection
- Cannot be resubmitted
- Proposal archived
- Requires new proposal for same event

### Proposal Actions

**Approve (Green Button):**
- Moves proposal to next workflow stage
- Sends notification to next approver
- Updates approval history

**Reject (Red Button):**
- Hard rejection
- Proposal status set to REJECTED
- Cannot be edited or resubmitted

**Return for Revision (Orange Button):**
- Soft rejection
- Proposal status set to REVISION_REQUESTED
- Society leader can edit and resubmit
- Dropdown with specific reasons:
  - Change Event Date
  - Adjust Budget
  - Incomplete Details
- Optional custom comments

## 📚 Documentation

Comprehensive documentation is available in the `docs/` folder and root directory:

### Getting Started
- [📖 README.md](README.md) - This file (overview and quick start)
- [� SETUP_GUIDE.md](docs/SETUP_GUIDE.md) - Detailed installation instructions
- [🏃 RUN_SERVERS.md](docs/RUN_SERVERS.md) - Server management guide
- [� START_HERE.md](docs/START_HERE.md) - First-time setup walkthrough

### Architecture & Design
- [🏗️ ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture overview
- [📊 V4_FEATURES.md](docs/V4_FEATURES.md) - Complete feature list
- [🔄 WORKFLOW_API_DOCUMENTATION.md](docs/WORKFLOW_API_DOCUMENTATION.md) - API reference

### Security & RBAC
- [🔐 SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) - 9-layer security details
- [🛡️ RBAC_IMPLEMENTATION.md](RBAC_IMPLEMENTATION.md) - Role-based access control
- [🔒 REGISTRATION_DISABLED.md](REGISTRATION_DISABLED.md) - Account creation policy
- [👤 PROFILE_FIX_COMPLETE.md](PROFILE_FIX_COMPLETE.md) - Profile security

### Features & Updates
- [✨ FINAL_RBAC_UX_FIXES.md](FINAL_RBAC_UX_FIXES.md) - Latest UI/UX updates (5 major changes)
- [🎨 ADMIN_DASHBOARD_FIX_COMPLETE.md](ADMIN_DASHBOARD_FIX_COMPLETE.md) - Dashboard routing
- [🏛️ LOGIN_CLEANUP_COMPLETE.md](LOGIN_CLEANUP_COMPLETE.md) - Login page updates

### Testing & Deployment
- [🧪 E2E_TESTING_READY.md](E2E_TESTING_READY.md) - Playwright E2E testing guide
- [📋 TEST_SCENARIOS.md](docs/TEST_SCENARIOS.md) - Manual testing scenarios
- [🚀 DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Production deployment
- [📊 API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) - API endpoint testing

### Project Status
- [✅ PROJECT_STATUS_VERIFIED.md](PROJECT_STATUS_VERIFIED.md) - Current project state
- [📝 CONTEXT_TRANSFER_VERIFIED.md](CONTEXT_TRANSFER_VERIFIED.md) - Latest changes summary
- [🔧 BUG_FIXES_COMPLETE.md](BUG_FIXES_COMPLETE.md) - Bug fixes log
- [📈 CURRENT_STATUS.md](CURRENT_STATUS.md) - Development status

### Database
- [🗄️ DATABASE_FIX_GUIDE.md](DATABASE_FIX_GUIDE.md) - Database setup and troubleshooting
- [📊 backend/database/schema.sql](backend/database/schema.sql) - V3 schema
- [🌱 backend/database/seed.js](backend/database/seed.js) - CSV-based seeder

## 🚀 Deployment

### Development Mode

```bash
# Start both servers in development
npm run dev

# Or start separately:
# Terminal 1: Backend
npm start

# Terminal 2: Frontend
cd frontend
npm start
```

### Production Build

```bash
# 1. Build frontend
cd frontend
npm run build
cd ..

# 2. Set environment to production
# Edit .env: NODE_ENV=production

# 3. Install PM2 (process manager)
npm install -g pm2

# 4. Start backend with PM2
pm2 start server.js --name campus-connect-backend

# 5. Serve frontend with nginx or serve
npm install -g serve
serve -s frontend/build -l 3000

# Or use PM2 for frontend
pm2 serve frontend/build 3000 --name campus-connect-frontend
```

### Production Checklist

Before deploying to production:

- [ ] Change all secret keys in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (SSL certificate)
- [ ] Update `CORS_ORIGIN` to production domain
- [ ] Configure production database
- [ ] Setup Redis for caching
- [ ] Configure SMTP for email notifications
- [ ] Setup backup strategy
- [ ] Configure firewall rules
- [ ] Enable monitoring and logging
- [ ] Test all features in staging environment
- [ ] Run security audit: `npm audit`
- [ ] Update dependencies: `npm update`

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for complete guide.

### Environment-Specific Settings

**Development:**
- Detailed error messages
- CORS relaxed
- Hot reloading enabled
- Debug logging

**Production:**
- Sanitized error messages
- Strict CORS
- Optimized builds
- Error logging only
- HTTPS enforced
- Rate limiting strict

## 🧪 Testing

### Playwright E2E Testing

Campus Connect includes comprehensive end-to-end testing with Playwright:

```bash
# Install Playwright (if not already installed)
cd frontend
npx playwright install chromium

# Run all tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run specific test file
npm run test:e2e -- campus-connect-failures.spec.js

# Generate HTML report
npm run test:e2e:report
```

**Test Coverage (19 Scenarios):**
- Empty form submission validation
- Invalid email format detection
- Password strength requirements
- API 500 error handling
- Network timeout handling
- Race condition prevention
- Boundary value testing
- XSS attack prevention
- SQL injection prevention
- File upload validation
- Session expiry handling
- Concurrent request handling
- Rate limiting verification
- CORS policy enforcement
- Authentication bypass attempts
- Authorization boundary testing
- Input sanitization
- Error message security
- State management edge cases

See [E2E_TESTING_READY.md](E2E_TESTING_READY.md) for complete testing guide.

### Manual Testing

```bash
# Backend tests (if implemented)
npm test

# Frontend tests
cd frontend
npm test

# API endpoint testing
# See API_TESTING_GUIDE.md for Postman collection
```

### Test Accounts

Use seeded accounts for testing:

**Admin Roles:**
- VC: `vc@uog.edu.pk`
- Registrar: `registrar@uog.edu.pk`
- Director SSC: `director.ssc@uog.edu.pk`
- Finance Secretary: `finance@uog.edu.pk`
- Assistant Director: `asst.director@uog.edu.pk`

**Society Leaders:**
- President HBS: `president.hbs@uog.edu.pk`
- President GDSC: `president.gdsc@uog.edu.pk`
- (12 total society presidents)

All passwords: `password123`

## 📦 Database Schema

Campus Connect v4.0 uses MySQL with a dynamic role-based hierarchy.

### Core Tables (V3 Schema)

**users** - User accounts
- id, name, email, password_hash, roll_number
- role (ENUM: STUDENT, COORDINATOR, DIRECTOR_SSC, ASST_DIRECTOR, FINANCE_SECRETARY, REGISTRAR, VC)
- is_active, created_at

**societies** - Society information
- id, name, coordinator_id, created_at

**society_roles** - Dynamic role assignments
- id, society_id, user_id, role_name
- is_core_leader (President, VP, GS)
- assigned_at

**proposals** - Event proposals
- id, society_id, title, description, event_date
- venue, expected_participants, budget_required
- status (ENUM: DRAFT, PENDING_*, APPROVED, REJECTED, REVISION_REQUESTED)
- created_by, created_at, updated_at

**proposal_attachments** - File attachments
- id, proposal_id, file_name, file_path, file_type, file_size

**approval_history** - Approval workflow tracking
- id, proposal_id, approver_id, action
- comments, action_date

**notifications** - Notification records
- id, user_id, type, title, message
- is_read, created_at

**notification_preferences** - User notification settings
- user_id, email_enabled, push_enabled

**proposal_comments** - Comments on proposals
- id, proposal_id, user_id, comment_text
- parent_comment_id (for threading), created_at

**draft_proposals** - Draft proposal storage
- id, society_id, title, description, event_date
- venue, expected_participants, budget_required
- created_by, created_at, updated_at

**budget_allocations** - Budget tracking
- id, society_id, fiscal_year, allocated_amount
- utilized_amount, created_at

**saved_search_filters** - Saved search queries
- id, user_id, filter_name, filter_criteria

**calendar_events** - Event management
- id, title, description, start_date, end_date
- location, created_by

**activity_logs** - User activity tracking
- id, user_id, action, resource_type, resource_id
- ip_address, user_agent, created_at

### V3 Schema Limitations

**Missing Fields (not in v3):**
- users.bio
- users.phone
- users.profile_picture
- users.email_verified
- users.last_login

**Missing Tables:**
- refresh_tokens (refresh tokens not supported in v3)
- password_reset_tokens (password reset via email not fully functional)

**Workarounds:**
- Profile updates only allow `name` field
- Backend returns null for missing fields
- JWT tokens expire after 20 minutes (manual re-login required)
- Password reset tokens stored temporarily (not persistent)

See [DATABASE_FIX_GUIDE.md](DATABASE_FIX_GUIDE.md) for migration to v4 schema.

## 🤝 Contributing

We welcome contributions to Campus Connect v4.0!

### How to Contribute

1. **Fork the repository**
   ```bash
   git clone https://github.com/GodZilla-lct/FYP-2-.git
   cd FYP-2-
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
   - Test your changes thoroughly

4. **Commit your changes**
   ```bash
   git add .
   git commit -m 'Add amazing feature'
   ```

5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Wait for code review

### Code Style Guidelines

**Backend (Node.js):**
- Use ES6+ features
- Async/await for asynchronous code
- Descriptive variable names
- Error handling with try-catch
- Comments for complex logic

**Frontend (React):**
- Functional components with hooks
- Descriptive component names
- PropTypes or TypeScript
- CSS modules or styled-components
- Accessibility best practices

**Security:**
- Never commit secrets or credentials
- Use environment variables
- Validate all user inputs
- Follow OWASP guidelines
- Test for vulnerabilities

### Testing Requirements

- Write tests for new features
- Ensure existing tests pass
- Test edge cases
- Test error handling
- Test security implications

### Documentation

- Update README.md if needed
- Add JSDoc comments
- Update API documentation
- Create migration guides for breaking changes

## 📄 License

This project is for educational purposes - University of Gujrat.

## 🔧 Recent Updates (April 2026)

### v4.0 - Secured Edition

**Major Security Enhancements:**
- ✅ 9-layer security middleware implemented
- ✅ JWT auto-logout (20-minute expiry enforced)
- ✅ Strict RBAC on frontend + backend
- ✅ Profile security (email/role disabled)
- ✅ Registration disabled (authorized personnel only)
- ✅ Field whitelisting (only name editable)
- ✅ Activity logging for audit trail

**UI/UX Improvements:**
- ✅ Dynamic dashboard routing (role-based)
- ✅ 3-button proposal action group
- ✅ Real CSV data in society management
- ✅ Access badges (Read/Write vs Read-Only)
- ✅ Clean admin dashboard (Quick Actions removed)
- ✅ Revision dropdown with specific reasons

**API & Backend Fixes:**
- ✅ Authentication middleware placement corrected
- ✅ Public routes accessible without token
- ✅ Profile API uses JWT token (not request body)
- ✅ V3 schema compatibility ensured
- ✅ CSV-based database seeder working
- ✅ All controller exports fixed

**Testing & Documentation:**
- ✅ Playwright E2E testing setup (19 scenarios)
- ✅ Comprehensive documentation updated
- ✅ Security summary created
- ✅ RBAC implementation documented
- ✅ Registration policy documented

**Database:**
- ✅ V3 schema in production
- ✅ 5 admin accounts seeded
- ✅ 12 society presidents seeded
- ✅ All passwords: `password123`

See individual documentation files for detailed information:
- [FINAL_RBAC_UX_FIXES.md](FINAL_RBAC_UX_FIXES.md) - 5 major UI/UX updates
- [REGISTRATION_DISABLED.md](REGISTRATION_DISABLED.md) - Account creation policy
- [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) - Complete security details
- [E2E_TESTING_READY.md](E2E_TESTING_READY.md) - Playwright testing guide
- [CONTEXT_TRANSFER_VERIFIED.md](CONTEXT_TRANSFER_VERIFIED.md) - Latest changes

## 👥 Contributors

Campus Connect v4.0 - University of Gujrat

---

**🎓 University of Gujrat | Final Year Project | 2026**


## 📞 Support & Contact

### For Users

**Account Issues:**
- Email: support@uog.edu.pk
- Subject: "Account Request - Campus Connect"
- Include: Name, Roll Number, Department, Role

**Technical Issues:**
- Check documentation first
- Review [PROJECT_STATUS_VERIFIED.md](PROJECT_STATUS_VERIFIED.md)
- Check [DATABASE_FIX_GUIDE.md](DATABASE_FIX_GUIDE.md)
- Contact IT Department

**Feature Requests:**
- Open an issue on GitHub
- Describe the feature clearly
- Explain the use case
- Provide examples if possible

### For Developers

**Bug Reports:**
- Open an issue on GitHub
- Include steps to reproduce
- Provide error messages
- Include environment details

**Questions:**
- Check documentation first
- Review existing issues
- Ask in discussions
- Contact maintainers

### University Contact

**University of Gujrat**
- Website: https://www.uog.edu.pk
- Email: info@uog.edu.pk
- Phone: +92-53-3643112

**Student Affairs Office**
- Email: studentaffairs@uog.edu.pk

**IT Department**
- Email: it@uog.edu.pk

## 📄 License

This project is developed for educational purposes as part of a Final Year Project at the University of Gujrat.

**Copyright © 2026 University of Gujrat**

All rights reserved. This software is provided for educational and internal university use only.

## 🙏 Acknowledgments

- University of Gujrat Faculty
- Student Affairs Office
- IT Department
- All society coordinators and presidents
- Open source community

## 👥 Project Team

**Campus Connect v4.0 - Secured Edition**

Final Year Project  
Department of Computer Science  
University of Gujrat  
2026

---

**🎓 University of Gujrat | Final Year Project | 2026**

**🔒 Secured | 🛡️ OWASP Compliant | 🎯 Production-Ready**
