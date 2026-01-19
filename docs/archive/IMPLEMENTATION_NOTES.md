# Campus Connect v2.0 - Implementation Notes

## Quick Start for Developers

### 1. Database Setup
```bash
# Backup existing database
mysqldump -u root -p campus_connect > backup_$(date +%Y%m%d).sql

# Apply new schema
mysql -u root -p campus_connect < schema.sql

# Seed with new data (12 societies, 84 leaders)
npm run seed
```

### 2. Backend Setup
```bash
# Replace these files:
# - proposalWorkflowController.js (completely refactored)
# - proposalRoutes.js (updated with new endpoints)

# Restart backend
npm start
```

### 3. Frontend Setup
```bash
cd frontend

# Add new component files:
# - src/components/AdminHierarchyManager.jsx
# - src/components/AdminHierarchyManager.css

# Update existing files:
# - src/App.js (add routing logic)

# Restart frontend
npm start
```

---

## Critical Implementation Details

### Null Coordinator Check (Most Important)
**File:** `proposalWorkflowController.js` → `createProposal()`

```javascript
// Line ~180
const hasCoordinator = societies[0].coordinator_id !== null;
const initialStatus = hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';
```

**Why:** This is the core logic that differentiates v2.0. Without this, all proposals go through coordinator step.

**Test:** Create proposal for "Sports Club" (no coordinator) and verify initial status is PENDING_DIRECTOR_SSC.

---

### Rejection Type Handling
**File:** `proposalWorkflowController.js` → `handleProposalStatusTransition()`

```javascript
// Line ~120
if (isRejection) {
  nextStatus = rejectionType === 'HARD' ? 'REJECTED' : 'RETURNED_FOR_REVISION';
}
```

**SOFT Rejection:**
- Status: RETURNED_FOR_REVISION
- President can edit & resubmit
- Resubmission respects null coordinator check

**HARD Rejection:**
- Status: REJECTED (final)
- President cannot edit
- Proposal is archived

---

### Director Assignment
**File:** `proposalWorkflowController.js` → `handleProposalStatusTransition()`

```javascript
// Line ~140
if (proposal.current_status === 'PENDING_DIRECTOR_SSC' && isApproval && assignedAsstDirectorId) {
  updateData.assigned_asst_director_id = assignedAsstDirectorId;
}
```

**Request:**
```json
{
  "proposalId": 1,
  "action": "APPROVE",
  "assignedAsstDirectorId": 2
}
```

**Validation:** Only assigned AD can approve the proposal.

---

### 7-Slot Hierarchy Manager
**File:** `frontend/src/components/AdminHierarchyManager.jsx`

**Key Features:**
1. Card-based layout (responsive)
2. 7 dropdowns for each society
3. Form validation
4. Success/error messages
5. Edit/Cancel buttons

**Form Fields:**
```javascript
{
  presidentId: '',           // Required
  seniorVpId: '',            // Optional
  vpMaleId: '',              // Optional
  vpFemaleId: '',            // Optional
  gsMaleId: '',              // Optional
  gsFemaleId: '',            // Optional
  coordinatorId: ''          // Optional
}
```

---

## Common Issues & Solutions

### Issue: Proposals still going through PENDING_COORDINATOR
**Cause:** Null coordinator check not implemented
**Solution:** Verify `createProposal()` has the hasCoordinator logic

### Issue: Director assignment not working
**Cause:** assignedAsstDirectorId not being passed
**Solution:** Ensure request includes `assignedAsstDirectorId` field

### Issue: HARD rejection still editable
**Cause:** Frontend not checking rejection_type
**Solution:** Add check in PresidentDashboard:
```jsx
{proposal.rejection_type === 'HARD' && (
  <p>This proposal cannot be edited.</p>
)}
```

### Issue: Hierarchy manager showing only 2 fields
**Cause:** Old AdminHierarchy component still in use
**Solution:** Replace with AdminHierarchyManager component

---

## Testing Commands

### Test 1: Null Coordinator Check
```bash
# Create proposal for society without coordinator
curl -X POST http://localhost:5000/api/proposals \
  -H "Content-Type: application/json" \
  -d '{
    "societyId": 3,
    "title": "Test Event",
    "description": "Testing null coordinator",
    "eventDate": "2026-03-15",
    "budgetRequested": 5000
  }'

# Expected: initialStatus = "PENDING_DIRECTOR_SSC"
```

### Test 2: SOFT Rejection
```bash
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "action": "REJECT",
    "rejectionReason": "Budget too high",
    "rejectionType": "SOFT"
  }'

# Expected: status = "RETURNED_FOR_REVISION"
```

### Test 3: HARD Rejection
```bash
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 2,
    "action": "REJECT",
    "rejectionReason": "Rejected permanently",
    "rejectionType": "HARD"
  }'

# Expected: status = "REJECTED"
```

### Test 4: Director Assignment
```bash
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Content-Type: application/json" \
  -d '{
    "proposalId": 1,
    "action": "APPROVE",
    "assignedAsstDirectorId": 2
  }'

# Expected: assigned_asst_director_id = 2, status = "PENDING_ASST_DIRECTOR"
```

---

## Database Verification

### Check Null Coordinator Societies
```sql
SELECT id, name, coordinator_id FROM societies WHERE coordinator_id IS NULL;
-- Should return: Qalamkar, Sports Club, Environmental Club
```

### Check Hierarchy Completeness
```sql
SELECT name, 
       president_id, senior_vp_id, vp_male_id, vp_female_id, 
       gs_male_id, gs_female_id, coordinator_id
FROM societies
WHERE id = 1;
```

### Check Rejection Types
```sql
SELECT id, current_status, rejection_type, rejection_reason 
FROM proposals 
WHERE rejection_type IS NOT NULL;
```

---

## Code Review Checklist

- [ ] Null coordinator check implemented in createProposal()
- [ ] Rejection type handling in handleProposalStatusTransition()
- [ ] Director assignment logic working
- [ ] AdminHierarchyManager component created
- [ ] All 7 hierarchy fields in form
- [ ] Database schema updated with new columns
- [ ] Seed.js generates 84 leaders
- [ ] 3 societies without coordinators
- [ ] API endpoints return correct data
- [ ] Frontend displays rejection types correctly
- [ ] HARD rejections disable edit button
- [ ] SOFT rejections show edit button

---

## Performance Optimization Tips

1. **Database Indexes:** Already added on FK columns
2. **Query Optimization:** Use JOINs instead of multiple queries
3. **Frontend Caching:** Cache societies list to reduce API calls
4. **Lazy Loading:** Load hierarchy details on demand

---

## Security Considerations

1. **Authorization:** Verify user role before allowing actions
2. **Validation:** Validate all input (IDs, dates, amounts)
3. **SQL Injection:** Use parameterized queries (already done)
4. **CORS:** Ensure CORS_ORIGIN is set correctly
5. **Authentication:** Mock auth in MVP, implement real auth later

---

## Rollback Plan

If issues occur:

```bash
# Restore database
mysql -u root -p campus_connect < backup_YYYYMMDD.sql

# Revert backend files
git checkout proposalWorkflowController.js proposalRoutes.js

# Revert frontend files
git checkout frontend/src/App.js
rm frontend/src/components/AdminHierarchyManager.*

# Restart servers
npm start  # backend
cd frontend && npm start  # frontend
```

---

## Documentation Updates Needed

- [ ] Update ARCHITECTURE.md with new hierarchy structure
- [ ] Update WORKFLOW_API_DOCUMENTATION.md with new endpoints
- [ ] Update TEST_SCENARIOS.md with new test cases
- [ ] Update README.md with v2.0 features
- [ ] Create MIGRATION_GUIDE.md for existing deployments

---

## Next Steps (Phase 3)

1. **Co-Pilot Dashboard**
   - Unified view for all society leaders
   - Create proposals from any assigned society
   - View all proposals across societies

2. **Bulk Updates**
   - CSV import for hierarchy
   - Annual update workflow

3. **Analytics**
   - Approval time tracking
   - Rejection rate analysis
   - Workflow bottleneck identification

---

## Contact & Support

For questions or issues:
1. Check REFACTORING_GUIDE_v2.md
2. Review WORKFLOW_API_DOCUMENTATION.md
3. Check test scenarios in TEST_SCENARIOS.md
4. Review code comments in proposalWorkflowController.js

---

**Version:** 2.0
**Last Updated:** January 2026
**Status:** Ready for Implementation
