# Campus Connect - Test Scenarios & Workflow Examples

## Overview
This document provides detailed test scenarios to validate the conditional approval workflow engine.

---

## Scenario 1: Happy Path - Society WITH Coordinator

**Setup:**
- Society: Debating Society (has coordinator)
- President: Ahmed Khan
- Coordinator: Coordinator 1
- Budget: 5000

**Steps:**

### Step 1: President Creates Proposal
```
POST /proposals
{
  "societyId": 1,
  "title": "Inter-University Debate Championship",
  "description": "Annual debate competition with 8 universities",
  "eventDate": "2026-03-15",
  "budgetRequested": 5000
}

Expected Status: PENDING_COORDINATOR
Reason: Society has coordinator_id = 21 (NOT NULL)
```

### Step 2: Coordinator Approves
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE"
}

Expected Status: PENDING_DIRECTOR_SSC
Approver Role: COORDINATOR
```

### Step 3: Director SSC Approves & Assigns AD
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE",
  "assignedAsstDirectorId": 2
}

Expected Status: PENDING_ASST_DIRECTOR
Approver Role: DIRECTOR_SSC
Assigned to: Tariq Ejaz (AD)
```

### Step 4: Assistant Director Approves
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE"
}

Expected Status: PENDING_FINANCE_SECRETARY
Approver Role: ASST_DIRECTOR
Note: Only Tariq Ejaz can approve (assigned_asst_director_id = 2)
```

### Step 5: Finance Secretary Approves
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE"
}

Expected Status: PENDING_REGISTRAR
Approver Role: FINANCE_SECRETARY
```

### Step 6: Registrar Approves
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE"
}

Expected Status: PENDING_VC
Approver Role: REGISTRAR
```

### Step 7: VC Approves (Final)
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE"
}

Expected Status: APPROVED
Approver Role: VC
Result: Proposal is now APPROVED
```

**Approval Chain Summary:**
```
PENDING_COORDINATOR 
  → (Coordinator approves)
PENDING_DIRECTOR_SSC 
  → (Director SSC approves & assigns AD)
PENDING_ASST_DIRECTOR 
  → (AD approves)
PENDING_FINANCE_SECRETARY 
  → (Finance approves)
PENDING_REGISTRAR 
  → (Registrar approves)
PENDING_VC 
  → (VC approves)
APPROVED ✓
```

---

## Scenario 2: Happy Path - Society WITHOUT Coordinator

**Setup:**
- Society: Sports Club (NO coordinator)
- President: Hassan Malik
- Coordinator: NULL
- Budget: 8000

**Steps:**

### Step 1: President Creates Proposal
```
POST /proposals
{
  "societyId": 3,
  "title": "Football Tournament",
  "description": "Campus-wide football tournament",
  "eventDate": "2026-04-20",
  "budgetRequested": 8000
}

Expected Status: PENDING_DIRECTOR_SSC
Reason: Society has coordinator_id = NULL
        SKIPS coordinator step entirely
```

### Step 2: Director SSC Approves & Assigns AD
```
POST /proposals/next-status
{
  "proposalId": 2,
  "action": "APPROVE",
  "assignedAsstDirectorId": 3
}

Expected Status: PENDING_ASST_DIRECTOR
Approver Role: DIRECTOR_SSC
Assigned to: Bilal Ashraf (AD)
Note: Coordinator step was skipped
```

### Steps 3-7: Continue as Scenario 1
(Same as steps 4-7 above)

**Approval Chain Summary:**
```
PENDING_DIRECTOR_SSC (Coordinator step SKIPPED)
  → (Director SSC approves & assigns AD)
PENDING_ASST_DIRECTOR 
  → (AD approves)
PENDING_FINANCE_SECRETARY 
  → (Finance approves)
PENDING_REGISTRAR 
  → (Registrar approves)
PENDING_VC 
  → (VC approves)
APPROVED ✓
```

**Key Difference:** Saves one approval step by skipping coordinator.

---

## Scenario 3: Rejection at Finance Secretary Level

**Setup:**
- Proposal: Already at PENDING_FINANCE_SECRETARY
- Reason: Budget exceeds allocated funds

**Steps:**

### Step 1: Finance Secretary Rejects
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "REJECT",
  "rejectionReason": "Budget of 5000 exceeds Q1 allocation of 4000. Please reduce budget or request for Q2."
}

Expected Status: RETURNED_FOR_REVISION
Rejection Reason: Stored in database
Approver Role: FINANCE_SECRETARY
```

### Step 2: President Views Rejection Reason
```
GET /proposals/1

Response includes:
{
  "proposal": {
    "id": 1,
    "current_status": "RETURNED_FOR_REVISION",
    "rejection_reason": "Budget of 5000 exceeds Q1 allocation of 4000. Please reduce budget or request for Q2.",
    ...
  }
}
```

### Step 3: President Edits Proposal
(Frontend updates proposal details - not an API call)

### Step 4: President Resubmits
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "RESUBMIT"
}

Expected Status: PENDING_COORDINATOR
Reason: Society has coordinator, so goes back to PENDING_COORDINATOR
Note: Proposal restarts from the beginning
```

### Step 5: Workflow Continues
Coordinator approves → Director SSC → AD → Finance Secretary (again)

**Rejection Loop Summary:**
```
PENDING_FINANCE_SECRETARY
  → (Finance rejects)
RETURNED_FOR_REVISION
  → (President edits)
  → (President resubmits)
PENDING_COORDINATOR (Restarts from beginning)
  → (Coordinator approves)
PENDING_DIRECTOR_SSC
  → ... (continues)
```

---

## Scenario 4: Rejection at Director SSC Level (Society WITHOUT Coordinator)

**Setup:**
- Proposal: At PENDING_DIRECTOR_SSC (from society without coordinator)
- Reason: Event date conflicts with university calendar

**Steps:**

### Step 1: Director SSC Rejects
```
POST /proposals/next-status
{
  "proposalId": 2,
  "action": "REJECT",
  "rejectionReason": "Event date (2026-04-20) conflicts with final exams. Please reschedule to after exam period."
}

Expected Status: RETURNED_FOR_REVISION
```

### Step 2: President Resubmits
```
POST /proposals/next-status
{
  "proposalId": 2,
  "action": "RESUBMIT"
}

Expected Status: PENDING_DIRECTOR_SSC
Reason: Society has NO coordinator, so goes directly to PENDING_DIRECTOR_SSC
Note: Skips coordinator step again
```

**Key Point:** The resubmission logic checks `coordinator_id` again, so it maintains the same workflow pattern.

---

## Scenario 5: Multiple Rejections & Resubmissions

**Setup:**
- Proposal: Hackathon 2026 (Tech Society with coordinator)
- Multiple rejection points

**Timeline:**

```
1. President creates → PENDING_COORDINATOR
2. Coordinator approves → PENDING_DIRECTOR_SSC
3. Director SSC rejects (reason: "Insufficient detail on budget breakdown")
   → RETURNED_FOR_REVISION
4. President edits & resubmits → PENDING_COORDINATOR
5. Coordinator approves → PENDING_DIRECTOR_SSC
6. Director SSC approves & assigns AD → PENDING_ASST_DIRECTOR
7. AD rejects (reason: "Need clarification on venue")
   → RETURNED_FOR_REVISION
8. President edits & resubmits → PENDING_COORDINATOR
9. Coordinator approves → PENDING_DIRECTOR_SSC
10. Director SSC approves & assigns AD → PENDING_ASST_DIRECTOR
11. AD approves → PENDING_FINANCE_SECRETARY
12. Finance Secretary approves → PENDING_REGISTRAR
13. Registrar approves → PENDING_VC
14. VC approves → APPROVED ✓
```

**Approval History (Audit Trail):**
```
[
  { action: "APPROVED", approver: "Coordinator 1", timestamp: "2026-01-01 10:00" },
  { action: "REJECTED", approver: "Director SSC", reason: "Insufficient detail...", timestamp: "2026-01-01 10:15" },
  { action: "RESUBMITTED", approver: "Ahmed Khan (President)", timestamp: "2026-01-01 10:30" },
  { action: "APPROVED", approver: "Coordinator 1", timestamp: "2026-01-01 10:45" },
  { action: "APPROVED", approver: "Director SSC", timestamp: "2026-01-01 11:00" },
  { action: "REJECTED", approver: "Tariq Ejaz (AD)", reason: "Need clarification...", timestamp: "2026-01-01 11:15" },
  { action: "RESUBMITTED", approver: "Ahmed Khan (President)", timestamp: "2026-01-01 11:30" },
  { action: "APPROVED", approver: "Coordinator 1", timestamp: "2026-01-01 11:45" },
  { action: "APPROVED", approver: "Director SSC", timestamp: "2026-01-01 12:00" },
  { action: "APPROVED", approver: "Tariq Ejaz (AD)", timestamp: "2026-01-01 12:15" },
  { action: "APPROVED", approver: "Finance Secretary", timestamp: "2026-01-01 12:30" },
  { action: "APPROVED", approver: "Registrar", timestamp: "2026-01-01 12:45" },
  { action: "APPROVED", approver: "VC", timestamp: "2026-01-01 13:00" }
]
```

---

## Scenario 6: Authorization Failures

### Test 6a: Wrong Role Tries to Approve
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE"
}

Current Status: PENDING_COORDINATOR
Approver Role: DIRECTOR_SSC (Wrong!)
Expected Response: 403 Forbidden
Error: "Only COORDINATOR can approve at this stage"
```

### Test 6b: Non-Assigned AD Tries to Approve
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE"
}

Current Status: PENDING_ASST_DIRECTOR
Assigned to: Tariq Ejaz (ID: 2)
Approver: Bilal Ashraf (ID: 3)
Expected Response: 403 Forbidden
Error: "This proposal is not assigned to you"
```

### Test 6c: Non-President Tries to Resubmit
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "RESUBMIT"
}

Current Status: RETURNED_FOR_REVISION
Approver Role: COORDINATOR (Wrong!)
Expected Response: 403 Forbidden
Error: "Only the society president can resubmit"
```

### Test 6d: President of Different Society Tries to Create Proposal
```
POST /proposals
{
  "societyId": 1,
  "title": "...",
  ...
}

User: Hassan Malik (President of Sports Club)
Society: Debating Society (President: Ahmed Khan)
Expected Response: 403 Forbidden
Error: "You are not the president of this society"
```

---

## Scenario 7: File Attachments

### Step 1: Create Proposal
```
POST /proposals
{
  "societyId": 1,
  "title": "Debate Championship",
  ...
}

Response: proposalId = 1
```

### Step 2: Upload Budget Document
```
POST /proposals/1/attachments
{
  "fileUrl": "https://storage.example.com/proposal_1_budget.pdf",
  "fileName": "budget.pdf"
}

Expected Response: 201 Created
attachmentId: 1
```

### Step 3: Upload Event Plan
```
POST /proposals/1/attachments
{
  "fileUrl": "https://storage.example.com/proposal_1_event_plan.docx",
  "fileName": "event_plan.docx"
}

Expected Response: 201 Created
attachmentId: 2
```

### Step 4: View Proposal with Attachments
```
GET /proposals/1

Response includes:
{
  "proposal": { ... },
  "attachments": [
    {
      "id": 1,
      "file_url": "https://storage.example.com/proposal_1_budget.pdf",
      "file_name": "budget.pdf",
      "uploaded_at": "2026-01-01T10:00:00Z"
    },
    {
      "id": 2,
      "file_url": "https://storage.example.com/proposal_1_event_plan.docx",
      "file_name": "event_plan.docx",
      "uploaded_at": "2026-01-01T10:05:00Z"
    }
  ]
}
```

---

## Scenario 8: Edge Cases

### Test 8a: Resubmit from RETURNED_FOR_REVISION (Society WITH Coordinator)
```
Current Status: RETURNED_FOR_REVISION
Society: Debating Society (coordinator_id = 21)

POST /proposals/next-status
{
  "proposalId": 1,
  "action": "RESUBMIT"
}

Expected Status: PENDING_COORDINATOR
Reason: Coordinator exists, so goes back to coordinator step
```

### Test 8b: Resubmit from RETURNED_FOR_REVISION (Society WITHOUT Coordinator)
```
Current Status: RETURNED_FOR_REVISION
Society: Sports Club (coordinator_id = NULL)

POST /proposals/next-status
{
  "proposalId": 2,
  "action": "RESUBMIT"
}

Expected Status: PENDING_DIRECTOR_SSC
Reason: No coordinator, so skips to director step
```

### Test 8c: Reject with Empty Reason
```
POST /proposals/next-status
{
  "proposalId": 1,
  "action": "REJECT",
  "rejectionReason": ""
}

Expected Response: 400 Bad Request
Error: "rejectionReason cannot be empty"
```

### Test 8d: Approve Already Approved Proposal
```
Current Status: APPROVED

POST /proposals/next-status
{
  "proposalId": 1,
  "action": "APPROVE"
}

Expected Response: 400 Bad Request
Error: "Cannot approve proposal in APPROVED status"
```

---

## Database Verification Queries

### Verify Proposal Status Progression
```sql
SELECT p.id, p.title, p.current_status, s.name as society, s.coordinator_id
FROM proposals p
JOIN societies s ON p.society_id = s.id
WHERE p.id = 1;
```

### Verify Approval History
```sql
SELECT ah.id, ah.action, u.name, u.role, ah.comments, ah.created_at
FROM approval_history ah
JOIN users u ON ah.approver_id = u.id
WHERE ah.proposal_id = 1
ORDER BY ah.created_at DESC;
```

### Verify Societies Without Coordinators
```sql
SELECT id, name, president_id, coordinator_id
FROM societies
WHERE coordinator_id IS NULL;
```

### Verify Assistant Director Assignment
```sql
SELECT p.id, p.title, u.name as assigned_ad
FROM proposals p
LEFT JOIN users u ON p.assigned_asst_director_id = u.id
WHERE p.current_status = 'PENDING_ASST_DIRECTOR';
```

---

## Performance Considerations

### Indexes Created
- `idx_societies_president` - Fast lookup of societies by president
- `idx_societies_coordinator` - Fast lookup of societies by coordinator
- `idx_proposals_society` - Fast lookup of proposals by society
- `idx_proposals_status` - Fast filtering by status
- `idx_proposals_asst_director` - Fast lookup of proposals assigned to AD
- `idx_attachments_proposal` - Fast lookup of attachments
- `idx_approval_history_proposal` - Fast lookup of approval history

### Query Optimization
- Use connection pooling (10 connections)
- Fetch proposal with society details in single query
- Use indexes for filtering and sorting
- Limit approval history to 100 most recent entries

---

## Rollback Scenarios

### If Proposal Needs to Go Back to Previous Step
Currently not supported in the workflow. To implement:
1. Add new action: "RETURN_TO_PREVIOUS"
2. Validate only Director SSC or higher can do this
3. Update status to previous step
4. Log action in approval history

### If Proposal Needs to Be Cancelled
Currently not supported. To implement:
1. Add new status: "CANCELLED"
2. Add endpoint: `POST /proposals/:id/cancel`
3. Only president can cancel
4. Log cancellation reason
