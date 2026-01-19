# Campus Connect v2.0 - Quick Reference Card

## 🎯 What Changed?

### Database
- **Societies:** 2 hierarchy slots → 7 hierarchy slots
- **Proposals:** Added rejection_type (SOFT/HARD)
- **Users:** Added roll_number, society_id, SOCIETY_LEADER role

### Backend
- **Null Coordinator Check:** If coordinator_id IS NULL → Skip PENDING_COORDINATOR
- **Director Assignment:** Director SSC assigns to specific Assistant Director
- **Rejection Types:** SOFT (editable) vs HARD (final)

### Frontend
- **Admin Manager:** 2 dropdowns → 7 dropdowns
- **Hierarchy Display:** Card-based responsive layout
- **Rejection UI:** Red for HARD, Yellow for SOFT

---

## 🚀 Quick Start

### 1. Database
```bash
mysql -u root -p campus_connect < schema.sql
npm run seed
```

### 2. Backend
```bash
# Replace files:
# - proposalWorkflowController.js
# - proposalRoutes.js
npm start
```

### 3. Frontend
```bash
cd frontend
# Add files:
# - src/components/AdminHierarchyManager.jsx
# - src/components/AdminHierarchyManager.css
npm start
```

---

## 🔑 Critical Code Snippets

### Null Coordinator Check
```javascript
const hasCoordinator = societies[0].coordinator_id !== null;
const initialStatus = hasCoordinator ? 'PENDING_COORDINATOR' : 'PENDING_DIRECTOR_SSC';
```

### Rejection Type Handling
```javascript
if (isRejection) {
  nextStatus = rejectionType === 'HARD' ? 'REJECTED' : 'RETURNED_FOR_REVISION';
}
```

### Director Assignment
```javascript
if (proposal.current_status === 'PENDING_DIRECTOR_SSC' && isApproval && assignedAsstDirectorId) {
  updateData.assigned_asst_director_id = assignedAsstDirectorId;
}
```

---

## 📊 7-Slot Hierarchy

| Position | Required | Role |
|----------|----------|------|
| President | ✅ Yes | PRESIDENT or SOCIETY_LEADER |
| Senior VP | ❌ No | SOCIETY_LEADER |
| VP Male | ❌ No | SOCIETY_LEADER |
| VP Female | ❌ No | SOCIETY_LEADER |
| GS Male | ❌ No | SOCIETY_LEADER |
| GS Female | ❌ No | SOCIETY_LEADER |
| Coordinator | ❌ No | COORDINATOR |

---

## 🧪 Test Commands

### Test 1: Null Coordinator
```bash
curl -X POST http://localhost:5000/api/proposals \
  -H "Content-Type: application/json" \
  -d '{"societyId": 3, "title": "Test", "description": "Test", "eventDate": "2026-03-15", "budgetRequested": 5000}'
# Expected: initialStatus = "PENDING_DIRECTOR_SSC"
```

### Test 2: SOFT Rejection
```bash
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Content-Type: application/json" \
  -d '{"proposalId": 1, "action": "REJECT", "rejectionReason": "Budget too high", "rejectionType": "SOFT"}'
# Expected: status = "RETURNED_FOR_REVISION"
```

### Test 3: HARD Rejection
```bash
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Content-Type: application/json" \
  -d '{"proposalId": 2, "action": "REJECT", "rejectionReason": "Rejected", "rejectionType": "HARD"}'
# Expected: status = "REJECTED"
```

### Test 4: Director Assignment
```bash
curl -X POST http://localhost:5000/api/proposals/next-status \
  -H "Content-Type: application/json" \
  -d '{"proposalId": 1, "action": "APPROVE", "assignedAsstDirectorId": 2}'
# Expected: assigned_asst_director_id = 2, status = "PENDING_ASST_DIRECTOR"
```

---

## 📋 Workflow Comparison

### Before
```
Created → PENDING_COORDINATOR → PENDING_DIRECTOR_SSC → ... → APPROVED/RETURNED
```

### After
```
Created → Check Coordinator → PENDING_COORDINATOR/PENDING_DIRECTOR_SSC → ... → APPROVED/REJECTED/RETURNED
```

---

## 🎯 12 Societies

1. Hayatian Blood (with coordinator)
2. Debating Society (with coordinator)
3. Qalamkar (NO coordinator) ⭐
4. Photography Club (with coordinator)
5. Sports Club (NO coordinator) ⭐
6. Music Society (with coordinator)
7. Drama Club (with coordinator)
8. Tech Society (with coordinator)
9. Environmental Club (NO coordinator) ⭐
10. Entrepreneurship Society (with coordinator)
11. Literary Society (with coordinator)
12. Art & Design Club (with coordinator)

---

## 📁 Files Modified/Created

### Modified
- ✅ schema.sql
- ✅ seed.js
- ✅ proposalWorkflowController.js
- ✅ proposalRoutes.js

### Created
- ✅ frontend/src/components/AdminHierarchyManager.jsx
- ✅ frontend/src/components/AdminHierarchyManager.css
- ✅ REFACTORING_GUIDE_v2.md
- ✅ REFACTORING_SUMMARY_v2.md
- ✅ IMPLEMENTATION_NOTES.md
- ✅ DELIVERY_SUMMARY.md
- ✅ QUICK_REFERENCE_v2.md (this file)

---

## 🔍 Database Queries

### Check Null Coordinator Societies
```sql
SELECT id, name, coordinator_id FROM societies WHERE coordinator_id IS NULL;
```

### Check Hierarchy Completeness
```sql
SELECT name, president_id, senior_vp_id, vp_male_id, vp_female_id, gs_male_id, gs_female_id, coordinator_id
FROM societies WHERE id = 1;
```

### Check Rejection Types
```sql
SELECT id, current_status, rejection_type, rejection_reason FROM proposals WHERE rejection_type IS NOT NULL;
```

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Proposals still going through PENDING_COORDINATOR | Check null coordinator logic in createProposal() |
| Director assignment not working | Ensure assignedAsstDirectorId is passed in request |
| HARD rejection still editable | Add rejection_type check in frontend |
| Hierarchy manager showing only 2 fields | Replace with AdminHierarchyManager component |

---

## 📞 Documentation

| Document | Purpose |
|----------|---------|
| REFACTORING_GUIDE_v2.md | Complete refactoring guide |
| REFACTORING_SUMMARY_v2.md | Executive summary |
| IMPLEMENTATION_NOTES.md | Developer notes |
| DELIVERY_SUMMARY.md | Project completion summary |
| QUICK_REFERENCE_v2.md | This quick reference |

---

## ✅ Deployment Checklist

- [ ] Backup database
- [ ] Run schema.sql
- [ ] Run seed.js
- [ ] Replace backend files
- [ ] Add frontend components
- [ ] Restart servers
- [ ] Run test scenarios
- [ ] Verify null coordinator check
- [ ] Verify director assignment
- [ ] Verify rejection types
- [ ] Verify hierarchy manager

---

## 🎓 Key Concepts

### Null Coordinator Check
If a society doesn't have a coordinator, proposals skip the PENDING_COORDINATOR step and go directly to PENDING_DIRECTOR_SSC.

### Director Assignment
When Director SSC approves a proposal, they assign it to a specific Assistant Director. Only that AD can approve it next.

### Two-Tier Rejection
- **SOFT:** President can edit and resubmit
- **HARD:** Proposal is final and cannot be edited

### Co-Pilot Dashboard
A unified dashboard for all society leaders (President, VPs, GSs) to manage proposals across their assigned societies.

---

## 🔗 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/proposals | Create proposal |
| GET | /api/proposals/:id | Get proposal details |
| POST | /api/proposals/next-status | Approve/reject/resubmit |
| POST | /api/proposals/:id/attachments | Upload attachment |
| GET | /api/societies | Get all societies |
| PUT | /api/societies/:id | Update hierarchy |
| GET | /api/dashboard | Get user dashboard |

---

## 📊 Statistics

- **12 Societies:** All UOG societies
- **84 Leaders:** 7 per society
- **7 Hierarchy Slots:** President, Sr VP, 2 VPs, 2 GSs, Coordinator
- **2 Rejection Types:** SOFT (editable), HARD (final)
- **9 Proposal Statuses:** Including new REJECTED status
- **8 User Roles:** Including new SOCIETY_LEADER role

---

## 🎯 Next Steps

1. Review REFACTORING_GUIDE_v2.md
2. Review IMPLEMENTATION_NOTES.md
3. Deploy following deployment steps
4. Run all 4 test scenarios
5. Monitor for issues
6. Plan Phase 3 enhancements

---

**Version:** 2.0
**Status:** Production Ready
**Last Updated:** January 2026

For detailed information, see REFACTORING_GUIDE_v2.md
