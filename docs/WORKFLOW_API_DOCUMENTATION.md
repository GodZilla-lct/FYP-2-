# Campus Connect - Proposal Workflow API Documentation

## Overview
This document describes the approval workflow engine for the Campus Connect university management portal. The system implements a conditional approval chain that adapts based on whether a society has a coordinator.

---

## Database Schema

### Users Table
```sql
- id: INT (Primary Key)
- name: VARCHAR(255)
- email: VARCHAR(255) UNIQUE
- password_hash: VARCHAR(255)
- role: ENUM (PRESIDENT, COORDINATOR, DIRECTOR_SSC, ASST_DIRECTOR, FINANCE_SECRETARY, REGISTRAR, VC)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Societies Table
```sql
- id: INT (Primary Key)
- name: VARCHAR(255) UNIQUE
- president_id: INT (FK to users)
- coordinator_id: INT (FK to users, NULLABLE) ← CRITICAL: Can be NULL
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Proposals Table
```sql
- id: INT (Primary Key)
- society_id: INT (FK to societies)
- title: VARCHAR(255)
- description: TEXT
- event_date: DATE
- budget_requested: DECIMAL(10, 2)
- current_status: ENUM (PENDING_COORDINATOR, PENDING_DIRECTOR_SSC, PENDING_ASST_DIRECTOR, 
                        PENDING_FINANCE_SECRETARY, PENDING_REGISTRAR, PENDING_VC, 
                        APPROVED, RETURNED_FOR_REVISION)
- rejection_reason: TEXT (NULLABLE)
- assigned_asst_director_id: INT (FK to users, NULLABLE)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Proposal Attachments Table
```sql
- id: INT (Primary Key)
- proposal_id: INT (FK to proposals)
- file_url: VARCHAR(500)
- file_name: VARCHAR(255)
- uploaded_at: TIMESTAMP
```

### Approval History Table (Audit Trail)
```sql
- id: INT (Primary Key)
- proposal_id: INT (FK to proposals)
- approver_id: INT (FK to users)
- action: ENUM (APPROVED, REJECTED, RESUBMITTED)
- comments: TEXT (NULLABLE)
- created_at: TIMESTAMP
```

---

## Approval Workflow Logic

### The "Happy Path" (Approval Chain)

```
1. SUBMISSION
   ├─ IF coordinator_id IS NOT NULL → Status: PENDING_COORDINATOR
   └─ IF coordinator_id IS NULL → Status: PENDING_DIRECTOR_SSC (SKIPS coordinator step)

2. COORDINATOR APPROVES (if exists)
   └─ Status: PENDING_DIRECTOR_SSC

3. DIRECTOR SSC APPROVES
   ├─ Assigns proposal to specific Assistant Director
   └─ Status: PENDING_ASST_DIRECTOR

4. ASSISTANT DIRECTOR APPROVES
   └─ Status: PENDING_FINANCE_SECRETARY

5. FINANCE SECRETARY APPROVES
   └─ Status: PENDING_REGISTRAR

6. REGISTRAR APPROVES
   └─ Status: PENDING_VC

7. VC APPROVES
   └─ Status: APPROVED (Final)
```

### The "Rejection Path" (Revision Loop)

```
ANY APPROVER REJECTS
├─ Status: RETURNED_FOR_REVISION
├─ rejection_reason: Stored in database
└─ President sees reason and edits proposal

PRESIDENT RESUBMITS
├─ IF coordinator_id IS NOT NULL → Status: PENDING_COORDINATOR
└─ IF coordinator_id IS NULL → Status: PENDING_DIRECTOR_SSC
```

---

## API Endpoints

### 1. Create Proposal
**POST** `/proposals`

**Authentication:** Required (PRESIDENT role)

**Request Body:**
```json
{
  "societyId": 1,
  "title": "Inter-University Debate Championship",
  "description": "Annual debate competition with 8 universities",
  "eventDate": "2026-03-15",
  "budgetRequested": 5000
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "proposalId": 1,
  "initialStatus": "PENDING_COORDINATOR"
}
```

**Logic:**
- Checks if user is president of the society
- Determines initial status based on `coordinator_id`:
  - If coordinator exists → `PENDING_COORDINATOR`
  - If coordinator is NULL → `PENDING_DIRECTOR_SSC`

---

### 2. Get Proposal Details
**GET** `/proposals/:id`

**Authentication:** Required (Any authenticated user)

**Response (200):**
```json
{
  "proposal": {
    "id": 1,
    "society_id": 1,
    "title": "Inter-University Debate Championship",
    "description": "Annual debate competition with 8 universities",
    "event_date": "2026-03-15",
    "budget_requested": 5000,
    "current_status": "PENDING_DIRECTOR_SSC",
    "rejection_reason": null,
    "assigned_asst_director_id": null,
    "society_name": "Debating Society",
    "coordinator_id": 21,
    "president_id": 8,
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:30:00Z"
  },
  "attachments": [
    {
      "id": 1,
      "file_url": "https://storage.example.com/proposal_1_budget.pdf",
      "file_name": "budget.pdf",
      "uploaded_at": "2026-01-01T10:15:00Z"
    }
  ],
  "approvalHistory": [
    {
      "id": 1,
      "proposal_id": 1,
      "approver_id": 21,
      "action": "APPROVED",
      "comments": null,
      "approver_name": "Coordinator 1",
      "role": "COORDINATOR",
      "created_at": "2026-01-01T10:30:00Z"
    }
  ]
}
```

---

### 3. Handle Status Transition (Approve/Reject/Resubmit)
**POST** `/proposals/next-status`

**Authentication:** Required (Role-based authorization)

#### 3a. Approve Proposal
**Request Body:**
```json
{
  "proposalId": 1,
  "action": "APPROVE",
  "assignedAsstDirectorId": 2
}
```

**Note:** `assignedAsstDirectorId` is ONLY required when:
- Current status is `PENDING_DIRECTOR_SSC`
- User role is `DIRECTOR_SSC`
- This assigns the proposal to a specific Assistant Director

**Response (200):**
```json
{
  "success": true,
  "message": "Proposal approved successfully",
  "proposal": {
    "id": 1,
    "current_status": "PENDING_ASST_DIRECTOR",
    "assigned_asst_director_id": 2,
    ...
  },
  "nextStatus": "PENDING_ASST_DIRECTOR"
}
```

#### 3b. Reject Proposal
**Request Body:**
```json
{
  "proposalId": 1,
  "action": "REJECT",
  "rejectionReason": "Budget exceeds allocated funds for this quarter. Please revise and resubmit."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Proposal rejected successfully",
  "proposal": {
    "id": 1,
    "current_status": "RETURNED_FOR_REVISION",
    "rejection_reason": "Budget exceeds allocated funds for this quarter. Please revise and resubmit.",
    ...
  },
  "nextStatus": "RETURNED_FOR_REVISION"
}
```

#### 3c. Resubmit Proposal (President Only)
**Request Body:**
```json
{
  "proposalId": 1,
  "action": "RESUBMIT"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Proposal resubmitted successfully",
  "proposal": {
    "id": 1,
    "current_status": "PENDING_COORDINATOR",
    ...
  },
  "nextStatus": "PENDING_COORDINATOR"
}
```

**Authorization Rules:**
| Current Status | Required Role | Can Approve | Can Reject |
|---|---|---|---|
| PENDING_COORDINATOR | COORDINATOR | ✓ | ✓ |
| PENDING_DIRECTOR_SSC | DIRECTOR_SSC | ✓ | ✓ |
| PENDING_ASST_DIRECTOR | ASST_DIRECTOR | ✓ | ✓ |
| PENDING_FINANCE_SECRETARY | FINANCE_SECRETARY | ✓ | ✓ |
| PENDING_REGISTRAR | REGISTRAR | ✓ | ✓ |
| PENDING_VC | VC | ✓ | ✓ |
| RETURNED_FOR_REVISION | PRESIDENT | - | - |

---

### 4. Upload Attachment
**POST** `/proposals/:id/attachments`

**Authentication:** Required (PRESIDENT role)

**Request Body:**
```json
{
  "fileUrl": "https://storage.example.com/proposal_1_budget.pdf",
  "fileName": "budget.pdf"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Attachment uploaded successfully",
  "attachmentId": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 403 Forbidden
```json
{
  "error": "Only the society president can resubmit"
}
```

### 404 Not Found
```json
{
  "error": "Proposal not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "details": "Error message details"
}
```

---

## Workflow State Machine

```
                    ┌─────────────────────────────────────────┐
                    │   PROPOSAL CREATED                      │
                    │   (Check coordinator_id)                │
                    └────────────┬────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
        ┌───────────▼──────────┐   ┌─────────▼──────────┐
        │ Has Coordinator?     │   │ No Coordinator     │
        │ YES                  │   │ (NULL)             │
        └───────────┬──────────┘   └─────────┬──────────┘
                    │                        │
        ┌───────────▼──────────┐   ┌─────────▼──────────┐
        │ PENDING_COORDINATOR  │   │ PENDING_DIRECTOR   │
        │ (Coordinator reviews)│   │ (Director reviews) │
        └───────────┬──────────┘   └─────────┬──────────┘
                    │                        │
                    └────────────┬───────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ PENDING_DIRECTOR_SSC   │
                    │ (Assigns to AD)        │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ PENDING_ASST_DIRECTOR  │
                    │ (AD reviews)           │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ PENDING_FINANCE_SEC    │
                    │ (Finance reviews)      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ PENDING_REGISTRAR      │
                    │ (Registrar reviews)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ PENDING_VC             │
                    │ (VC reviews)           │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │ APPROVED               │
                    │ (Final Status)         │
                    └────────────────────────┘

    ANY STAGE CAN REJECT:
    ┌─────────────────────────────────────────┐
    │ RETURNED_FOR_REVISION                   │
    │ (President edits & resubmits)           │
    │ Goes back to Step 1 (coordinator check) │
    └─────────────────────────────────────────┘
```

---

## Testing Scenarios

### Scenario 1: Society WITH Coordinator
1. President creates proposal → Status: `PENDING_COORDINATOR`
2. Coordinator approves → Status: `PENDING_DIRECTOR_SSC`
3. Director SSC approves (assigns to AD) → Status: `PENDING_ASST_DIRECTOR`
4. Continue through chain...

### Scenario 2: Society WITHOUT Coordinator
1. President creates proposal → Status: `PENDING_DIRECTOR_SSC` (SKIPS coordinator)
2. Director SSC approves (assigns to AD) → Status: `PENDING_ASST_DIRECTOR`
3. Continue through chain...

### Scenario 3: Rejection & Resubmission
1. Proposal at `PENDING_FINANCE_SECRETARY`
2. Finance Secretary rejects with reason → Status: `RETURNED_FOR_REVISION`
3. President edits and resubmits
   - If society has coordinator → Status: `PENDING_COORDINATOR`
   - If society has NO coordinator → Status: `PENDING_DIRECTOR_SSC`

---

## Seed Data

The `seed.js` script populates:
- **7 Admin Users:** Director SSC, 3 Assistant Directors, Finance Secretary, Registrar, VC
- **14 Societies:** 12 with coordinators, 2 without (Sports Club, Environmental Club)
- **3 Sample Proposals:** In various stages of approval

Run with:
```bash
node seed.js
```

---

## Implementation Notes

1. **Coordinator Check:** The `coordinator_id` is checked at proposal creation and resubmission to determine the initial status.
2. **Assignment Logic:** Only the Director SSC can assign proposals to Assistant Directors.
3. **Audit Trail:** Every action (approve/reject/resubmit) is logged in `approval_history`.
4. **Rejection Reason:** Stored in the proposal and displayed to the president for context.
5. **Authorization:** Each endpoint validates the user's role matches the current proposal status.
