# Campus Connect - Complete Running Guide

## Overview
Campus Connect is a MERN stack university management portal with a complex approval workflow engine. This guide covers running both backend and frontend.

## System Requirements
- Node.js v14+ and npm
- MySQL Server running
- Two PowerShell windows (one for backend, one for frontend)

## Quick Start (5 minutes)

### Window 1: Backend Setup & Running

```powershell
# Navigate to project root
cd C:\Users\chahm\FYP

# Start backend (if not already running)
npm start
```

Expected output:
```
Server running on port 5000
Database connected successfully
```

### Window 2: Frontend Setup & Running

```powershell
# Navigate to frontend folder
cd C:\Users\chahm\FYP\frontend

# Install dependencies (first time only)
npm install

# Start frontend
npm start
```

Expected output:
```
Compiled successfully!
You can now view campus-connect-frontend in the browser.
  Local:            http://localhost:3000
```

## Accessing the Application

### Frontend URL
Open your browser and go to: **http://localhost:3000**

### Default Views

**President Dashboard** (Default)
- Create proposals with file uploads
- View proposal status
- Edit and resubmit rejected proposals

**Admin Hierarchy** (Click "Admin View" button)
- Manage society presidents and coordinators
- Only accessible to Director SSC role

## Database & Backend

### Database Status
- Database: `campus_connect`
- Tables: users, societies, proposals, proposal_attachments, approval_history
- Pre-seeded with 7 admin users, 14 societies, 3 sample proposals

### Backend API
- Base URL: `http://localhost:5000`
- API Endpoints: `/api/proposals`, `/api/societies`, `/api/users`
- Mock authentication (no login required for MVP)

## Testing the Workflow

### Scenario 1: Create a Proposal
1. Go to President Dashboard
2. Click "Create New Proposal"
3. Fill in details and upload documents
4. Submit - proposal enters approval chain

### Scenario 2: Manage Society Hierarchy
1. Click "Admin View" button
2. View all societies with presidents and coordinators
3. Click "Edit" to change assignments
4. Save changes

### Scenario 3: Handle Rejection
1. Create a proposal
2. If rejected, it shows "Returned for Revision" status
3. Click "Edit & Resubmit" to revise and resubmit

## Troubleshooting

### Backend Won't Start
```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000

# If in use, kill the process
taskkill /PID <PID> /F

# Then restart
npm start
```

### Frontend Won't Start
```powershell
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
cd frontend
rm -r node_modules
npm install

# Start again
npm start
```

### Database Connection Error
- Verify MySQL is running
- Check `.env` file has correct credentials:
  ```
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=qefjah-rufgy5-mawCed
  DB_NAME=campus_connect
  ```

### Port Already in Use
```powershell
# For frontend on different port
$env:PORT=3001; npm start

# For backend, edit server.js and change port
```

## File Structure

```
Campus Connect/
├── Backend Files
│   ├── server.js                    # Express server
│   ├── proposalRoutes.js            # API routes
│   ├── proposalWorkflowController.js # Workflow logic
│   ├── config/database.js           # MySQL connection
│   ├── middleware/auth.js           # Authentication
│   ├── schema.sql                   # Database schema
│   ├── seed.js                      # Database seeding
│   └── package.json
│
├── Frontend Files
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── PresidentDashboard.jsx
│       │   │   └── AdminHierarchy.jsx
│       │   ├── App.js
│       │   └── index.js
│       ├── public/
│       └── package.json
│
└── Documentation
    ├── README.md
    ├── ARCHITECTURE.md
    ├── INTEGRATION_GUIDE.md
    └── WORKFLOW_API_DOCUMENTATION.md
```

## Key Features

### Approval Workflow
1. **Submission** → Coordinator (if exists) or Director SSC
2. **Coordinator Approval** → Director SSC
3. **Director SSC Approval** → Assistant Director
4. **Assistant Director Approval** → Finance Secretary
5. **Finance Secretary Approval** → Registrar
6. **Registrar Approval** → VC
7. **VC Approval** → APPROVED

### Rejection Loop
- Any approver can reject with reason
- Status changes to "RETURNED_FOR_REVISION"
- President can edit and resubmit
- Resubmission restarts the workflow

### Dynamic Hierarchy
- Some societies have coordinators, some don't
- Workflow automatically skips coordinator step if not assigned
- Admin can manage society hierarchy

## Next Steps

1. **Test the workflow** - Create proposals and track them through approval chain
2. **Explore admin features** - Switch to admin view and manage societies
3. **Review documentation** - Check ARCHITECTURE.md and INTEGRATION_GUIDE.md
4. **Customize** - Modify components and styling as needed

## Support

For issues or questions, refer to:
- `ARCHITECTURE.md` - System design
- `INTEGRATION_GUIDE.md` - Frontend-backend integration
- `WORKFLOW_API_DOCUMENTATION.md` - API details
- `TEST_SCENARIOS.md` - Testing guide
