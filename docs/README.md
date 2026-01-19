# Campus Connect - University Management Portal (MVP)

A robust backend system for managing university society proposals with a complex conditional approval workflow.

## 📋 Project Overview

Campus Connect is a 30% MVP focused on building a sophisticated approval workflow engine for university society proposals. The system handles dynamic hierarchies, conditional status transitions, and multi-level approvals.

### Key Features

✅ **Conditional Approval Workflow**
- Adapts based on whether a society has a coordinator
- 7-step approval chain (or 6-step if no coordinator)
- Rejection & revision loop

✅ **Dynamic Society Hierarchy**
- Societies can have or not have coordinators
- Flexible president and coordinator assignments
- Supports 14 different societies

✅ **Role-Based Access Control**
- 7 distinct roles with specific permissions
- Authorization checks at each workflow stage
- Audit trail for compliance

✅ **File Management**
- Proposal attachments support
- Document tracking and versioning
- File URL storage

✅ **Approval History**
- Complete audit trail of all actions
- Rejection reasons stored
- Timestamp tracking

---

## 📁 Deliverables

### 1. Database Schema (`schema.sql`)
- **Users Table:** 7 roles (PRESIDENT, COORDINATOR, DIRECTOR_SSC, ASST_DIRECTOR, FINANCE_SECRETARY, REGISTRAR, VC)
- **Societies Table:** Dynamic hierarchy with nullable coordinator_id
- **Proposals Table:** Status tracking with rejection reasons
- **Proposal Attachments Table:** File management
- **Approval History Table:** Audit trail
- **Indexes:** Performance optimization

### 2. Seed Script (`seed.js`)
- 7 admin users (Director SSC, 3 ADs, Finance Secretary, Registrar, VC)
- 14 societies (12 with coordinators, 2 without)
- 3 sample proposals in various stages
- Hashed passwords for security

### 3. Workflow Controller (`proposalWorkflowController.js`)
- **handleProposalStatusTransition()** - Main workflow engine
- **getNextStatus()** - Status determination logic
- **getProposalDetails()** - Fetch proposal with history
- **createProposal()** - Create with conditional initial status
- **uploadAttachment()** - File management

### 4. Routes (`proposalRoutes.js`)
- `POST /proposals` - Create proposal
- `GET /proposals/:id` - Get proposal details
- `POST /proposals/next-status` - Approve/Reject/Resubmit
- `POST /proposals/:id/attachments` - Upload files

### 5. Documentation
- **WORKFLOW_API_DOCUMENTATION.md** - Complete API reference
- **SETUP_GUIDE.md** - Installation & configuration
- **TEST_SCENARIOS.md** - 8 detailed test scenarios with examples

---

## 🔄 Approval Workflow

### The Happy Path

```
Proposal Created
    ↓
[Check: Does society have coordinator?]
    ├─ YES → PENDING_COORDINATOR
    └─ NO → PENDING_DIRECTOR_SSC (SKIP)
    ↓
Coordinator Approves (if exists)
    ↓
PENDING_DIRECTOR_SSC
    ↓
Director SSC Approves & Assigns AD
    ↓
PENDING_ASST_DIRECTOR
    ↓
Assistant Director Approves
    ↓
PENDING_FINANCE_SECRETARY
    ↓
Finance Secretary Approves
    ↓
PENDING_REGISTRAR
    ↓
Registrar Approves
    ↓
PENDING_VC
    ↓
VC Approves
    ↓
APPROVED ✓
```

### The Rejection Loop

```
ANY APPROVER REJECTS
    ↓
RETURNED_FOR_REVISION
    ↓
President Edits Proposal
    ↓
President Resubmits
    ↓
[Check: Does society have coordinator?]
    ├─ YES → PENDING_COORDINATOR
    └─ NO → PENDING_DIRECTOR_SSC
    ↓
Workflow Restarts
```

---

## 🗄️ Database Architecture

### Critical Design Decisions

1. **Nullable Coordinator ID**
   - `coordinator_id` can be NULL
   - Enables conditional workflow logic
   - Tested with 2 societies without coordinators

2. **Status Enum**
   - 8 distinct statuses
   - Prevents invalid state transitions
   - Enables efficient filtering

3. **Approval History**
   - Immutable audit trail
   - Tracks all actions (APPROVED, REJECTED, RESUBMITTED)
   - Includes timestamps and comments

4. **Assignment Tracking**
   - `assigned_asst_director_id` links proposal to specific AD
   - Only assigned AD can approve
   - Prevents unauthorized approvals

---

## 🚀 Quick Start

### Prerequisites
- Node.js 14+
- MySQL 5.7+
- npm or yarn

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd campus-connect/backend

# 2. Install dependencies
npm install

# 3. Create database
mysql -u root -p < schema.sql

# 4. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 5. Seed database
npm run seed

# 6. Start server
npm run dev
```

### Verify Installation

```bash
# Check server is running
curl http://localhost:5000/health

# Expected response:
# {"status":"OK"}
```

---

## 📊 Seed Data

### Users (7 Admin + 14 Presidents + 12 Coordinators)

**Admin Users:**
- Director SSC (director@campus.edu)
- Tariq Ejaz - Assistant Director (tariq@campus.edu)
- Bilal Ashraf - Assistant Director (bilal@campus.edu)
- Mian Khurrum Arshad - Assistant Director (khurrum@campus.edu)
- Finance Secretary (finance@campus.edu)
- Registrar (registrar@campus.edu)
- Vice Chancellor (vc@campus.edu)

**Society Presidents:** 14 unique presidents

**Coordinators:** 12 coordinators (2 societies have NULL coordinator)

### Societies (14 Total)

| Society | President | Coordinator | Notes |
|---------|-----------|-------------|-------|
| Debating Society | Ahmed Khan | Coordinator 1 | ✓ Has coordinator |
| Photography Club | Fatima Ali | Coordinator 2 | ✓ Has coordinator |
| Sports Club | Hassan Malik | NULL | ⚠️ NO coordinator |
| Music Society | Zainab Hussain | Coordinator 3 | ✓ Has coordinator |
| Drama Club | Ali Raza | Coordinator 4 | ✓ Has coordinator |
| Tech Society | Sara Ahmed | Coordinator 5 | ✓ Has coordinator |
| Environmental Club | Muhammad Usman | NULL | ⚠️ NO coordinator |
| Entrepreneurship Society | Hira Khan | Coordinator 6 | ✓ Has coordinator |
| Literary Society | Imran Malik | Coordinator 7 | ✓ Has coordinator |
| Art & Design Club | Nida Farooq | Coordinator 8 | ✓ Has coordinator |
| Science Club | Karim Hassan | Coordinator 9 | ✓ Has coordinator |
| Cultural Society | Amina Siddiqui | Coordinator 10 | ✓ Has coordinator |
| Community Service Club | Rashid Ahmed | Coordinator 11 | ✓ Has coordinator |
| Leadership Forum | Layla Khan | Coordinator 12 | ✓ Has coordinator |

### Sample Proposals (3 Total)

1. **Debate Championship** (Debating Society) - 5000 budget
2. **Football Tournament** (Sports Club) - 8000 budget
3. **Hackathon 2026** (Tech Society) - 12000 budget

---

## 🔐 Authorization Matrix

| Endpoint | Method | Required Role | Conditions |
|----------|--------|---------------|-----------|
| /proposals | POST | PRESIDENT | Must be society president |
| /proposals/:id | GET | Any | Authenticated user |
| /proposals/next-status | POST | Various | Depends on current status |
| /proposals/:id/attachments | POST | PRESIDENT | Must be society president |

### Status-Based Authorization

| Current Status | Can Approve | Can Reject | Required Role |
|---|---|---|---|
| PENDING_COORDINATOR | ✓ | ✓ | COORDINATOR |
| PENDING_DIRECTOR_SSC | ✓ | ✓ | DIRECTOR_SSC |
| PENDING_ASST_DIRECTOR | ✓ | ✓ | ASST_DIRECTOR (assigned) |
| PENDING_FINANCE_SECRETARY | ✓ | ✓ | FINANCE_SECRETARY |
| PENDING_REGISTRAR | ✓ | ✓ | REGISTRAR |
| PENDING_VC | ✓ | ✓ | VC |
| RETURNED_FOR_REVISION | - | - | PRESIDENT (resubmit only) |

---

## 📝 API Examples

### Create Proposal (Society WITH Coordinator)

```bash
curl -X POST http://localhost:5000/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "societyId": 1,
    "title": "Debate Championship",
    "description": "Annual debate competition",
    "eventDate": "2026-03-15",
    "budgetRequested": 5000
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "proposalId": 1,
  "initialStatus": "PENDING_COORDINATOR"
}
```

### Create Proposal (Society WITHOUT Coordinator)

```bash
curl -X POST http://localhost:5000/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "societyId": 3,
    "title": "Football Tournament",
    "description": "Campus-wide tournament",
    "eventDate": "2026-04-20",
    "budgetRequested": 8000
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "proposalId": 2,
  "initialStatus": "PENDING_DIRECTOR_SSC"
}
```

Note: Status is `PENDING_DIRECTOR_SSC` (skips coordinator) because Sports Club has no coordinator.

### Approve Proposal

```bash
curl -X POST http://localhost:5000/proposals/next-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "proposalId": 1,
    "action": "APPROVE",
    "assignedAsstDirectorId": 2
  }'
```

### Reject Proposal

```bash
curl -X POST http://localhost:5000/proposals/next-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "proposalId": 1,
    "action": "REJECT",
    "rejectionReason": "Budget exceeds allocated funds. Please revise."
  }'
```

### Resubmit Proposal

```bash
curl -X POST http://localhost:5000/proposals/next-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -d '{
    "proposalId": 1,
    "action": "RESUBMIT"
  }'
```

---

## 🧪 Testing

### Run Seed Script
```bash
npm run seed
```

### Test Scenarios Included

1. ✅ Happy Path - Society WITH Coordinator (7 steps)
2. ✅ Happy Path - Society WITHOUT Coordinator (6 steps)
3. ✅ Rejection at Finance Secretary Level
4. ✅ Rejection at Director SSC Level (No Coordinator)
5. ✅ Multiple Rejections & Resubmissions
6. ✅ Authorization Failures
7. ✅ File Attachments
8. ✅ Edge Cases

See `TEST_SCENARIOS.md` for detailed examples.

---

## 📚 Documentation

- **WORKFLOW_API_DOCUMENTATION.md** - Complete API reference with all endpoints
- **SETUP_GUIDE.md** - Installation, configuration, and integration guide
- **TEST_SCENARIOS.md** - 8 detailed test scenarios with curl examples
- **schema.sql** - Database schema with comments
- **seed.js** - Database seeding script

---

## 🔧 Configuration

### Environment Variables

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=campus_connect

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRY=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🎯 Key Implementation Details

### 1. Conditional Status Logic
```javascript
// Pseudo-code
if (action === 'REJECT') {
  nextStatus = 'RETURNED_FOR_REVISION';
} else if (action === 'RESUBMIT') {
  nextStatus = hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';
} else {
  // Use switch/case for approval chain
  nextStatus = getNextStatus(currentStatus);
}
```

### 2. Authorization Check
```javascript
// Validate user role matches current status
const roleStatusMap = {
  'PENDING_COORDINATOR': 'COORDINATOR',
  'PENDING_DIRECTOR_SSC': 'DIRECTOR_SSC',
  // ... etc
};

if (userRole !== roleStatusMap[currentStatus]) {
  throw new Error('Insufficient permissions');
}
```

### 3. Coordinator Check
```javascript
// At proposal creation and resubmission
const hasCoordinator = society.coordinator_id !== null;
const initialStatus = hasCoordinator 
  ? 'PENDING_COORDINATOR' 
  : 'PENDING_DIRECTOR_SSC';
```

---

## 📈 Performance Optimizations

- **Connection Pooling:** 10 concurrent connections
- **Indexes:** 6 strategic indexes on foreign keys and status
- **Query Optimization:** Single query for proposal + society details
- **Audit Trail:** Efficient logging without blocking main workflow

---

## 🚀 Next Steps for Full Implementation

1. **Frontend Components**
   - President Portal (Create Proposal, View Status)
   - SSC Admin Panel (Edit Society Hierarchy)
   - Approver Dashboard (View Pending Proposals)

2. **Authentication**
   - JWT login endpoint
   - Password reset flow
   - Session management

3. **File Upload**
   - Cloud storage integration (AWS S3, Google Cloud)
   - File validation and scanning
   - Download endpoint

4. **Notifications**
   - Email notifications for approvers
   - SMS alerts for urgent proposals
   - In-app notifications

5. **Analytics**
   - Proposal statistics dashboard
   - Approval time tracking
   - Budget analytics

6. **Testing**
   - Unit tests for workflow logic
   - Integration tests for API endpoints
   - E2E tests for complete workflows

7. **Deployment**
   - Docker containerization
   - CI/CD pipeline
   - Production database setup

---

## 📞 Support

For issues or questions:
1. Check `WORKFLOW_API_DOCUMENTATION.md` for API details
2. Review `TEST_SCENARIOS.md` for workflow examples
3. Consult `SETUP_GUIDE.md` for configuration help

---

## 📄 License

[Your License Here]

---

## 👥 Team

Campus Connect MVP - Backend Development Team

---

**Version:** 0.1.0 (MVP)  
**Last Updated:** January 2026  
**Status:** Ready for Integration Testing
