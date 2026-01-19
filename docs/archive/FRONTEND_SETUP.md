# Frontend Setup & Running Guide

## Prerequisites
- Node.js (v14+) and npm installed
- Backend running on port 5000 (keep it running)

## Installation & Running

### Step 1: Install Frontend Dependencies
Open a **new PowerShell window** and navigate to the frontend folder:

```powershell
cd frontend
npm install
```

This will install React and all required dependencies.

### Step 2: Start the Frontend
In the same PowerShell window, run:

```powershell
npm start
```

The frontend will automatically open in your browser at `http://localhost:3000`

## What You'll See

### President Dashboard (Default View)
- Create new proposals with file uploads
- View all proposals with status indicators
- See rejection reasons if a proposal is returned
- Edit and resubmit rejected proposals

### Admin Hierarchy View
- Switch to "Admin View" button in the header
- Only accessible to Director SSC role
- Manage society presidents and coordinators
- Edit society hierarchy

## Testing the Workflow

### Test Data Available
- **President User**: ID 1, Society ID 1
- **Director SSC**: ID 8 (for admin access)
- **14 Societies**: Pre-seeded in database
- **3 Sample Proposals**: Already created

### Quick Test Steps
1. Create a new proposal in President Dashboard
2. Switch to Admin View to see society management
3. Check proposal status as it moves through the approval chain

## Troubleshooting

### Port 3000 Already in Use
If port 3000 is already in use, you can specify a different port:
```powershell
$env:PORT=3001; npm start
```

### Backend Connection Issues
- Ensure backend is running on port 5000
- Check that `.env` file has correct MySQL credentials
- Verify backend is responding: `http://localhost:5000/api/societies`

### Dependencies Installation Failed
Try clearing npm cache and reinstalling:
```powershell
npm cache clean --force
rm -r node_modules
npm install
```

## Project Structure
```
frontend/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── PresidentDashboard.jsx
│   │   ├── PresidentDashboard.css
│   │   ├── AdminHierarchy.jsx
│   │   └── AdminHierarchy.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── .gitignore
```

## API Endpoints Used
- `GET /api/proposals` - Fetch proposals
- `POST /api/proposals` - Create proposal
- `POST /api/proposals/next-status` - Update proposal status
- `GET /api/societies` - Fetch all societies
- `PUT /api/societies/:id` - Update society hierarchy
- `GET /api/users` - Fetch all users

## Notes
- The frontend uses a proxy to `http://localhost:5000` for API calls
- Mock authentication is used (no login required for MVP)
- File uploads are simulated (not actually stored)
