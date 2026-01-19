# Campus Connect MVP - Setup Guide

## Project Structure

```
campus-connect/
├── backend/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── middleware/
│   │   └── auth.js              # Authentication & authorization
│   ├── controllers/
│   │   └── proposalWorkflowController.js
│   ├── routes/
│   │   └── proposalRoutes.js
│   ├── schema.sql               # Database schema
│   ├── seed.js                  # Database seeding script
│   ├── server.js                # Express server entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── PresidentPortal/
│   │   │   │   ├── CreateProposal.jsx
│   │   │   │   ├── ProposalStatus.jsx
│   │   │   │   └── RejectionReason.jsx
│   │   │   └── SSCAdminPanel/
│   │   │       └── EditSocietyHierarchy.jsx
│   │   └── App.jsx
│   └── package.json
└── WORKFLOW_API_DOCUMENTATION.md
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install express mysql2 bcryptjs jsonwebtoken dotenv cors
npm install --save-dev nodemon
```

### 2. Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE campus_connect;
USE campus_connect;
```

Then run the schema:
```bash
mysql -u root -p campus_connect < schema.sql
```

### 3. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Update `.env` with your database credentials:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=campus_connect
JWT_SECRET=your_secret_key
```

### 4. Seed Database

```bash
node seed.js
```

Expected output:
```
Starting database seeding...
Seeding users...
Seeding societies...
Seeding sample proposals...
✓ Database seeding completed successfully!
```

### 5. Create Database Connection Pool

Create `config/database.js`:
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
```

### 6. Create Authentication Middleware

Create `middleware/auth.js`:
```javascript
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function authorize(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
```

### 7. Create Express Server

Create `server.js`:
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const proposalRoutes = require('./routes/proposalRoutes');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Routes
app.use('/proposals', proposalRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 8. Update package.json

```json
{
  "name": "campus-connect-backend",
  "version": "0.1.0",
  "description": "Campus Connect University Management Portal",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node seed.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.20"
  }
}
```

### 9. Run Backend

```bash
npm run dev
```

Expected output:
```
Server running on port 5000
```

---

## Testing the Workflow

### Test 1: Create Proposal (Society WITH Coordinator)

```bash
curl -X POST http://localhost:5000/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "societyId": 1,
    "title": "Debate Championship",
    "description": "Annual debate competition",
    "eventDate": "2026-03-15",
    "budgetRequested": 5000
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "proposalId": 1,
  "initialStatus": "PENDING_COORDINATOR"
}
```

### Test 2: Create Proposal (Society WITHOUT Coordinator)

```bash
curl -X POST http://localhost:5000/proposals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "societyId": 3,
    "title": "Football Tournament",
    "description": "Campus-wide football tournament",
    "eventDate": "2026-04-20",
    "budgetRequested": 8000
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Proposal created successfully",
  "proposalId": 2,
  "initialStatus": "PENDING_DIRECTOR_SSC"
}
```

Note: Status is `PENDING_DIRECTOR_SSC` (skips coordinator) because Sports Club has no coordinator.

### Test 3: Approve Proposal

```bash
curl -X POST http://localhost:5000/proposals/next-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer COORDINATOR_JWT_TOKEN" \
  -d '{
    "proposalId": 1,
    "action": "APPROVE"
  }'
```

### Test 4: Reject Proposal

```bash
curl -X POST http://localhost:5000/proposals/next-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer FINANCE_SECRETARY_JWT_TOKEN" \
  -d '{
    "proposalId": 1,
    "action": "REJECT",
    "rejectionReason": "Budget exceeds allocated funds. Please revise."
  }'
```

### Test 5: Resubmit Proposal

```bash
curl -X POST http://localhost:5000/proposals/next-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PRESIDENT_JWT_TOKEN" \
  -d '{
    "proposalId": 1,
    "action": "RESUBMIT"
  }'
```

---

## Frontend Integration Points

### President Portal - Create Proposal
```javascript
const createProposal = async (formData) => {
  const response = await fetch('/proposals', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      societyId: formData.societyId,
      title: formData.title,
      description: formData.description,
      eventDate: formData.eventDate,
      budgetRequested: formData.budget
    })
  });
  return response.json();
};
```

### President Portal - View Status
```javascript
const getProposalStatus = async (proposalId) => {
  const response = await fetch(`/proposals/${proposalId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

### SSC Admin - Edit Society Hierarchy
```javascript
const updateSocietyHierarchy = async (societyId, presidentId, coordinatorId) => {
  const response = await fetch(`/societies/${societyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      president_id: presidentId,
      coordinator_id: coordinatorId
    })
  });
  return response.json();
};
```

---

## Key Implementation Details

### 1. Coordinator Check Logic
The system checks `coordinator_id` at two points:
- **Proposal Creation:** Determines initial status
- **Resubmission:** Determines status after revision

### 2. Status Transitions
Use the switch/case in `getNextStatus()` to determine the next status based on current status.

### 3. Authorization
Each endpoint validates:
- User role matches current proposal status
- For Assistant Directors: Proposal is assigned to them
- For Presidents: They own the society

### 4. Audit Trail
Every action is logged in `approval_history` for compliance and debugging.

---

## Database Queries for Common Tasks

### Get all proposals for a society
```sql
SELECT * FROM proposals WHERE society_id = ? ORDER BY created_at DESC;
```

### Get pending proposals for a specific role
```sql
SELECT p.* FROM proposals p
WHERE p.current_status = 'PENDING_DIRECTOR_SSC'
ORDER BY p.created_at ASC;
```

### Get approval history for a proposal
```sql
SELECT ah.*, u.name, u.role FROM approval_history ah
JOIN users u ON ah.approver_id = u.id
WHERE ah.proposal_id = ?
ORDER BY ah.created_at DESC;
```

### Get societies without coordinators
```sql
SELECT * FROM societies WHERE coordinator_id IS NULL;
```

---

## Next Steps for Full Implementation

1. **Frontend Components:** Build React components for President Portal and SSC Admin Panel
2. **Authentication:** Implement JWT login endpoint
3. **File Upload:** Integrate cloud storage (AWS S3, Google Cloud Storage)
4. **Notifications:** Add email/SMS notifications for approvers
5. **Dashboard:** Create analytics dashboard for SSC admins
6. **Testing:** Write unit and integration tests
7. **Deployment:** Set up CI/CD pipeline and deploy to production
