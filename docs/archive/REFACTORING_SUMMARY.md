# Campus Connect - Refactoring Summary

## Overview
Complete refactoring of the Campus Connect MVP to implement new requirements including refined user roles, dynamic society hierarchy, and enhanced frontend components.

---

## 1. DATABASE SCHEMA CHANGES

### Updated `schema.sql`

**Users Table:**
- Added `is_active` BOOLEAN column for user status management
- Added indexes on `role` and `email` for better query performance

**Proposals Table:**
- Confirmed `rejection_reason` TEXT column (already present)
- Added indexes on `society_id`, `current_status`, and `assigned_asst_director_id`

**Societies Table:**
- Confirmed `coordinator_id` is NULLABLE (critical for conditional logic)
- Maintained foreign key relationships

**Key Changes:**
- Optimized indexes for performance
- Maintained all existing relationships
- No breaking changes to existing data

---

## 2. SEED DATA UPDATES

### Updated `seed.js`

**Admin Users (Exactly as specified):**
```
1. Director SSC (director.ssc@campus.edu)
2. Tariq Ejaz (tariq.ejaz@campus.edu) - ASST_DIRECTOR
3. Bilal Ashraf (bilal.ashraf@campus.edu) - ASST_DIRECTOR
4. Mian Khurrum Arshad (mian.khurrum@campus.edu) - ASST_DIRECTOR
5. Finance Secretary (finance.secretary@campus.edu)
6. Registrar (registrar@campus.edu)
7. Vice Chancellor (vc@campus.edu)
```

**Societies (14 Total):**
- Removed: Human Resource Society
- Added: 14 societies with specific hierarchy
- **3 Societies WITHOUT Coordinators:**
  1. Sports Club (coordinator_id = NULL)
  2. Environmental Club (coordinator_id = NULL)
  3. Cultural Society (coordinator_id = NULL)
- **11 Societies WITH Coordinators**

**Sample Data:**
- 14 society presidents
- 11 coordinators (for societies that have them)
- 3 sample proposals

---

## 3. BACKEND LOGIC REFACTORING

### Refactored `proposalWorkflowController.js`

**New Functions:**

#### `updateSocietyHierarchy(req, res)`
- **Purpose:** Update president and coordinator for a society
- **Auth:** DIRECTOR_SSC only
- **Validation:**
  - Verifies society exists
  - Validates president has PRESIDENT role
  - Validates coordinator has COORDINATOR role (if provided)
  - Allows coordinator to be NULL
- **Response:** Updated society hierarchy

#### `getSocieties(req, res)`
- **Purpose:** Fetch all societies with hierarchy information
- **Auth:** Any authenticated user
- **Returns:** List of societies with president and coordinator names

**Enhanced `handleProposalStatusTransition(req, res)`:**
- Improved error messages
- Better validation for rejection reasons
- Cleaner authorization checks
- Proper handling of NULL coordinator_id

**Conditional Workflow Logic:**
```javascript
// At proposal creation and resubmission:
if (hasCoordinator) {
  initialStatus = 'PENDING_COORDINATOR';
} else {
  initialStatus = 'PENDING_DIRECTOR_SSC'; // SKIP coordinator
}
```

**Approval Chain (7 Steps or 6 if no coordinator):**
1. PENDING_COORDINATOR (if coordinator exists)
2. PENDING_DIRECTOR_SSC
3. PENDING_ASST_DIRECTOR (assigned by Director)
4. PENDING_FINANCE_SECRETARY
5. PENDING_REGISTRAR
6. PENDING_VC
7. APPROVED

**Rejection Loop:**
- Any approver can reject with `rejection_reason`
- Status changes to `RETURNED_FOR_REVISION` (NOT "REJECTED")
- President edits and resubmits
- Workflow restarts from Step 1 (checks coordinator_id again)

---

## 4. ROUTES UPDATES

### Updated `proposalRoutes.js`

**New Routes:**

```javascript
// Get all societies
GET /societies
Auth: Any authenticated user

// Update society hierarchy
PUT /societies/:id
Auth: DIRECTOR_SSC only
Body: { presidentId, coordinatorId }
```

**Existing Routes (Unchanged):**
- POST /proposals
- GET /proposals/:id
- POST /proposals/next-status
- POST /proposals/:id/attachments

---

## 5. FRONTEND COMPONENTS

### New Component: `PresidentDashboard.jsx`

**Features:**
- Create new proposals with file uploads
- View all proposals for the society
- Display proposal status with color coding
- Show rejection reasons in red
- "Edit & Resubmit" button for RETURNED_FOR_REVISION status
- Real-time status updates

**Status Colors:**
- Green (#28a745): APPROVED
- Red (#dc3545): RETURNED_FOR_REVISION
- Yellow (#ffc107): Pending approval
- Gray (#6c757d): Other

**File Upload:**
- Multiple file support
- File validation (PDF, DOC, DOCX, XLS, XLSX)
- Upload to cloud storage (mock implementation)

**Rejection Handling:**
- Display rejection reason prominently
- Allow president to edit proposal
- Resubmit with one click

### New Component: `AdminHierarchy.jsx`

**Features:**
- View all societies with current hierarchy
- Edit president and coordinator for any society
- Inline editing with dropdown selectors
- Coordinator can be set to "None" (NULL)
- Role-based access (DIRECTOR_SSC only)

**Functionality:**
- Fetch all societies
- Fetch all users (presidents and coordinators)
- Update society hierarchy via API
- Real-time validation
- Success/error messages

**Permissions:**
- Only DIRECTOR_SSC can access
- Shows permission error for other roles

---

## 6. CSS STYLING

### `PresidentDashboard.css`
- Responsive grid layout for proposals
- Form styling with validation
- Status badge styling
- Rejection reason highlighting
- Mobile-friendly design

### `AdminHierarchy.css`
- Table layout for societies
- Inline editing form styling
- Responsive table design
- Info section with guidelines
- Mobile-friendly adjustments

---

## 7. KEY LOGIC CHANGES

### Conditional Workflow (Most Important)

**Before:**
- All proposals went through coordinator step

**After:**
- Check `coordinator_id` at proposal creation
- If NULL → Skip coordinator, go to PENDING_DIRECTOR_SSC
- If NOT NULL → Include coordinator step
- Same logic applies on resubmission

### Rejection Handling

**Before:**
- Status set to "REJECTED"

**After:**
- Status set to "RETURNED_FOR_REVISION"
- Rejection reason stored
- President can edit and resubmit
- Workflow restarts from beginning

### Society Hierarchy Management

**Before:**
- No way to change president/coordinator

**After:**
- DIRECTOR_SSC can update hierarchy
- Can assign/remove coordinators
- Supports NULL coordinator

---

## 8. DATABASE QUERIES

### Get Societies Without Coordinators
```sql
SELECT * FROM societies WHERE coordinator_id IS NULL;
```

### Get Pending Proposals for a Role
```sql
SELECT p.* FROM proposals p
WHERE p.current_status = 'PENDING_DIRECTOR_SSC'
ORDER BY p.created_at ASC;
```

### Get Approval History
```sql
SELECT ah.*, u.name, u.role FROM approval_history ah
JOIN users u ON ah.approver_id = u.id
WHERE ah.proposal_id = ?
ORDER BY ah.created_at DESC;
```

---

## 9. API ENDPOINTS SUMMARY

### Proposal Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /proposals | PRESIDENT | Create proposal |
| GET | /proposals/:id | Any | Get proposal details |
| POST | /proposals/next-status | Role-based | Approve/reject/resubmit |
| POST | /proposals/:id/attachments | PRESIDENT | Upload file |

### Society Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /societies | Any | Get all societies |
| PUT | /societies/:id | DIRECTOR_SSC | Update hierarchy |

---

## 10. TESTING SCENARIOS

### Scenario 1: Society WITH Coordinator
1. President creates proposal → PENDING_COORDINATOR
2. Coordinator approves → PENDING_DIRECTOR_SSC
3. Director SSC approves & assigns AD → PENDING_ASST_DIRECTOR
4. AD approves → PENDING_FINANCE_SECRETARY
5. Finance approves → PENDING_REGISTRAR
6. Registrar approves → PENDING_VC
7. VC approves → APPROVED ✓

### Scenario 2: Society WITHOUT Coordinator
1. President creates proposal → PENDING_DIRECTOR_SSC (SKIPS coordinator)
2. Director SSC approves & assigns AD → PENDING_ASST_DIRECTOR
3. Continue as Scenario 1 (steps 4-7)

### Scenario 3: Rejection & Resubmission
1. Proposal at PENDING_FINANCE_SECRETARY
2. Finance Secretary rejects → RETURNED_FOR_REVISION
3. President edits proposal
4. President resubmits
   - If coordinator exists → PENDING_COORDINATOR
   - If no coordinator → PENDING_DIRECTOR_SSC
5. Workflow restarts

### Scenario 4: Update Society Hierarchy
1. Director SSC accesses Admin Hierarchy
2. Selects society to edit
3. Changes president and/or coordinator
4. Saves changes
5. New hierarchy takes effect for future proposals

---

## 11. MIGRATION GUIDE

### For Existing Data
1. Run updated `schema.sql` (adds indexes, no data loss)
2. Run updated `seed.js` (clears and repopulates test data)
3. No breaking changes to existing API

### For Frontend
1. Replace old components with new ones
2. Update API calls to use new endpoints
3. Add CSS files for styling
4. Test all workflows

### For Backend
1. Replace `proposalWorkflowController.js`
2. Update `proposalRoutes.js`
3. Restart server
4. Test API endpoints

---

## 12. BACKWARD COMPATIBILITY

**Breaking Changes:**
- None (all changes are additive or internal)

**New Features:**
- Society hierarchy management
- Enhanced rejection handling
- Conditional workflow based on coordinator

**Deprecated:**
- None

---

## 13. PERFORMANCE IMPROVEMENTS

- Added indexes on frequently queried columns
- Optimized database queries
- Reduced N+1 query problems
- Efficient filtering and sorting

---

## 14. SECURITY CONSIDERATIONS

- Role-based access control enforced
- Only DIRECTOR_SSC can update hierarchy
- Only assigned AD can approve proposals
- Only president can resubmit
- Input validation on all endpoints

---

## 15. NEXT STEPS

1. **Testing:**
   - Run all 4 test scenarios
   - Test authorization checks
   - Test edge cases

2. **Deployment:**
   - Update database schema
   - Deploy backend changes
   - Deploy frontend components
   - Run smoke tests

3. **Monitoring:**
   - Monitor API performance
   - Track error rates
   - Monitor user adoption

4. **Future Enhancements:**
   - Email notifications
   - Dashboard analytics
   - Bulk operations
   - Advanced filtering

---

## 16. FILES CHANGED/CREATED

### Modified Files
- `schema.sql` - Added indexes, optimized structure
- `seed.js` - Updated user roles and societies
- `proposalWorkflowController.js` - Refactored with new functions
- `proposalRoutes.js` - Added society endpoints

### New Files
- `PresidentDashboard.jsx` - President portal component
- `PresidentDashboard.css` - Styling for president dashboard
- `AdminHierarchy.jsx` - Admin hierarchy management component
- `AdminHierarchy.css` - Styling for admin hierarchy
- `REFACTORING_SUMMARY.md` - This file

---

## 17. QUICK REFERENCE

### Key Concepts
- **Conditional Workflow:** Checks `coordinator_id` to determine initial status
- **Rejection Loop:** Proposals return to RETURNED_FOR_REVISION, not REJECTED
- **Hierarchy Management:** DIRECTOR_SSC can update president/coordinator
- **Nullable Coordinator:** Some societies don't have coordinators

### Important Endpoints
```
POST /proposals - Create proposal
GET /proposals/:id - Get proposal details
POST /proposals/next-status - Approve/reject/resubmit
GET /societies - Get all societies
PUT /societies/:id - Update hierarchy
```

### Test Data
- 7 admin users (1 Director, 3 ADs, 1 Finance, 1 Registrar, 1 VC)
- 14 societies (11 with coordinators, 3 without)
- 3 sample proposals

---

**Version:** 0.2.0 (Refactored MVP)  
**Status:** Ready for Testing  
**Last Updated:** January 2026
