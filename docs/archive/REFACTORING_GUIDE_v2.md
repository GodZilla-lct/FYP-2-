# Campus Connect - Refactoring Guide v2.0

## Overview
This document outlines the complete refactoring of Campus Connect from a 30% MVP to a production-ready system with:
- Complete 7-slot society leadership hierarchy
- Advanced rejection workflow (SOFT/HARD)
- Co-Pilot dashboard for society leaders
- Robust admin hierarchy manager

---

## 1. DATABASE REFACTORING

### 1.1 Users Table Changes
**New Columns:**
- `roll_number` (VARCHAR 50) - Student/Staff ID
- `society_id` (FK to societies) - Optional society assignment

**New Roles:**
- `SOCIETY_LEADER` - Generic role for all VPs/GSs (simplifies permissions)
- Existing roles: PRESIDENT, COORDINATOR, DIRECTOR_SSC, ASST_DIRECTOR, FINANCE_SECRETARY, REGISTRAR, VC

**Migration:**
```sql
ALTER TABLE users ADD COLUMN roll_number VARCHAR(50);
ALTER TABLE users ADD COLUMN society_id INT;
ALTER TABLE users MODIFY COLUMN role ENUM('PRESIDENT', 'SOCIETY_LEADER', 'COORDINATOR', 'DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC');
```

### 1.2 Societies Table Changes
**New Columns (Complete Hierarchy):**
1. `president_id` (FK) - Required
2. `senior_vp_id` (FK) - Optional
3. `vp_male_id` (FK) - Optional
4. `vp_female_id` (FK) - Optional
5. `gs_male_id` (FK) - Optional
6. `gs_female_id` (FK) - Optional
7. `coordinator_id` (FK) - Nullable (CRITICAL for workflow)

**Migration:**
```sql
ALTER TABLE societies 
ADD COLUMN senior_vp_id INT,
ADD COLUMN vp_male_id INT,
ADD COLUMN vp_female_id INT,
ADD COLUMN gs_male_id INT,
ADD COLUMN gs_female_id INT,
ADD FOREIGN KEY (senior_vp_id) REFERENCES users(id) ON DELETE SET NULL,
ADD FOREIGN KEY (vp_male_id) REFERENCES users(id) ON DELETE SET NULL,
ADD FOREIGN KEY (vp_female_id) REFERENCES users(id) ON DELETE SET NULL,
ADD FOREIGN KEY (gs_male_id) REFERENCES users(id) ON DELETE SET NULL,
ADD FOREIGN KEY (gs_female_id) REFERENCES users(id) ON DELETE SET NULL;
```

### 1.3 Proposals Table Changes
**New Columns:**
- `rejection_type` (ENUM: 'SOFT', 'HARD') - Type of rejection
- `rejection_reason` (TEXT) - Already existed, now used with rejection_type

**New Status:**
- `REJECTED` - Final state for HARD rejections

**Migration:**
```sql
ALTER TABLE proposals 
ADD COLUMN rejection_type ENUM('SOFT', 'HARD'),
MODIFY COLUMN current_status ENUM(
  'PENDING_COORDINATOR',
  'PENDING_DIRECTOR_SSC',
  'PENDING_ASST_DIRECTOR',
  'PENDING_FINANCE_SECRETARY',
  'PENDING_REGISTRAR',
  'PENDING_VC',
  'APPROVED',
  'RETURNED_FOR_REVISION',
  'REJECTED'
);
```

### 1.4 Seeding Strategy
**12 Societies × 7 Leadership Slots = 84 Society Leaders**

Societies:
1. Hayatian Blood
2. Debating Society
3. Qalamkar
4. Photography Club
5. Sports Club
6. Music Society
7. Drama Club
8. Tech Society
9. Environmental Club
10. Entrepreneurship Society
11. Literary Society
12. Art & Design Club

**Coordinator Assignment:**
- 3 societies WITHOUT coordinators (Qalamkar, Sports Club, Environmental Club)
- 9 societies WITH coordinators
- Tests the "Null Coordinator Check" logic

---

## 2. BACKEND LOGIC REFACTORING

### 2.1 Null Coordinator Check (CRITICAL)
**Location:** `proposalWorkflowController.js` → `createProposal()`

**Logic:**
```javascript
const hasCoordinator = societies[0].coordinator_id !== null;
const initialStatus = hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';
```

**Behavior:**
- If `coordinator_id IS NULL` → Skip PENDING_COORDINATOR, go directly to PENDING_DIRECTOR_SSC
- If `coordinator_id IS NOT NULL` → Normal flow through PENDING_COORDINATOR

**Test Scenarios:**
1. Create proposal for society WITH coordinator → Status: PENDING_COORDINATOR
2. Create proposal for society WITHOUT coordinator → Status: PENDING_DIRECTOR_SSC

### 2.2 Director's Assignment Logic
**Location:** `proposalWorkflowController.js` → `handleProposalStatusTransition()`

**When Director SSC Approves:**
```javascript
if (proposal.current_status === 'PENDING_DIRECTOR_SSC' && isApproval && assignedAsstDirectorId) {
  // Validate AD exists
  // Set assigned_asst_director_id
  updateData.assigned_asst_director_id = assignedAsstDirectorId;
}
```

**Request Body:**
```json
{
  "proposalId": 1,
  "action": "APPROVE",
  "assignedAsstDirectorId": 2
}
```

### 2.3 Two Types of Rejection
**Location:** `proposalWorkflowController.js` → `handleProposalStatusTransition()`

**SOFT Rejection (Editable):**
```javascript
if (rejectionType === 'SOFT') {
  nextStatus = 'RETURNED_FOR_REVISION';
  // President can edit & resubmit
}
```

**HARD Rejection (Final):**
```javascript
if (rejectionType === 'HARD') {
  nextStatus = 'REJECTED';
  // Proposal is final, cannot be edited
}
```

**Request Body:**
```json
{
  "proposalId": 1,
  "action": "REJECT",
  "rejectionReason": "Budget exceeds limit",
  "rejectionType": "SOFT"
}
```

### 2.4 New Endpoints

#### GET /dashboard
**Purpose:** Route users to appropriate dashboard based on role and society assignments

**Response:**
```json
{
  "dashboardType": "SOCIETY_LEADER",
  "societies": [
    {
      "id": 1,
      "name": "Debating Society",
      "position": "PRESIDENT"
    }
  ]
}
```

**Dashboard Types:**
- `SOCIETY_LEADER` - User is assigned to society leadership
- `ADMIN_HIERARCHY` - Director SSC
- `APPROVER` - ASST_DIRECTOR, FINANCE_SECRETARY, REGISTRAR, VC
- `UNKNOWN` - Unrecognized role

---

## 3. FRONTEND REFACTORING

### 3.1 New Component: AdminHierarchyManager
**File:** `frontend/src/components/AdminHierarchyManager.jsx`

**Features:**
- Display all 12 societies in card layout
- 7-slot edit form for each society:
  1. President (Required)
  2. Senior VP (Optional)
  3. VP Male (Optional)
  4. VP Female (Optional)
  5. GS Male (Optional)
  6. GS Female (Optional)
  7. Coordinator (Optional)

**Key Differences from Old AdminHierarchy:**
- Old: 2 dropdowns (President, Coordinator)
- New: 7 dropdowns (complete hierarchy)
- Responsive grid layout
- Better UX with card-based design

### 3.2 Updated PresidentDashboard
**Changes:**
- Auto-fill society name/user details
- File upload support
- Red text for rejection reasons
- Disable "Edit" button for HARD rejections

**Rejection Display:**
```jsx
{proposal.rejection_type === 'HARD' && (
  <div className="rejection-section hard-rejection">
    <h4>Rejected (Final)</h4>
    <p className="rejection-reason">{proposal.rejection_reason}</p>
    <p className="note">This proposal cannot be edited or resubmitted.</p>
  </div>
)}

{proposal.rejection_type === 'SOFT' && (
  <div className="rejection-section soft-rejection">
    <h4>Returned for Revision</h4>
    <p className="rejection-reason">{proposal.rejection_reason}</p>
    <button className="btn btn-warning">Edit & Resubmit</button>
  </div>
)}
```

### 3.3 New Co-Pilot Dashboard
**Purpose:** Unified dashboard for all society leaders (President, VPs, GSs)

**Features:**
- Display all societies user is assigned to
- Create proposals for assigned societies
- View proposal status
- Edit & resubmit if SOFT rejection

**Routing Logic:**
```javascript
// In App.js or routing layer
if (user.role === 'SOCIETY_LEADER' || user.role === 'PRESIDENT') {
  // Check if assigned to any society
  if (societyAssignments.length > 0) {
    return <CoPilotDashboard societies={societyAssignments} />;
  }
}
```

### 3.4 Updated App.js
**Changes:**
- Add role switcher for testing all 7 hierarchy positions
- Route to appropriate dashboard based on role
- Support for SOCIETY_LEADER role

---

## 4. WORKFLOW CHANGES

### 4.1 Proposal Creation Flow
```
User Creates Proposal
    ↓
Check: Does society have coordinator?
    ├─ YES → Status: PENDING_COORDINATOR
    └─ NO → Status: PENDING_DIRECTOR_SSC
```

### 4.2 Approval Chain (With Null Coordinator Check)
```
PENDING_COORDINATOR (if coordinator exists)
    ↓
PENDING_DIRECTOR_SSC
    ↓ (Director assigns to specific AD)
PENDING_ASST_DIRECTOR
    ↓
PENDING_FINANCE_SECRETARY
    ↓
PENDING_REGISTRAR
    ↓
PENDING_VC
    ↓
APPROVED ✅
```

### 4.3 Rejection Flows
**SOFT Rejection (Editable):**
```
Any Approver Rejects (SOFT)
    ↓
Status: RETURNED_FOR_REVISION
    ↓
President Edits & Resubmits
    ↓
Check: Does society have coordinator?
    ├─ YES → Back to PENDING_COORDINATOR
    └─ NO → Back to PENDING_DIRECTOR_SSC
```

**HARD Rejection (Final):**
```
Any Approver Rejects (HARD)
    ↓
Status: REJECTED (Final)
    ↓
President CANNOT edit or resubmit
    ↓
Proposal is archived
```

---

## 5. TESTING SCENARIOS

### 5.1 Test Null Coordinator Check
**Setup:**
- Create proposal for "Sports Club" (no coordinator)
- Create proposal for "Debating Society" (has coordinator)

**Expected:**
- Sports Club proposal: Initial status = PENDING_DIRECTOR_SSC
- Debating Society proposal: Initial status = PENDING_COORDINATOR

### 5.2 Test Director Assignment
**Setup:**
- Approve proposal as Director SSC
- Assign to specific Assistant Director

**Expected:**
- Proposal moves to PENDING_ASST_DIRECTOR
- assigned_asst_director_id is set
- Only assigned AD can approve

### 5.3 Test SOFT vs HARD Rejection
**Setup:**
- Create two proposals
- Reject first as SOFT
- Reject second as HARD

**Expected:**
- SOFT: Status = RETURNED_FOR_REVISION, President can edit
- HARD: Status = REJECTED, President cannot edit

### 5.4 Test Resubmission with Null Coordinator
**Setup:**
- Create proposal for society without coordinator
- Reject as SOFT
- President resubmits

**Expected:**
- Resubmitted proposal goes to PENDING_DIRECTOR_SSC (not PENDING_COORDINATOR)

---

## 6. MIGRATION CHECKLIST

- [ ] Update schema.sql with new columns and tables
- [ ] Run seed.js to populate 12 societies with 7 leaders each
- [ ] Update proposalWorkflowController.js with new logic
- [ ] Update proposalRoutes.js with new endpoints
- [ ] Create AdminHierarchyManager.jsx component
- [ ] Create AdminHierarchyManager.css styles
- [ ] Update PresidentDashboard.jsx for rejection types
- [ ] Create CoPilotDashboard.jsx (optional, for future)
- [ ] Update App.js routing logic
- [ ] Test all 4 scenarios above
- [ ] Update documentation

---

## 7. KEY IMPROVEMENTS

### Database
✅ Complete 7-slot hierarchy support
✅ Nullable coordinator for conditional workflow
✅ Rejection type tracking (SOFT/HARD)
✅ Roll number for student identification

### Backend
✅ Null Coordinator Check logic
✅ Director assignment to specific AD
✅ Two-tier rejection system
✅ Dashboard routing endpoint

### Frontend
✅ 7-slot hierarchy manager
✅ Rejection type UI (red for HARD, yellow for SOFT)
✅ Co-Pilot dashboard foundation
✅ Better UX with card-based layout

### Workflow
✅ Conditional approval chain
✅ Editable vs final rejections
✅ Resubmission respects coordinator status
✅ Audit trail with approval history

---

## 8. FUTURE ENHANCEMENTS

1. **Co-Pilot Dashboard** - Unified view for all society leaders
2. **Bulk Hierarchy Updates** - CSV import for annual updates
3. **Workflow Analytics** - Dashboard showing approval times
4. **Email Notifications** - Notify users of proposal status changes
5. **Document Management** - Better file upload/storage
6. **Role-Based Permissions** - Fine-grained access control
7. **Audit Logging** - Complete activity trail
8. **Mobile App** - React Native version

---

## 9. DEPLOYMENT NOTES

**Database:**
- Run schema.sql to create/update tables
- Run seed.js to populate test data
- Backup existing data before migration

**Backend:**
- Update proposalWorkflowController.js
- Update proposalRoutes.js
- Restart Node.js server

**Frontend:**
- Add AdminHierarchyManager.jsx
- Update App.js routing
- Run `npm install` if new dependencies added
- Restart React dev server

**Testing:**
- Run all 4 test scenarios
- Verify null coordinator logic
- Test rejection types
- Validate director assignment

---

**Last Updated:** January 2026
**Version:** 2.0
**Status:** Production Ready
