# Campus Connect v4.0 - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React Frontend (Port 3000)                   │   │
│  │  • 17 Components  • Real-time UI  • Responsive Design    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Node.js + Express (Port 5000)                   │   │
│  │  • 11 Controllers  • 5 Middleware  • 65+ Endpoints       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Socket.IO Server                         │   │
│  │  • Real-time Notifications  • Live Updates               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                       CACHING LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Redis Cache (Port 6379)                  │   │
│  │  • Session Storage  • Query Cache  • Rate Limiting       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              MySQL Database (Port 3306)                   │   │
│  │  • 16 Tables  • Foreign Keys  • Indexes                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│  ┌────────────────────┐  ┌────────────────────┐                │
│  │   SMTP Server      │  │   File Storage     │                │
│  │  (Email Delivery)  │  │  (Uploads Folder)  │                │
│  └────────────────────┘  └────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow

### Standard HTTP Request:
```
User → Frontend → API Gateway → Middleware → Controller → Database → Response
                                    ↓
                              Rate Limiter
                              Validator
                              Auth Check
                              Cache Check
                              Activity Log
```

### WebSocket Real-Time Flow:
```
Event Trigger → Controller → Socket.IO → Connected Clients → UI Update
                                ↓
                          Notification
                          Database Log
```

---

## 🎯 Component Architecture

### Backend Components:

```
┌─────────────────────────────────────────────────────────┐
│                    Express Server                        │
├─────────────────────────────────────────────────────────┤
│  Middleware Layer:                                       │
│  • Authentication (JWT)                                  │
│  • Validation (express-validator)                       │
│  • Rate Limiting (express-rate-limit)                   │
│  • Caching (Redis)                                       │
│  • Activity Logging                                      │
│  • Security (Helmet)                                     │
│  • Compression                                           │
├─────────────────────────────────────────────────────────┤
│  Controller Layer:                                       │
│  • authController - Authentication                       │
│  • proposalController - Proposals & Drafts              │
│  • proposalWorkflowController - Workflow                │
│  • societyController - Society Management               │
│  • notificationController - Notifications               │
│  • commentController - Comments                         │
│  • analyticsController - Analytics                      │
│  • searchController - Search                            │
│  • userController - User Profiles                       │
│  • budgetController - Budget Management                 │
│  • calendarController - Calendar                        │
├─────────────────────────────────────────────────────────┤
│  Service Layer:                                          │
│  • emailService - Email notifications                    │
│  • socketService - Real-time updates                    │
│  • cacheService - Redis caching                         │
├─────────────────────────────────────────────────────────┤
│  Data Layer:                                             │
│  • MySQL Connection Pool                                 │
│  • Query Builders                                        │
│  • Transaction Management                                │
└─────────────────────────────────────────────────────────┘
```

### Frontend Components:

```
┌─────────────────────────────────────────────────────────┐
│                      React App                           │
├─────────────────────────────────────────────────────────┤
│  Routing Layer:                                          │
│  • App.js - Main router & navigation                     │
│  • View switching logic                                  │
├─────────────────────────────────────────────────────────┤
│  Component Layer:                                        │
│  Authentication:                                         │
│  • Login, Register, ForgotPassword, ResetPassword       │
│                                                          │
│  Dashboards:                                             │
│  • SocietyDashboard, AdminDashboard, AdminHierarchy     │
│                                                          │
│  Features:                                               │
│  • Analytics, Notifications, SearchProposals            │
│  • Calendar, BudgetManagement, UserProfile              │
├─────────────────────────────────────────────────────────┤
│  Hooks Layer:                                            │
│  • useNotifications - Notification management            │
│  • useRealtime - Real-time updates                      │
├─────────────────────────────────────────────────────────┤
│  Utility Layer:                                          │
│  • auth.js - JWT token management                        │
│  • socket.js - WebSocket client                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Security Layers                        │
├─────────────────────────────────────────────────────────┤
│  Layer 1: Network Security                               │
│  • HTTPS/TLS                                             │
│  • CORS Configuration                                    │
│  • Helmet Security Headers                              │
├─────────────────────────────────────────────────────────┤
│  Layer 2: Authentication                                 │
│  • JWT Access Tokens (1 hour)                           │
│  • JWT Refresh Tokens (7 days)                          │
│  • Password Hashing (bcrypt)                            │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Authorization                                  │
│  • Role-Based Access Control (RBAC)                     │
│  • Permission Checks                                     │
│  • Resource Ownership Validation                        │
├─────────────────────────────────────────────────────────┤
│  Layer 4: Input Validation                               │
│  • express-validator                                     │
│  • SQL Injection Prevention                             │
│  • XSS Protection                                        │
├─────────────────────────────────────────────────────────┤
│  Layer 5: Rate Limiting                                  │
│  • Auth Endpoints: 5 req/min                            │
│  • API Endpoints: 100 req/15min                         │
│  • Upload Endpoints: 10 req/hour                        │
├─────────────────────────────────────────────────────────┤
│  Layer 6: Monitoring                                     │
│  • Activity Logging                                      │
│  • Error Tracking                                        │
│  • Audit Trails                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 💾 Database Architecture

### Entity Relationship Overview:

```
┌──────────┐       ┌──────────────┐       ┌───────────┐
│  Users   │──────<│ Society_Roles│>──────│ Societies │
└──────────┘       └──────────────┘       └───────────┘
     │                                           │
     │                                           │
     ├──────────────────┐                       │
     │                  │                       │
     ↓                  ↓                       ↓
┌──────────┐      ┌──────────┐         ┌───────────┐
│Proposals │      │  Drafts  │         │  Budget   │
└──────────┘      └──────────┘         └───────────┘
     │                                       
     ├──────────────┬──────────────┬─────────────┐
     ↓              ↓              ↓             ↓
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Attachments│  │ Comments │  │ History  │  │ Calendar │
└──────────┘  └──────────┘  └──────────┘  └──────────┘

┌──────────────┐       ┌──────────────────┐
│Notifications │       │ Activity_Logs    │
└──────────────┘       └──────────────────┘
```

### Table Relationships:
- **users** → proposals (1:N)
- **users** → society_roles (1:N)
- **societies** → society_roles (1:N)
- **societies** → proposals (1:N)
- **proposals** → attachments (1:N)
- **proposals** → comments (1:N)
- **proposals** → history (1:N)
- **proposals** → calendar_events (1:1)
- **users** → notifications (1:N)
- **users** → activity_logs (1:N)

---

## 🔄 Data Flow Diagrams

### Proposal Creation Flow:

```
Society Leader
      ↓
[Create Proposal Form]
      ↓
Save as Draft? ──Yes→ [Draft Storage] ──Publish→ [Proposal Created]
      ↓ No
[Proposal Created]
      ↓
[Validation]
      ↓
[Database Insert]
      ↓
[File Upload]
      ↓
[Notification Created]
      ↓
[Email Sent]
      ↓
[WebSocket Broadcast]
      ↓
[Success Response]
```

### Approval Workflow:

```
[Proposal Submitted]
      ↓
[PENDING_COORDINATOR] ──Approve→ [PENDING_DIRECTOR_SSC]
      ↓ Reject                         ↓ Approve
[RETURNED/REJECTED]              [PENDING_ASST_DIRECTOR]
                                       ↓ Approve
                                 [PENDING_FINANCE_SEC]
                                       ↓ Approve
                                 [PENDING_REGISTRAR]
                                       ↓ Approve
                                 [PENDING_VC]
                                       ↓ Approve
                                 [APPROVED]

At each step:
• Notification sent
• Email delivered
• WebSocket update
• History logged
```

### Real-Time Notification Flow:

```
[Event Occurs]
      ↓
[Controller Creates Notification]
      ↓
[Database Insert]
      ↓
[Email Service] ──→ [SMTP Server] ──→ [User Email]
      ↓
[Socket.IO Emit] ──→ [Connected Clients] ──→ [UI Update]
      ↓
[Success]
```

---

## 🎨 Frontend Architecture

### Component Hierarchy:

```
App.js (Root)
├── Login/Register/ForgotPassword (Auth)
│
└── Authenticated App
    ├── Header (Navigation)
    │   ├── Proposals Button
    │   ├── Analytics Button
    │   ├── Calendar Button
    │   ├── Search Button
    │   ├── Notifications Button (with badge)
    │   ├── Profile Button
    │   └── Logout Button
    │
    └── Main Content (View Switching)
        ├── SocietyDashboard
        │   ├── Proposals Tab
        │   ├── Drafts Tab
        │   └── Cabinet Tab
        │
        ├── AdminDashboard
        │   ├── Pending Approvals
        │   └── All Proposals
        │
        ├── AdminHierarchy
        │   └── Society Management
        │
        ├── Analytics
        │   ├── Overview Stats
        │   ├── Charts
        │   └── Reports
        │
        ├── Notifications
        │   ├── Notification List
        │   └── Preferences
        │
        ├── SearchProposals
        │   ├── Search Form
        │   ├── Filters
        │   └── Results
        │
        ├── Calendar
        │   ├── Month View
        │   └── Event List
        │
        ├── BudgetManagement
        │   ├── Allocations
        │   └── Reports
        │
        └── UserProfile
            ├── Profile Info
            ├── Activity History
            └── Preferences
```

---

## 🔌 API Architecture

### RESTful API Structure:

```
/api
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   ├── POST /logout
│   ├── POST /forgot-password
│   └── POST /reset-password
│
├── /proposals
│   ├── GET / (all)
│   ├── POST / (create)
│   ├── GET /my-proposals
│   ├── GET /:id
│   ├── PUT /:id
│   ├── DELETE /:id
│   ├── POST /next-status
│   │
│   ├── /drafts
│   │   ├── GET /
│   │   ├── POST /
│   │   ├── PUT /:id
│   │   ├── DELETE /:id
│   │   └── POST /:id/publish
│   │
│   └── /:id/comments
│       ├── GET /
│       ├── POST /
│       ├── PUT /:commentId
│       └── DELETE /:commentId
│
├── /notifications
│   ├── GET /
│   ├── PUT /:id/read
│   ├── PUT /mark-all-read
│   ├── GET /preferences
│   └── PUT /preferences
│
├── /analytics
│   ├── GET /overview
│   ├── GET /proposals
│   ├── GET /budget
│   └── GET /timeline
│
├── /search
│   ├── GET /proposals
│   ├── POST /save-filter
│   └── GET /saved-filters
│
├── /calendar
│   ├── GET /events
│   ├── POST /events
│   ├── PUT /events/:id
│   └── DELETE /events/:id
│
├── /budget
│   ├── GET /allocations
│   ├── POST /allocations
│   └── GET /society/:id
│
├── /users
│   ├── GET /profile
│   ├── PUT /profile
│   ├── POST /profile/picture
│   ├── GET /activity
│   └── GET /:id
│
├── /societies
│   ├── GET /
│   ├── GET /:id
│   ├── POST /
│   ├── PUT /:id
│   ├── POST /cabinet-member
│   └── DELETE /cabinet-member/:id
│
└── /dashboard
    └── GET /
```

---

## 🔄 WebSocket Events

### Client → Server:
```javascript
socket.emit('joinProposal', proposalId)
socket.emit('leaveProposal', proposalId)
socket.emit('typing', { proposalId, userName })
```

### Server → Client:
```javascript
socket.emit('notification', notificationData)
socket.emit('proposalUpdate', updateData)
socket.emit('newComment', commentData)
socket.emit('userTyping', typingData)
```

---

## 💾 Database Schema

### Core Tables:
```sql
users
├── id (PK)
├── name
├── email (UNIQUE)
├── password_hash
├── roll_number (UNIQUE)
├── role (ENUM)
└── timestamps

societies
├── id (PK)
├── name
├── description
└── timestamps

society_roles
├── id (PK)
├── society_id (FK → societies)
├── user_id (FK → users)
├── role_name
└── is_core_leader

proposals
├── id (PK)
├── society_id (FK → societies)
├── user_id (FK → users)
├── title
├── description
├── event_date
├── budget_requested
├── current_status (ENUM)
├── rejection_reason
├── rejection_type
└── timestamps
```

### New Tables (v4.0):
```sql
notifications
├── id (PK)
├── user_id (FK → users)
├── type
├── title
├── message
├── is_read
├── related_proposal_id
└── timestamps

proposal_comments
├── id (PK)
├── proposal_id (FK → proposals)
├── user_id (FK → users)
├── comment
└── timestamps

draft_proposals
├── id (PK)
├── user_id (FK → users)
├── society_id (FK → societies)
├── title
├── description
├── event_date
├── budget_requested
└── timestamps

[+ 7 more tables]
```

---

## 🚀 Deployment Architecture

### Development:
```
Developer Machine
├── Node.js Server (localhost:5000)
├── React Dev Server (localhost:3000)
├── MySQL (localhost:3306)
└── Redis (localhost:6379)
```

### Production:
```
┌─────────────────────────────────────────┐
│         Load Balancer / Nginx            │
│              (Port 80/443)               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      Application Servers (PM2)           │
│  • Node.js Instance 1                    │
│  • Node.js Instance 2                    │
│  • Node.js Instance N                    │
└─────────────────────────────────────────┘
                  ↓
┌──────────────────┐  ┌──────────────────┐
│  MySQL Database  │  │  Redis Cluster   │
│  (Master/Slave)  │  │  (Cache Layer)   │
└──────────────────┘  └──────────────────┘
```

---

## 📊 Performance Architecture

### Caching Strategy:

```
Request → Check Redis Cache
              ↓
         Cache Hit? ──Yes→ Return Cached Data
              ↓ No
         Query Database
              ↓
         Store in Cache (TTL: 5min)
              ↓
         Return Data
```

### Cache Layers:
1. **L1**: Redis (in-memory, 5-minute TTL)
2. **L2**: MySQL Query Cache
3. **L3**: Connection Pool

---

## 🔄 State Management

### Frontend State:
```
App State (React useState)
├── currentUser
├── view (current page)
├── authView (login/register)
└── unreadNotifications

Component State
├── Local data (proposals, drafts, etc.)
├── Loading states
├── Error states
└── Success messages

Real-Time State (WebSocket)
├── Live notifications
├── Live proposal updates
└── Live comments
```

---

## 🎯 Scalability Architecture

### Horizontal Scaling:
```
Load Balancer
      ↓
┌─────┴─────┬─────────┬─────────┐
│  Node 1   │  Node 2 │  Node N │
└───────────┴─────────┴─────────┘
      ↓           ↓         ↓
┌─────────────────────────────────┐
│      Shared Redis Cache          │
└─────────────────────────────────┘
      ↓           ↓         ↓
┌─────────────────────────────────┐
│    MySQL Master/Slave Cluster    │
└─────────────────────────────────┘
```

### Vertical Scaling:
- Increase server resources (CPU, RAM)
- Optimize database queries
- Increase connection pool size
- Add more Redis memory

---

## 🔧 Technology Stack Details

### Backend Stack:
```
┌─────────────────────────────────────┐
│  Runtime: Node.js v18+               │
│  Framework: Express v4.18            │
│  Database: MySQL v8.0                │
│  Cache: Redis v6.0                   │
│  Real-time: Socket.IO v4.7           │
│  Auth: JWT (jsonwebtoken)            │
│  Email: Nodemailer v6.9              │
│  Security: Helmet v7.0               │
│  Validation: express-validator       │
│  Rate Limit: express-rate-limit      │
└─────────────────────────────────────┘
```

### Frontend Stack:
```
┌─────────────────────────────────────┐
│  Library: React v18.2                │
│  Router: React Router v6.20          │
│  Charts: Recharts v2.10              │
│  WebSocket: Socket.IO Client v4.7   │
│  HTTP: Axios v1.6                    │
│  Build: React Scripts v5.0           │
└─────────────────────────────────────┘
```

---

## 📈 Monitoring Architecture

### Application Monitoring:
```
Application
      ↓
Activity Logger Middleware
      ↓
┌─────────────────────────────────┐
│  Activity Logs Table             │
│  • User actions                  │
│  • API calls                     │
│  • Errors                        │
│  • Performance metrics           │
└─────────────────────────────────┘
      ↓
[Analytics Dashboard]
```

### System Monitoring:
- PM2 process monitoring
- Redis memory usage
- MySQL connection pool
- Disk space
- Network traffic

---

## 🎊 ARCHITECTURE HIGHLIGHTS

### Strengths:
- ✅ **Modular Design** - Easy to maintain and extend
- ✅ **Scalable** - Horizontal and vertical scaling
- ✅ **Secure** - Multiple security layers
- ✅ **Fast** - Redis caching, optimized queries
- ✅ **Real-time** - WebSocket integration
- ✅ **Reliable** - Error handling, logging
- ✅ **Documented** - Comprehensive documentation

### Best Practices:
- ✅ Separation of concerns
- ✅ DRY (Don't Repeat Yourself)
- ✅ SOLID principles
- ✅ RESTful API design
- ✅ Secure by default
- ✅ Performance optimized

---

## 📞 Related Documentation

- **[START_HERE_V4.md](START_HERE_V4.md)** - Master navigation
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed architecture
- **[docs/V4_FEATURES.md](docs/V4_FEATURES.md)** - Feature documentation
- **[PROJECT_STRUCTURE_V4.md](PROJECT_STRUCTURE_V4.md)** - File structure

---

**🏗️ Campus Connect v4.0 - Enterprise Architecture**

*Designed for scale, built for performance, secured for production*
