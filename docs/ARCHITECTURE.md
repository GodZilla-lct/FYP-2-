# Campus Connect - Architecture Documentation

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ President Portal     │  │ SSC Admin Panel                  │ │
│  ├──────────────────────┤  ├──────────────────────────────────┤ │
│  │ • Create Proposal    │  │ • Edit Society Hierarchy         │ │
│  │ • View Status        │  │ • Manage Presidents/Coordinators │ │
│  │ • Upload Documents   │  │ • View All Societies             │ │
│  │ • Resubmit Proposal  │  │ • Analytics Dashboard            │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ Approver Dashboard   │  │ VC Dashboard                     │ │
│  ├──────────────────────┤  ├──────────────────────────────────┤ │
│  │ • View Pending       │  │ • Final Approvals                │ │
│  │ • Approve/Reject     │  │ • Approved Proposals             │ │
│  │ • Add Comments       │  │ • Budget Summary                 │ │
│  │ • Assign to AD       │  │ • Reports                        │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
                    HTTP/REST API (JSON)
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              API Routes Layer                            │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  POST   /proposals                 (Create)              │   │
│  │  GET    /proposals/:id             (Fetch)               │   │
│  │  POST   /proposals/next-status     (Workflow)            │   │
│  │  POST   /proposals/:id/attachments (Upload)              │   │
│  │  PUT    /societies/:id             (Edit Hierarchy)      │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                 ↓                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Middleware Layer                                 │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  • Authentication (JWT)                                  │   │
│  │  • Authorization (Role-based)                            │   │
│  │  • Input Validation                                      │   │
│  │  • Error Handling                                        │   │
│  │  • CORS                                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                 ↓                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │      Business Logic Layer (Controllers)                  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  proposalWorkflowController.js                           │   │
│  │  ├─ handleProposalStatusTransition()                     │   │
│  │  ├─ getNextStatus()                                      │   │
│  │  ├─ createProposal()                                     │   │
│  │  ├─ getProposalDetails()                                 │   │
│  │  └─ uploadAttachment()                                   │   │
│  │                                                           │   │
│  │  societyController.js (Future)                           │   │
│  │  ├─ updateSocietyHierarchy()                             │   │
│  │  └─ getSocieties()                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                 ↓                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Data Access Layer (Database)                     │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  • Connection Pool (10 connections)                      │   │
│  │  • Query Execution                                       │   │
│  │  • Transaction Management                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                 ↓                                 │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MySQL Database                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ users        │  │ societies    │  │ proposals            │  │
│  ├──────────────┤  ├──────────────┤  ├──────────────────────┤  │
│  │ id (PK)      │  │ id (PK)      │  │ id (PK)              │  │
│  │ name         │  │ name         │  │ society_id (FK)      │  │
│  │ email        │  │ president_id │  │ title                │  │
│  │ role         │  │ coordinator_ │  │ description          │  │
│  │ password_hash│  │   id (FK)    │  │ event_date           │  │
│  │ created_at   │  │ created_at   │  │ budget_requested     │  │
│  │ updated_at   │  │ updated_at   │  │ current_status       │  │
│  └──────────────┘  └──────────────┘  │ rejection_reason     │  │
│                                       │ assigned_asst_       │  │
│  ┌──────────────────────┐             │   director_id (FK)   │  │
│  │ proposal_attachments │             │ created_at           │  │
│  ├──────────────────────┤             │ updated_at           │  │
│  │ id (PK)              │             └──────────────────────┘  │
│  │ proposal_id (FK)     │                                        │
│  │ file_url             │             ┌──────────────────────┐  │
│  │ file_name            │             │ approval_history     │  │
│  │ uploaded_at          │             ├──────────────────────┤  │
│  └──────────────────────┘             │ id (PK)              │  │
│                                       │ proposal_id (FK)     │  │
│                                       │ approver_id (FK)     │  │
│                                       │ action               │  │
│                                       │ comments             │  │
│                                       │ created_at           │  │
│                                       └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow Engine Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Proposal Workflow Engine                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  INPUT: Proposal ID, Action (APPROVE/REJECT/RESUBMIT)           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 1. FETCH PROPOSAL & SOCIETY                             │    │
│  │    - Get current status                                 │    │
│  │    - Get coordinator_id (NULL or NOT NULL)              │    │
│  │    - Get president_id                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 2. AUTHORIZATION CHECK                                  │    │
│  │    - Validate user role matches current status          │    │
│  │    - For AD: Check if assigned to this proposal         │    │
│  │    - For President: Check if owns society               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 3. DETERMINE NEXT STATUS                                │    │
│  │                                                          │    │
│  │    IF action == REJECT                                  │    │
│  │      → nextStatus = RETURNED_FOR_REVISION               │    │
│  │                                                          │    │
│  │    ELSE IF action == RESUBMIT                           │    │
│  │      → IF coordinator_id IS NOT NULL                    │    │
│  │           nextStatus = PENDING_COORDINATOR              │    │
│  │         ELSE                                             │    │
│  │           nextStatus = PENDING_DIRECTOR_SSC             │    │
│  │                                                          │    │
│  │    ELSE IF action == APPROVE                            │    │
│  │      → Use switch/case on currentStatus:                │    │
│  │         PENDING_COORDINATOR → PENDING_DIRECTOR_SSC      │    │
│  │         PENDING_DIRECTOR_SSC → PENDING_ASST_DIRECTOR    │    │
│  │         PENDING_ASST_DIRECTOR → PENDING_FINANCE_SEC     │    │
│  │         PENDING_FINANCE_SEC → PENDING_REGISTRAR         │    │
│  │         PENDING_REGISTRAR → PENDING_VC                  │    │
│  │         PENDING_VC → APPROVED                           │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 4. SPECIAL LOGIC: DIRECTOR SSC ASSIGNMENT               │    │
│  │    IF currentStatus == PENDING_DIRECTOR_SSC             │    │
│  │    AND action == APPROVE                                │    │
│  │    AND assignedAsstDirectorId provided                  │    │
│  │      → Set assigned_asst_director_id                    │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 5. UPDATE PROPOSAL                                      │    │
│  │    - Set current_status = nextStatus                    │    │
│  │    - If REJECT: Set rejection_reason                    │    │
│  │    - If DIRECTOR_SSC: Set assigned_asst_director_id     │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 6. LOG TO APPROVAL HISTORY                              │    │
│  │    - Insert action (APPROVED/REJECTED/RESUBMITTED)      │    │
│  │    - Store approver_id                                  │    │
│  │    - Store comments/rejection_reason                    │    │
│  │    - Timestamp                                          │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           ↓                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 7. RETURN RESPONSE                                      │    │
│  │    - success: true/false                                │    │
│  │    - message: Action description                        │    │
│  │    - proposal: Updated proposal object                  │    │
│  │    - nextStatus: New status                             │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  OUTPUT: Updated Proposal with new status                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Create Proposal Flow

```
President
    ↓
POST /proposals
    ↓
Authentication Middleware
    ├─ Verify JWT token
    └─ Extract user info
    ↓
Authorization Middleware
    ├─ Check role == PRESIDENT
    └─ Check user owns society
    ↓
createProposal()
    ├─ Validate input
    ├─ Fetch society (check coordinator_id)
    ├─ Determine initial status
    │  ├─ IF coordinator_id IS NOT NULL → PENDING_COORDINATOR
    │  └─ IF coordinator_id IS NULL → PENDING_DIRECTOR_SSC
    ├─ Insert proposal
    └─ Return proposalId + initialStatus
    ↓
Response (201 Created)
    ↓
Frontend updates UI
```

### Approval Flow

```
Approver (Coordinator/Director/AD/Finance/Registrar/VC)
    ↓
POST /proposals/next-status
    ├─ proposalId
    ├─ action (APPROVE/REJECT)
    └─ rejectionReason (if REJECT)
    ↓
Authentication Middleware
    ├─ Verify JWT token
    └─ Extract user info
    ↓
handleProposalStatusTransition()
    ├─ Fetch proposal + society
    ├─ Check authorization
    │  └─ Validate user role matches current status
    ├─ Determine next status
    ├─ Update proposal
    ├─ Log to approval_history
    └─ Return updated proposal
    ↓
Response (200 OK)
    ↓
Frontend updates UI
    ↓
Notification system (Future)
    └─ Email next approver
```

### Rejection & Resubmission Flow

```
Approver
    ↓
POST /proposals/next-status
    ├─ action: REJECT
    └─ rejectionReason: "..."
    ↓
handleProposalStatusTransition()
    ├─ Validate rejection reason provided
    ├─ Set status = RETURNED_FOR_REVISION
    ├─ Store rejection_reason
    ├─ Log to approval_history
    └─ Return updated proposal
    ↓
Response (200 OK)
    ↓
President sees rejection
    ├─ Views rejection_reason
    ├─ Edits proposal
    └─ Clicks "Resubmit"
    ↓
POST /proposals/next-status
    ├─ action: RESUBMIT
    └─ proposalId
    ↓
handleProposalStatusTransition()
    ├─ Check user is president
    ├─ Check status == RETURNED_FOR_REVISION
    ├─ Fetch society (check coordinator_id again)
    ├─ Determine next status
    │  ├─ IF coordinator_id IS NOT NULL → PENDING_COORDINATOR
    │  └─ IF coordinator_id IS NULL → PENDING_DIRECTOR_SSC
    ├─ Update status
    ├─ Log to approval_history
    └─ Return updated proposal
    ↓
Response (200 OK)
    ↓
Workflow restarts from beginning
```

---

## Database Relationships

```
users (1) ──────────────────────────────────────── (N) societies
          president_id                              (president)
          
users (1) ──────────────────────────────────────── (0..1) societies
          coordinator_id                            (coordinator)
          
societies (1) ──────────────────────────────────── (N) proposals
              society_id

proposals (1) ──────────────────────────────────── (N) proposal_attachments
              proposal_id

proposals (1) ──────────────────────────────────── (N) approval_history
              proposal_id

users (1) ──────────────────────────────────────── (N) approval_history
          approver_id

users (1) ──────────────────────────────────────── (0..1) proposals
          assigned_asst_director_id
```

---

## Status State Machine

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

## Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Role Hierarchy                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  VC (Vice Chancellor)                                            │
│  └─ Final approval authority                                     │
│     └─ Can approve/reject at PENDING_VC                          │
│                                                                   │
│  REGISTRAR                                                       │
│  └─ Academic authority                                           │
│     └─ Can approve/reject at PENDING_REGISTRAR                   │
│                                                                   │
│  FINANCE_SECRETARY                                               │
│  └─ Budget authority                                             │
│     └─ Can approve/reject at PENDING_FINANCE_SECRETARY           │
│                                                                   │
│  ASST_DIRECTOR (3 total)                                         │
│  └─ Operational authority                                        │
│     └─ Can approve/reject at PENDING_ASST_DIRECTOR               │
│     └─ Only if assigned to proposal                              │
│                                                                   │
│  DIRECTOR_SSC                                                    │
│  └─ SSC authority                                                │
│     └─ Can approve/reject at PENDING_DIRECTOR_SSC                │
│     └─ Can assign proposals to Assistant Directors               │
│                                                                   │
│  COORDINATOR (12 total)                                          │
│  └─ Society authority                                            │
│     └─ Can approve/reject at PENDING_COORDINATOR                 │
│     └─ Only for their assigned society                           │
│                                                                   │
│  PRESIDENT (14 total)                                            │
│  └─ Society authority                                            │
│     └─ Can create proposals                                      │
│     └─ Can resubmit after rejection                              │
│     └─ Can upload attachments                                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling Flow

```
Request
    ↓
┌─────────────────────────────────────────┐
│ Validation Layer                        │
├─────────────────────────────────────────┤
│ • Check required fields                 │
│ • Validate data types                   │
│ • Validate enum values                  │
└─────────────────────────────────────────┘
    ↓ (Error)
    └─→ 400 Bad Request
    ↓ (Valid)
┌─────────────────────────────────────────┐
│ Authentication Layer                    │
├─────────────────────────────────────────┤
│ • Check JWT token exists                │
│ • Verify token signature                │
│ • Extract user info                     │
└─────────────────────────────────────────┘
    ↓ (Error)
    └─→ 401 Unauthorized
    ↓ (Valid)
┌─────────────────────────────────────────┐
│ Authorization Layer                     │
├─────────────────────────────────────────┤
│ • Check user role                       │
│ • Check resource ownership              │
│ • Check assignment (for AD)             │
└─────────────────────────────────────────┘
    ↓ (Error)
    └─→ 403 Forbidden
    ↓ (Valid)
┌─────────────────────────────────────────┐
│ Business Logic Layer                    │
├─────────────────────────────────────────┤
│ • Fetch resources                       │
│ • Validate state transitions            │
│ • Execute workflow logic                │
└─────────────────────────────────────────┘
    ↓ (Error)
    └─→ 400/404/500 (Specific error)
    ↓ (Valid)
┌─────────────────────────────────────────┐
│ Database Layer                          │
├─────────────────────────────────────────┤
│ • Execute queries                       │
│ • Handle constraints                    │
│ • Manage transactions                   │
└─────────────────────────────────────────┘
    ↓ (Error)
    └─→ 500 Internal Server Error
    ↓ (Success)
    └─→ 200/201 Success Response
```

---

## Performance Considerations

### Database Indexes

```
users
  └─ PRIMARY KEY (id)
  └─ UNIQUE (email)

societies
  └─ PRIMARY KEY (id)
  └─ UNIQUE (name)
  └─ INDEX (president_id)
  └─ INDEX (coordinator_id)

proposals
  └─ PRIMARY KEY (id)
  └─ INDEX (society_id)
  └─ INDEX (current_status)
  └─ INDEX (assigned_asst_director_id)

proposal_attachments
  └─ PRIMARY KEY (id)
  └─ INDEX (proposal_id)

approval_history
  └─ PRIMARY KEY (id)
  └─ INDEX (proposal_id)
```

### Query Optimization

1. **Fetch Proposal with Society Details**
   ```sql
   SELECT p.*, s.coordinator_id, s.president_id 
   FROM proposals p 
   JOIN societies s ON p.society_id = s.id 
   WHERE p.id = ?
   ```
   - Single query instead of two
   - Uses indexes on both tables

2. **Connection Pooling**
   - 10 concurrent connections
   - Reuses connections
   - Reduces connection overhead

3. **Approval History**
   - Indexed on proposal_id
   - Efficient filtering and sorting
   - Immutable (no updates)

---

## Scalability Considerations

### Current Limitations
- Single MySQL instance
- No caching layer
- No message queue for notifications
- No file storage optimization

### Future Improvements
1. **Database Replication**
   - Master-slave setup
   - Read replicas for reporting

2. **Caching Layer**
   - Redis for session management
   - Cache frequently accessed data

3. **Message Queue**
   - RabbitMQ/Kafka for notifications
   - Async email sending

4. **File Storage**
   - AWS S3 for document storage
   - CDN for file delivery

5. **Load Balancing**
   - Multiple backend instances
   - Nginx reverse proxy

---

## Security Considerations

### Authentication
- JWT tokens with expiry
- Password hashing with bcryptjs
- Secure token storage

### Authorization
- Role-based access control
- Resource ownership validation
- Assignment verification

### Data Protection
- SQL injection prevention (parameterized queries)
- CORS configuration
- Input validation
- Error message sanitization

### Audit Trail
- All actions logged
- Immutable approval history
- Timestamp tracking
