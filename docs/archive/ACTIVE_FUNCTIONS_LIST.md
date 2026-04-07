# Campus Connect v4.0 - Active Functions & Activities List

## 📋 Complete Inventory of System Functions

**Generated:** April 5, 2026  
**Version:** 4.0.0  
**Total Functions:** 80+  
**Total API Endpoints:** 70+

---

## 🔐 1. AUTHENTICATION & AUTHORIZATION (11 Functions)

### Backend Functions (`authController.js`)
1. **register** - User registration with email verification
2. **login** - User authentication with JWT token generation
3. **refreshAccessToken** - Refresh expired access tokens
4. **logout** - User logout and token invalidation
5. **forgotPassword** - Send password reset email
6. **resetPassword** - Reset password with token
7. **verifyEmail** - Email verification for new users
8. **changePassword** - Change password for authenticated users
9. **getCurrentUser** - Get current authenticated user details

### Middleware Functions (`auth.js`)
10. **authenticate** - Verify JWT token and authenticate requests
11. **authorize** - Role-based access control

### API Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

---

## 📝 2. PROPOSAL MANAGEMENT (13 Functions)

### Backend Functions (`proposalController.js`)
1. **createProposal** - Create new proposal with file attachments
2. **getProposals** - Get all proposals (admin) or filtered by role
3. **getMyProposals** - Get proposals created by current user
4. **getProposalById** - Get single proposal with details and comments
5. **updateProposal** - Update proposal (before submission or during revision)
6. **deleteProposal** - Delete proposal (only drafts or pending)
7. **handleProposalStatusTransition** - Process proposal status changes

### Draft Management Functions
8. **getMyDrafts** - Get all draft proposals for current user
9. **saveDraft** - Save proposal as draft
10. **updateDraft** - Update existing draft
11. **deleteDraft** - Delete draft proposal
12. **publishDraft** - Publish draft as active proposal

### Helper Functions
13. **getNextStatus** - Calculate next approval status in workflow

### API Endpoints
- `GET /api/proposals` - Get all proposals
- `POST /api/proposals` - Create new proposal
- `GET /api/proposals/my-proposals` - Get my proposals
- `GET /api/proposals/:id` - Get proposal by ID
- `PUT /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal
- `GET /api/proposals/drafts/my-drafts` - Get my drafts
- `POST /api/proposals/drafts` - Save draft
- `PUT /api/proposals/drafts/:id` - Update draft
- `DELETE /api/proposals/drafts/:id` - Delete draft
- `POST /api/proposals/drafts/:id/publish` - Publish draft

---

## 🔄 3. PROPOSAL WORKFLOW (2 Functions)

### Backend Functions (`proposalWorkflowController.js`)
1. **processProposalNextStatus** - Process proposal to next approval stage
2. **Automatic notification creation** - Send notifications on status change

### API Endpoints
- `POST /api/proposals/next-status` - Move proposal to next status

### Workflow Stages
1. PENDING_COORDINATOR (if coordinator exists)
2. PENDING_DIRECTOR_SSC
3. PENDING_ASST_DIRECTOR
4. PENDING_FINANCE_SECRETARY
5. PENDING_REGISTRAR
6. PENDING_VC
7. APPROVED / REJECTED (SOFT/HARD)

---

## 🏢 4. SOCIETY MANAGEMENT (6 Functions)

### Backend Functions (`societyController.js`)
1. **getAllSocieties** - Get all societies with member counts
2. **getSocietyById** - Get society details with cabinet members
3. **createSociety** - Create new society (Director SSC only)
4. **updateSociety** - Update society information
5. **addCabinetMember** - Add cabinet member with auto-user creation
6. **removeCabinetMember** - Remove cabinet member from society

### API Endpoints
- `GET /api/societies` - Get all societies
- `GET /api/societies/:id` - Get society by ID
- `POST /api/societies` - Create society (Admin only)
- `PUT /api/societies/:id` - Update society (Admin only)
- `POST /api/societies/cabinet-member` - Add cabinet member (Admin only)
- `DELETE /api/societies/cabinet-member/:roleId` - Remove cabinet member (Admin only)

---

## 👤 5. USER MANAGEMENT (8 Functions)

### Backend Functions (`userController.js`)
1. **getUserProfile** - Get user profile information
2. **updateUserProfile** - Update user profile details
3. **uploadProfilePicture** - Upload/update profile picture
4. **getUserActivity** - Get user activity history
5. **deactivateUser** - Deactivate user account (Admin only)
6. **reactivateUser** - Reactivate user account (Admin only)
7. **bulkImportUsers** - Import multiple users from CSV/JSON (Admin only)
8. **getUserDashboard** - Get personalized dashboard data

### API Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile/picture` - Upload profile picture
- `GET /api/users/activity` - Get user activity
- `PUT /api/users/:id/deactivate` - Deactivate user (Admin only)
- `PUT /api/users/:id/reactivate` - Reactivate user (Admin only)
- `POST /api/users/bulk-import` - Bulk import users (Admin only)
- `GET /api/dashboard` - Get user dashboard

---

## 🔔 6. NOTIFICATIONS (6 Functions)

### Backend Functions (`notificationController.js`)
1. **getNotifications** - Get user notifications with pagination
2. **markAsRead** - Mark single notification as read
3. **markAllAsRead** - Mark all notifications as read
4. **getNotificationPreferences** - Get user notification preferences
5. **updateNotificationPreferences** - Update notification preferences
6. **createNotification** - Create new notification (internal)

### Real-time Features
- WebSocket notifications via Socket.IO
- Email notifications via SMTP
- In-app notification badges

### API Endpoints
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/mark-all-read` - Mark all as read
- `GET /api/notifications/preferences` - Get preferences
- `PUT /api/notifications/preferences` - Update preferences

---

## 💬 7. COMMENTS & COLLABORATION (4 Functions)

### Backend Functions (`commentController.js`)
1. **getComments** - Get all comments for a proposal
2. **addComment** - Add comment to proposal
3. **updateComment** - Update own comment
4. **deleteComment** - Delete own comment (or admin)

### Real-time Features
- Real-time comment updates via WebSocket
- Comment notifications

### API Endpoints
- `GET /api/proposals/:id/comments` - Get comments
- `POST /api/proposals/:id/comments` - Add comment
- `PUT /api/proposals/:proposalId/comments/:commentId` - Update comment
- `DELETE /api/proposals/:proposalId/comments/:commentId` - Delete comment

---

## 📊 8. ANALYTICS & REPORTING (3 Functions)

### Backend Functions (`analyticsController.js`)
1. **getDashboardAnalytics** - Get comprehensive dashboard analytics
2. **getSocietyAnalytics** - Get society-specific analytics
3. **exportAnalyticsReport** - Export analytics to CSV/PDF

### Analytics Metrics
- Total proposals by status
- Approval rates and trends
- Budget utilization
- Timeline analysis
- Society performance
- User activity metrics

### API Endpoints
- `GET /api/analytics/overview` - Get dashboard analytics
- `GET /api/analytics/society/:id` - Get society analytics
- `GET /api/analytics/export` - Export analytics report (Admin only)

---

## 🔍 9. ADVANCED SEARCH (5 Functions)

### Backend Functions (`searchController.js`)
1. **searchProposals** - Advanced proposal search with filters
2. **searchUsers** - Search users by name, email, roll number
3. **getSavedFilters** - Get user's saved search filters
4. **saveSearchFilter** - Save search filter for reuse
5. **deleteSavedFilter** - Delete saved search filter

### Search Features
- Full-text search
- Multi-criteria filtering (status, society, date, budget)
- Sorting and pagination
- Save and reuse filters
- Export search results

### API Endpoints
- `GET /api/search/proposals` - Search proposals
- `GET /api/search/users` - Search users
- `GET /api/search/filters` - Get saved filters
- `POST /api/search/filters` - Save search filter
- `DELETE /api/search/filters/:id` - Delete saved filter

---

## 💰 10. BUDGET MANAGEMENT (4 Functions)

### Backend Functions (`budgetController.js`)
1. **getBudgetAllocations** - Get budget allocations for all societies
2. **setBudgetAllocation** - Set/update budget allocation for society
3. **getBudgetSummary** - Get overall budget summary and metrics
4. **checkBudgetAvailability** - Check if society has sufficient budget

### Budget Features
- Financial year tracking
- Allocation vs. spent tracking
- Utilization percentage
- Budget approval workflow
- Real-time budget checks

### API Endpoints
- `GET /api/budget/allocations` - Get allocations (Admin/Finance)
- `POST /api/budget/allocations` - Set allocation (Admin/Finance)
- `GET /api/budget/summary` - Get budget summary (Admin/Finance)
- `GET /api/budget/check/:societyId` - Check budget availability

---

## 📅 11. CALENDAR & EVENTS (6 Functions)

### Backend Functions (`calendarController.js`)
1. **getCalendarEvents** - Get calendar events with filters
2. **createCalendarEvent** - Create event from approved proposal
3. **updateCalendarEvent** - Update event details
4. **deleteCalendarEvent** - Delete calendar event
5. **checkEventConflicts** - Check for scheduling conflicts
6. **exportCalendar** - Export calendar to iCal format

### Calendar Features
- Event creation from approved proposals
- Conflict detection
- Multiple view modes (month/week/day)
- iCal export for external calendars
- Event reminders

### API Endpoints
- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/events` - Create event (Admin only)
- `PUT /api/calendar/events/:id` - Update event (Admin only)
- `DELETE /api/calendar/events/:id` - Delete event (Admin only)
- `GET /api/calendar/check-conflicts` - Check conflicts
- `GET /api/calendar/export` - Export to iCal

---

## 🛡️ 12. SECURITY & MIDDLEWARE (10 Functions)

### Authentication Middleware (`auth.js`)
1. **authenticate** - JWT token verification
2. **authorize** - Role-based access control

### Validation Middleware (`validator.js`)
3. **validateLogin** - Validate login credentials
4. **validateRegistration** - Validate registration data
5. **validateProposal** - Validate proposal data
6. **validateEmail** - Validate email format
7. **validatePasswordReset** - Validate password reset data
8. **validateId** - Validate ID parameters

### Rate Limiting (`rateLimiter.js`)
9. **apiLimiter** - General API rate limiting (100 req/15min)
10. **authLimiter** - Auth endpoint rate limiting (5 req/15min)
11. **uploadLimiter** - File upload rate limiting (10 req/hour)

### Activity Logging (`activityLogger.js`)
12. **logActivity** - Log user activities for audit trail

### Caching (`cache.js`)
13. **cacheMiddleware** - Redis caching for frequent queries

---

## 📧 13. EMAIL SERVICES (1 Function)

### Backend Functions (`emailService.js`)
1. **sendEmail** - Send emails via SMTP

### Email Templates
- Welcome email
- Password reset
- Proposal status updates
- Approval notifications
- Rejection notifications
- Event reminders

---

## 🌐 14. REAL-TIME FEATURES (WebSocket)

### Socket.IO Events (`socket.js`)
1. **connection** - Handle client connections
2. **disconnect** - Handle client disconnections
3. **join-room** - Join user-specific room
4. **leave-room** - Leave room

### Emitted Events
- `notification` - New notification
- `proposal-update` - Proposal status change
- `comment-added` - New comment on proposal
- `budget-update` - Budget allocation change

---

## 🎨 15. FRONTEND COMPONENTS (17 Components)

### Authentication Components
1. **Login.jsx** - User login interface
2. **Register.jsx** - User registration form
3. **ForgotPassword.jsx** - Password reset request
4. **ResetPassword.jsx** - Password reset form

### Dashboard Components
5. **AdminDashboard.jsx** - Admin dashboard with analytics
6. **SocietyDashboard.jsx** - Society leader dashboard with drafts
7. **AdminHierarchy.jsx** - Society hierarchy management

### Feature Components
8. **Analytics.jsx** - Analytics dashboard with charts
9. **Notifications.jsx** - Notification center
10. **SearchProposals.jsx** - Advanced search interface
11. **Calendar.jsx** - Calendar view with events
12. **BudgetManagement.jsx** - Budget tracking interface
13. **UserProfile.jsx** - User profile management

### Custom Hooks
14. **useNotifications.js** - Notification management hook
15. **useRealtime.js** - Real-time updates hook

### Utilities
16. **auth.js** - Authentication utilities (JWT management)
17. **socket.js** - WebSocket client utilities

---

## 📊 16. DATABASE TABLES (16 Tables)

### Core Tables
1. **users** - User accounts and authentication
2. **societies** - Society information
3. **society_roles** - Dynamic role assignments
4. **proposals** - Event proposals
5. **proposal_attachments** - File attachments

### V4.0 New Tables
6. **refresh_tokens** - JWT refresh token storage
7. **password_reset_tokens** - Password reset tokens
8. **notifications** - Notification records
9. **notification_preferences** - User notification settings
10. **proposal_comments** - Comments on proposals
11. **draft_proposals** - Draft proposal storage
12. **budget_allocations** - Budget tracking
13. **saved_search_filters** - Saved search queries
14. **calendar_events** - Event management
15. **activity_logs** - User activity tracking
16. **approval_history** - Proposal approval workflow tracking

---

## 🎯 17. USER ROLES & PERMISSIONS

### Available Roles
1. **SOCIETY_PRESIDENT** - Full proposal management for society
2. **SOCIETY_VP** - Full proposal management for society
3. **SOCIETY_GENERAL_SECRETARY** - Full proposal management for society
4. **COORDINATOR** - First-level approval (if exists)
5. **DIRECTOR_SSC** - Full admin access + analytics
6. **ASST_DIRECTOR** - Approval + analytics
7. **FINANCE_SECRETARY** - Budget approval
8. **REGISTRAR** - System oversight
9. **VC** - Final approval authority

### Permission Matrix
- **Create Proposals:** Society leaders only
- **Approve Proposals:** Approval chain based on role
- **Manage Societies:** Director SSC only
- **View Analytics:** Admin roles only
- **Manage Budget:** Director SSC, Finance Secretary
- **Manage Users:** Director SSC only

---

## 📈 18. SYSTEM ACTIVITIES

### Automated Activities
1. **Email Notifications** - Automatic on status changes
2. **WebSocket Updates** - Real-time UI updates
3. **Activity Logging** - Automatic audit trail
4. **Token Refresh** - Automatic JWT refresh
5. **Cache Invalidation** - Automatic on data updates
6. **Budget Calculations** - Real-time budget tracking

### Scheduled Activities (Potential)
- Daily budget reports
- Weekly analytics summaries
- Monthly society performance reports
- Event reminders (24h before)
- Pending proposal reminders

---

## 🔧 19. UTILITY FUNCTIONS

### File Upload
- Profile picture upload (images only)
- Proposal attachments (PDF, DOC, XLS, images)
- File size limit: 10MB
- Multiple file support (up to 5 files)

### Data Export
- Analytics export (CSV/PDF)
- Calendar export (iCal)
- Search results export
- Budget reports export

### Data Validation
- Email format validation
- Password strength validation
- File type validation
- Input sanitization
- SQL injection prevention
- XSS protection

---

## 📊 SUMMARY STATISTICS

### Backend
- **Controllers:** 11
- **Total Functions:** 60+
- **API Endpoints:** 70+
- **Middleware Functions:** 10+
- **Database Tables:** 16

### Frontend
- **Components:** 17
- **Custom Hooks:** 2
- **Utility Files:** 2

### Features
- **Major Feature Categories:** 12
- **User Roles:** 9
- **Workflow Stages:** 7
- **Real-time Events:** 4+

---

## 🚀 ACTIVE INTEGRATIONS

1. **MySQL Database** - Data persistence
2. **Redis** - Caching and session management
3. **Socket.IO** - Real-time communication
4. **JWT** - Authentication tokens
5. **Nodemailer** - Email service
6. **Multer** - File uploads
7. **Bcrypt** - Password hashing
8. **Helmet** - Security headers
9. **CORS** - Cross-origin resource sharing
10. **Compression** - Response compression

---

## 📝 NOTES

- All functions are production-ready and tested
- Zero syntax errors across all files
- Comprehensive error handling implemented
- Security best practices followed
- Real-time features fully functional
- Scalable architecture for future growth

---

**Last Updated:** April 5, 2026  
**Status:** ✅ All Functions Active and Operational  
**Version:** 4.0.0

