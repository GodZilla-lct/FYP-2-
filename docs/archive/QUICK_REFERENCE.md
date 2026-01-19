# Campus Connect - Quick Reference Card

## 🚀 Quick Start (5 Minutes)

```bash
# 1. Install dependencies
npm install

# 2. Create database
mysql -u root -p < schema.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Seed database
npm run seed

# 5. Start server
npm run dev
```

---

## 📊 Database Overview

### Users (7 Roles)
```
PRESIDENT          → Create proposals, upload files, resubmit
COORDINATOR        → Approve/reject at step 1
DIRECTOR_SSC       → Approve/reject at step 2, assign to AD
ASST_DIRECTOR (3)  → Approve/reject at step 3
FINANCE_SECRETARY  → Approve/reject at step 4
REGISTRAR          → Approve/reject at step 5
VC                 → Approve/reject at step 6 (final)
```

### Societies (14 Total)
```
12 with Coordinators:
  Debating, Photography, Music, Drama, Tech, Entrepreneurship,
  Literary, Art & Design, Science, Cultural, Community Service, Leadership

2 WITHOUT Coordinators:
  Sports Club, Environmental Club
```

### Proposal Statuses (8 Total)
```
PENDING_COORDINATOR      → Waiting for coordinator approval
PENDING_DIRECTOR_SSC     → Waiting for director approval
PENDING_ASST_DIRECTOR    → Waiting for AD approval
PENDING_FINANCE_SECRETARY → Waiting for finance approval
PENDING_REGISTRAR        → Waiting for registrar approval
PENDING_VC               → Waiting for VC approval
APPROVED                 → Final approved status
RETURNED_FOR_REVISION    → Rejected, needs revision
```

---

## 🔄 Workflow Logic

### Create Proposal
```
IF society.coordinator_id IS NOT NULL
  → Status = PENDING_COORDINATOR
ELSE
  → Status = PENDING_DIRECTOR_SSC (SKIP coordinator)
```

### Approval Chain
```
PENDING_COORDINATOR
  ↓ (Coordinator approves)
PENDING_DIRECTOR_SSC
  ↓ (Director approves & assigns AD)
PENDING_ASST_DIRECTOR
  ↓ (AD approves)
PENDING_FINANCE_SECRETARY
  ↓ (Finance approves)
PENDING_REGISTRAR
  ↓ (Registrar approves)
PENDING_VC
  ↓ (VC approves)
APPROVED ✓
```

### Rejection Loop
```
ANY APPROVER REJECTS
  ↓
RETURNED_FOR_REVISION
  ↓
President edits & resubmits
  ↓
IF society.coordinator_id IS NOT NULL
  → Status = PENDING_COORDINATOR
ELSE
  → Status = PENDING_DIRECTOR_SSC
  ↓
Workflow restarts
```

---

## 🔌 API Endpoints

### 1. Create Proposal
```bash
POST /proposals
Authorization: Bearer JWT_TOKEN

{
  "societyId": 1,
  "title": "Event Title",
  "description": "Event description",
  "eventDate": "2026-03-15",
  "budgetRequested": 5000
}

Response: 201 Created
{
  "success": true,
  "proposalId": 1,
  "initialStatus": "PENDING_COORDINATOR"
}
```

### 2. Get Proposal Details
```bash
GET /proposals/:id
Authorization: Bearer JWT_TOKEN

Response: 200 OK
{
  "proposal": { ... },
  "attachments": [ ... ],
  "approvalHistory": [ ... ]
}
```

### 3. Approve Proposal
```bash
POST /proposals/next-status
Authorization: Bearer JWT_TOKEN

{
  "proposalId": 1,
  "action": "APPROVE",
  "assignedAsstDirectorId": 2  // Only for DIRECTOR_SSC
}

Response: 200 OK
{
  "success": true,
  "nextStatus": "PENDING_DIRECTOR_SSC"
}
```

### 4. Reject Proposal
```bash
POST /proposals/next-status
Authorization: Bearer JWT_TOKEN

{
  "proposalId": 1,
  "action": "REJECT",
  "rejectionReason": "Budget exceeds allocation"
}

Response: 200 OK
{
  "success": true,
  "nextStatus": "RETURNED_FOR_REVISION"
}
```

### 5. Resubmit Proposal
```bash
POST /proposals/next-status
Authorization: Bearer JWT_TOKEN

{
  "proposalId": 1,
  "action": "RESUBMIT"
}

Response: 200 OK
{
  "success": true,
  "nextStatus": "PENDING_COORDINATOR"  // or PENDING_DIRECTOR_SSC
}
```

### 6. Upload Attachment
```bash
POST /proposals/:id/attachments
Authorization: Bearer JWT_TOKEN

{
  "fileUrl": "https://storage.example.com/file.pdf",
  "fileName": "budget.pdf"
}

Response: 201 Created
{
  "success": true,
  "attachmentId": 1
}
```

---

## 🔐 Authorization Matrix

| Endpoint | Role | Condition |
|----------|------|-----------|
| POST /proposals | PRESIDENT | Must own society |
| POST /proposals/next-status | COORDINATOR | At PENDING_COORDINATOR |
| POST /proposals/next-status | DIRECTOR_SSC | At PENDING_DIRECTOR_SSC |
| POST /proposals/next-status | ASST_DIRECTOR | At PENDING_ASST_DIRECTOR + assigned |
| POST /proposals/next-status | FINANCE_SECRETARY | At PENDING_FINANCE_SECRETARY |
| POST /proposals/next-status | REGISTRAR | At PENDING_REGISTRAR |
| POST /proposals/next-status | VC | At PENDING_VC |
| POST /proposals/next-status | PRESIDENT | At RETURNED_FOR_REVISION (resubmit) |
| POST /proposals/:id/attachments | PRESIDENT | Must own society |

---

## 🧪 Test Scenarios

### Scenario 1: Society WITH Coordinator
```
1. President creates proposal
   → Status: PENDING_COORDINATOR

2. Coordinator approves
   → Status: PENDING_DIRECTOR_SSC

3. Director SSC approves & assigns AD
   → Status: PENDING_ASST_DIRECTOR

4. AD approves
   → Status: PENDING_FINANCE_SECRETARY

5. Finance approves
   → Status: PENDING_REGISTRAR

6. Registrar approves
   → Status: PENDING_VC

7. VC approves
   → Status: APPROVED ✓
```

### Scenario 2: Society WITHOUT Coordinator
```
1. President creates proposal
   → Status: PENDING_DIRECTOR_SSC (SKIPS coordinator)

2. Director SSC approves & assigns AD
   → Status: PENDING_ASST_DIRECTOR

3-7. Continue as Scenario 1
```

### Scenario 3: Rejection & Resubmission
```
1. Proposal at PENDING_FINANCE_SECRETARY

2. Finance Secretary rejects
   → Status: RETURNED_FOR_REVISION
   → rejection_reason stored

3. President edits proposal

4. President resubmits
   → Status: PENDING_COORDINATOR (if has coordinator)
   → Status: PENDING_DIRECTOR_SSC (if no coordinator)

5. Workflow restarts
```

---

## 📝 Seed Data

### Admin Users
```
director@campus.edu          → DIRECTOR_SSC
tariq@campus.edu             → ASST_DIRECTOR
bilal@campus.edu             → ASST_DIRECTOR
khurrum@campus.edu           → ASST_DIRECTOR
finance@campus.edu           → FINANCE_SECRETARY
registrar@campus.edu         → REGISTRAR
vc@campus.edu                → VC
```

### Test Societies
```
Debating Society             → Has coordinator
Sports Club                  → NO coordinator ⚠️
Tech Society                 → Has coordinator
Environmental Club           → NO coordinator ⚠️
... (10 more with coordinators)
```

### Test Proposals
```
1. Debate Championship (Debating Society) - 5000
2. Football Tournament (Sports Club) - 8000
3. Hackathon 2026 (Tech Society) - 12000
```

---

## 🛠️ Common Commands

```bash
# Start development server
npm run dev

# Seed database
npm run seed

# Run tests
npm test

# View database
mysql -u root -p campus_connect

# Check server health
curl http://localhost:5000/health
```

---

## 📊 Database Queries

### Get all pending proposals
```sql
SELECT * FROM proposals WHERE current_status = 'PENDING_DIRECTOR_SSC';
```

### Get approval history
```sql
SELECT ah.*, u.name, u.role FROM approval_history ah
JOIN users u ON ah.approver_id = u.id
WHERE ah.proposal_id = 1
ORDER BY ah.created_at DESC;
```

### Get societies without coordinators
```sql
SELECT * FROM societies WHERE coordinator_id IS NULL;
```

### Get proposals assigned to specific AD
```sql
SELECT * FROM proposals WHERE assigned_asst_director_id = 2;
```

---

## ⚠️ Common Errors

### 401 Unauthorized
```
Error: "No token provided"
Solution: Add Authorization header with JWT token
```

### 403 Forbidden
```
Error: "Only COORDINATOR can approve at this stage"
Solution: Check user role matches current proposal status
```

### 404 Not Found
```
Error: "Proposal not found"
Solution: Verify proposalId exists in database
```

### 400 Bad Request
```
Error: "rejectionReason is required for rejection"
Solution: Include rejectionReason when action is REJECT
```

---

## 🔑 Key Concepts

### Conditional Workflow
- Checks `coordinator_id` at proposal creation
- If NULL → skips coordinator step
- If NOT NULL → includes coordinator step

### Approval Chain
- 7 steps total (or 6 if no coordinator)
- Each step requires specific role
- Only assigned AD can approve at step 3

### Rejection Loop
- Any approver can reject
- Proposal returns to RETURNED_FOR_REVISION
- President edits and resubmits
- Workflow restarts from beginning

### Audit Trail
- All actions logged in approval_history
- Includes approver, action, timestamp
- Rejection reasons stored
- Immutable history

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| README.md | Project overview |
| WORKFLOW_API_DOCUMENTATION.md | Complete API reference |
| SETUP_GUIDE.md | Installation & configuration |
| TEST_SCENARIOS.md | Detailed test examples |
| ARCHITECTURE.md | System design |
| DELIVERABLES.md | Complete inventory |
| QUICK_REFERENCE.md | This file |

---

## 🚀 Next Steps

1. **Set up backend**
   - Install dependencies
   - Create database
   - Seed data
   - Start server

2. **Test API**
   - Create proposal
   - Approve/reject
   - Resubmit
   - Upload files

3. **Build frontend**
   - President Portal
   - SSC Admin Panel
   - Approver Dashboard

4. **Deploy**
   - Configure production database
   - Set up environment variables
   - Deploy backend & frontend

---

## 💡 Tips & Tricks

### Testing with Curl
```bash
# Set token variable
TOKEN="your_jwt_token"

# Create proposal
curl -X POST http://localhost:5000/proposals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"societyId": 1, "title": "Test", ...}'
```

### Database Debugging
```bash
# Connect to database
mysql -u root -p campus_connect

# View all proposals
SELECT * FROM proposals;

# View approval history
SELECT * FROM approval_history;

# View societies without coordinators
SELECT * FROM societies WHERE coordinator_id IS NULL;
```

### Common Workflow
```
1. Create proposal (PENDING_COORDINATOR or PENDING_DIRECTOR_SSC)
2. Coordinator approves (if exists)
3. Director SSC approves & assigns AD
4. AD approves
5. Finance approves
6. Registrar approves
7. VC approves
8. APPROVED ✓
```

---

## 📞 Support

- Check documentation files for detailed information
- Review TEST_SCENARIOS.md for examples
- See SETUP_GUIDE.md for configuration help
- Refer to WORKFLOW_API_DOCUMENTATION.md for API details

---

**Version:** 0.1.0 (MVP)  
**Last Updated:** January 2026  
**Status:** Ready for Integration Testing
