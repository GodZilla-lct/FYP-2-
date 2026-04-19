# 🏛️ UOG Hall & Venue Management - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    UOG VENUE MANAGEMENT SYSTEM                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ SYSTEM_ADMIN │     │  PRESIDENT   │     │   EVERYONE   │
│              │     │              │     │              │
│  Manage      │     │  Book        │     │  View        │
│  Venues      │     │  Venues      │     │  Calendar    │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  VenueManagement.jsx  │  SocietyDashboard.jsx  │  Calendar.jsx  │
│  (Admin UI)           │  (Venue Dropdown)      │  (Event View)  │
└──────────┬────────────┴──────────┬─────────────┴────────┬───────┘
           │                       │                      │
           │                       │                      │
           ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  /api/venues          │  /api/proposals      │  /api/calendar   │
│  - GET (all)          │  - POST (create)     │  - GET (events)  │
│  - POST (create)      │  - venue validation  │  - venue info    │
│  - PUT (update)       │  - conflict check    │                  │
│  - DELETE (remove)    │                      │                  │
│  - check-availability │                      │                  │
└──────────┬────────────┴──────────┬─────────────┴────────┬───────┘
           │                       │                      │
           │                       │                      │
           ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONTROLLER LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  venueController.js   │  proposalController.js │ calendarCtrl.js│
│  - getAllVenues()     │  - createProposal()    │ - getEvents()  │
│  - createVenue()      │  - venue validation    │ - show venue   │
│  - updateVenue()      │  - conflict detection  │                │
│  - deleteVenue()      │                        │                │
│  - checkAvailability()│                        │                │
└──────────┬────────────┴──────────┬─────────────┴────────┬───────┘
           │                       │                      │
           │                       │                      │
           ▼                       ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATABASE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐         ┌──────────────────┐             │
│  │  venues          │         │  proposals       │             │
│  ├──────────────────┤         ├──────────────────┤             │
│  │ id (PK)          │◄────────┤ venue_id (FK)    │             │
│  │ name             │         │ event_date       │             │
│  │ capacity         │         │ current_status   │             │
│  │ is_available     │         │ ...              │             │
│  │ created_at       │         └──────────────────┘             │
│  │ updated_at       │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. System Admin - Add New Venue

```
┌──────────────┐
│ System Admin │
└──────┬───────┘
       │ 1. Click "Add New Hall"
       ▼
┌─────────────────────┐
│ VenueManagement.jsx │
└──────┬──────────────┘
       │ 2. Fill form (name, capacity)
       │ 3. Submit
       ▼
┌─────────────────────┐
│ POST /api/venues    │
└──────┬──────────────┘
       │ 4. Validate input
       ▼
┌─────────────────────┐
│ venueController.js  │
└──────┬──────────────┘
       │ 5. Check duplicate name
       │ 6. Insert into database
       ▼
┌─────────────────────┐
│ venues table        │
└──────┬──────────────┘
       │ 7. Return success
       ▼
┌─────────────────────┐
│ UI updates          │
│ Venue appears       │
└─────────────────────┘
```

### 2. President - Create Proposal with Venue

```
┌──────────────┐
│  President   │
└──────┬───────┘
       │ 1. Click "Create Proposal"
       ▼
┌─────────────────────┐
│ SocietyDashboard    │
└──────┬──────────────┘
       │ 2. Load available venues
       │ GET /api/venues?availableOnly=true
       ▼
┌─────────────────────┐
│ Venue Dropdown      │
│ (Only available)    │
└──────┬──────────────┘
       │ 3. Select venue + date
       │ 4. Submit proposal
       ▼
┌─────────────────────┐
│ POST /api/proposals │
└──────┬──────────────┘
       │ 5. Validate venue exists
       │ 6. Check is_available = TRUE
       ▼
┌─────────────────────┐
│ MAGIC BLOCKER       │
│ Conflict Check      │
└──────┬──────────────┘
       │ 7. Query: SELECT * FROM proposals
       │    WHERE venue_id = ? AND event_date = ?
       │    AND current_status = 'APPROVED'
       ▼
┌─────────────────────┐
│ Conflict Found?     │
└──────┬──────────────┘
       │
       ├─ YES ──► ❌ Error: "Hall already booked"
       │
       └─ NO ───► ✅ Create proposal
                     Insert into proposals table
```

### 3. Everyone - View Calendar

```
┌──────────────┐
│   Any User   │
└──────┬───────┘
       │ 1. Go to Calendar tab
       ▼
┌─────────────────────┐
│ Calendar.jsx        │
└──────┬──────────────┘
       │ 2. Fetch events
       │ GET /api/calendar/events
       ▼
┌─────────────────────┐
│ calendarController  │
└──────┬──────────────┘
       │ 3. Query:
       │ SELECT p.*, v.name as venue_name
       │ FROM proposals p
       │ LEFT JOIN venues v ON p.venue_id = v.id
       │ WHERE p.current_status = 'APPROVED'
       ▼
┌─────────────────────┐
│ Display Events      │
│ - Society Name      │
│ - Venue Name        │
│ - Date              │
│ - Time              │
└─────────────────────┘
```

---

## Security & Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│                      ACCESS CONTROL MATRIX                       │
├─────────────────┬───────────────┬───────────────┬───────────────┤
│   FEATURE       │ SYSTEM_ADMIN  │  PRESIDENT    │   EVERYONE    │
├─────────────────┼───────────────┼───────────────┼───────────────┤
│ View Venues     │      ✅       │      ✅       │      ✅       │
│ Add Venue       │      ✅       │      ❌       │      ❌       │
│ Edit Venue      │      ✅       │      ❌       │      ❌       │
│ Delete Venue    │      ✅       │      ❌       │      ❌       │
│ Toggle Venue    │      ✅       │      ❌       │      ❌       │
│ Select Venue    │      ✅       │      ✅       │      ❌       │
│ View Calendar   │      ✅       │      ✅       │      ✅       │
│ Export Calendar │      ✅       │      ✅       │      ✅       │
└─────────────────┴───────────────┴───────────────┴───────────────┘
```

---

## Business Rules Engine

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUSINESS RULES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  RULE 1: No Double Booking                                      │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ IF (venue_id + event_date) EXISTS                      │    │
│  │ AND current_status = 'APPROVED'                        │    │
│  │ THEN REJECT with error message                         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  RULE 2: Only Available Venues                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ IF is_available = FALSE                                │    │
│  │ THEN Hide from dropdown                                │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  RULE 3: Cannot Delete Used Venues                              │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ IF venue_id EXISTS in proposals table                  │    │
│  │ THEN REJECT deletion                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  RULE 4: Workflow Preservation                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Venue selection happens at Stage 1 (Proposal Creation) │    │
│  │ 6-stage approval workflow remains unchanged            │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      venues          │
├──────────────────────┤
│ id (PK)              │◄──────────┐
│ name (UNIQUE)        │           │
│ capacity             │           │ Foreign Key
│ is_available         │           │ ON DELETE SET NULL
│ created_at           │           │
│ updated_at           │           │
└──────────────────────┘           │
                                   │
                                   │
┌──────────────────────┐           │
│     proposals        │           │
├──────────────────────┤           │
│ id (PK)              │           │
│ society_id (FK)      │           │
│ user_id (FK)         │           │
│ title                │           │
│ description          │           │
│ event_date           │           │
│ venue_id (FK) ───────┼───────────┘
│ budget_requested     │
│ current_status       │
│ created_at           │
│ updated_at           │
└──────────────────────┘

INDEXES:
- venues.name (UNIQUE)
- venues.is_available
- proposals.venue_id
- proposals.event_date
- proposals.current_status

CONSTRAINTS:
- venue_id REFERENCES venues(id) ON DELETE SET NULL
- If venue is deleted, proposals keep their data but venue_id becomes NULL
```

---

## API Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                         API ROUTES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  VENUE MANAGEMENT (SYSTEM_ADMIN only)                           │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ GET    /api/venues                  - Get all venues   │    │
│  │ GET    /api/venues?availableOnly=true - Available only │    │
│  │ POST   /api/venues                  - Create venue     │    │
│  │ PUT    /api/venues/:id              - Update venue     │    │
│  │ DELETE /api/venues/:id              - Delete venue     │    │
│  │ POST   /api/venues/check-availability - Check conflict │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  PROPOSAL CREATION (PRESIDENT)                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ POST   /api/proposals               - Create with venue│    │
│  │        Body: { venueId, eventDate, ... }               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  CALENDAR (EVERYONE)                                            │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ GET    /api/calendar/events         - Get events       │    │
│  │        Returns: { venue_name, ... }                    │    │
│  │ GET    /api/calendar/export         - Export to iCal   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App.js
│
├── MainShell
│   │
│   ├── SuperAdminDashboard (SYSTEM_ADMIN only)
│   │   │
│   │   ├── Tab: User Management
│   │   ├── Tab: Proposal Management
│   │   ├── Tab: Support Tickets
│   │   └── Tab: Venue Management ◄── NEW
│   │       └── VenueManagement.jsx
│   │           ├── Venue Table
│   │           ├── Add Modal
│   │           ├── Edit Modal
│   │           └── Delete Confirmation
│   │
│   ├── SocietyDashboard (PRESIDENT)
│   │   │
│   │   └── Create Proposal Form
│   │       ├── Title Input
│   │       ├── Description Textarea
│   │       ├── Event Date Picker
│   │       ├── Venue Dropdown ◄── NEW
│   │       └── Budget Input
│   │
│   └── Calendar (EVERYONE)
│       │
│       ├── Month View
│       │   └── Event Cards (with venue)
│       │
│       └── List View
│           └── Event Details (with venue)
│
└── Routes
    ├── /super-admin
    ├── /dashboard
    └── /calendar
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      PRODUCTION SETUP                            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   Web Browser    │
└────────┬─────────┘
         │ HTTPS
         ▼
┌──────────────────┐
│  React Frontend  │
│  (Port 3000)     │
└────────┬─────────┘
         │ REST API
         ▼
┌──────────────────┐
│  Node.js Backend │
│  (Port 5000)     │
└────────┬─────────┘
         │ MySQL
         ▼
┌──────────────────┐
│  MySQL Database  │
│  - venues        │
│  - proposals     │
│  - ...           │
└──────────────────┘

ENVIRONMENT VARIABLES:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- JWT_SECRET
```

---

## Performance Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                      OPTIMIZATION                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DATABASE INDEXES:                                              │
│  ✅ venues.name (UNIQUE) - Fast lookup by name                  │
│  ✅ venues.is_available - Fast filtering                        │
│  ✅ proposals.venue_id - Fast JOIN operations                   │
│  ✅ proposals.event_date - Fast conflict checks                 │
│  ✅ proposals.current_status - Fast APPROVED filtering          │
│                                                                  │
│  CACHING:                                                       │
│  - Venue list cached on frontend (refreshed on CRUD)           │
│  - Calendar events cached (refreshed on approval)              │
│                                                                  │
│  QUERY OPTIMIZATION:                                            │
│  - Conflict check uses indexed columns                         │
│  - Calendar query uses LEFT JOIN for venues                    │
│  - Available venues query uses WHERE is_available = TRUE       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**System Status: ✅ PRODUCTION READY**

All components architected, implemented, and documented!
