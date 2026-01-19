# Campus Connect - Frontend Integration Guide

## Overview
This guide explains how to integrate the new React components with the refactored backend API.

---

## 1. COMPONENT INTEGRATION

### PresidentDashboard Component

**Location:** `src/components/PresidentDashboard/PresidentDashboard.jsx`

**Props:**
```javascript
<PresidentDashboard 
  token={jwtToken}           // JWT authentication token
  userId={currentUserId}     // Current user ID
  societyId={societySocietyId} // Society ID for the president
/>
```

**Features:**
- Create new proposals
- Upload multiple files
- View all proposals
- Display rejection reasons
- Resubmit proposals

**API Calls:**
```javascript
// Fetch proposals
GET /api/proposals?societyId={societyId}

// Create proposal
POST /api/proposals
{
  societyId, title, description, eventDate, budgetRequested
}

// Upload attachment
POST /api/proposals/{proposalId}/attachments
{
  fileUrl, fileName
}

// Resubmit proposal
POST /api/proposals/next-status
{
  proposalId, action: 'RESUBMIT'
}
```

**Usage Example:**
```jsx
import PresidentDashboard from './components/PresidentDashboard/PresidentDashboard';

function App() {
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');
  const societyId = localStorage.getItem('societyId');

  return (
    <PresidentDashboard 
      token={token}
      userId={userId}
      societyId={societyId}
    />
  );
}
```

---

### AdminHierarchy Component

**Location:** `src/components/AdminHierarchy/AdminHierarchy.jsx`

**Props:**
```javascript
<AdminHierarchy 
  token={jwtToken}           // JWT authentication token
  userRole={currentUserRole} // Current user role (must be DIRECTOR_SSC)
/>
```

**Features:**
- View all societies
- Edit president assignment
- Edit coordinator assignment
- Remove coordinators (set to NULL)
- Real-time validation

**API Calls:**
```javascript
// Get all societies
GET /api/societies

// Get all users
GET /api/users

// Update society hierarchy
PUT /api/societies/{societyId}
{
  presidentId, coordinatorId
}
```

**Usage Example:**
```jsx
import AdminHierarchy from './components/AdminHierarchy/AdminHierarchy';

function App() {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (userRole !== 'DIRECTOR_SSC') {
    return <div>Access Denied</div>;
  }

  return <AdminHierarchy token={token} userRole={userRole} />;
}
```

---

## 2. ROUTING SETUP

### React Router Configuration

```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PresidentDashboard from './components/PresidentDashboard/PresidentDashboard';
import AdminHierarchy from './components/AdminHierarchy/AdminHierarchy';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* President Routes */}
        <Route
          path="/president/dashboard"
          element={
            <ProtectedRoute requiredRole="PRESIDENT">
              <PresidentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/hierarchy"
          element={
            <ProtectedRoute requiredRole="DIRECTOR_SSC">
              <AdminHierarchy />
            </ProtectedRoute>
          }
        />

        {/* Other routes... */}
      </Routes>
    </Router>
  );
}
```

---

## 3. AUTHENTICATION SETUP

### JWT Token Management

```javascript
// Login
async function login(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  // Store token and user info
  localStorage.setItem('token', data.token);
  localStorage.setItem('userId', data.user.id);
  localStorage.setItem('userRole', data.user.role);
  localStorage.setItem('societyId', data.user.societyId);

  return data;
}

// Logout
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
  localStorage.removeItem('societyId');
}

// Get token for API calls
function getToken() {
  return localStorage.getItem('token');
}
```

---

## 4. API CLIENT SETUP

### Axios Configuration

```javascript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Add token to all requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## 5. PROTECTED ROUTE COMPONENT

```jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
}

export default ProtectedRoute;
```

---

## 6. ENVIRONMENT VARIABLES

### `.env` File

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_FILE_UPLOAD_URL=https://storage.example.com
REACT_APP_MAX_FILE_SIZE=10485760
```

---

## 7. WORKFLOW INTEGRATION

### Complete Proposal Workflow

```javascript
// 1. President creates proposal
const createProposal = async (societyId, proposalData) => {
  const response = await apiClient.post('/proposals', {
    societyId,
    ...proposalData,
  });
  return response.data;
};

// 2. Upload files
const uploadFile = async (proposalId, file) => {
  const fileUrl = `https://storage.example.com/proposal_${proposalId}_${file.name}`;
  
  const response = await apiClient.post(`/proposals/${proposalId}/attachments`, {
    fileUrl,
    fileName: file.name,
  });
  return response.data;
};

// 3. Coordinator approves
const approveProposal = async (proposalId) => {
  const response = await apiClient.post('/proposals/next-status', {
    proposalId,
    action: 'APPROVE',
  });
  return response.data;
};

// 4. Director SSC approves and assigns AD
const directorApprove = async (proposalId, assignedAsstDirectorId) => {
  const response = await apiClient.post('/proposals/next-status', {
    proposalId,
    action: 'APPROVE',
    assignedAsstDirectorId,
  });
  return response.data;
};

// 5. Reject proposal
const rejectProposal = async (proposalId, rejectionReason) => {
  const response = await apiClient.post('/proposals/next-status', {
    proposalId,
    action: 'REJECT',
    rejectionReason,
  });
  return response.data;
};

// 6. President resubmits
const resubmitProposal = async (proposalId) => {
  const response = await apiClient.post('/proposals/next-status', {
    proposalId,
    action: 'RESUBMIT',
  });
  return response.data;
};
```

---

## 8. STATE MANAGEMENT (Redux Example)

### Actions

```javascript
// proposalActions.js
export const FETCH_PROPOSALS = 'FETCH_PROPOSALS';
export const CREATE_PROPOSAL = 'CREATE_PROPOSAL';
export const UPDATE_PROPOSAL_STATUS = 'UPDATE_PROPOSAL_STATUS';
export const FETCH_SOCIETIES = 'FETCH_SOCIETIES';
export const UPDATE_SOCIETY = 'UPDATE_SOCIETY';

export const fetchProposals = (societyId) => ({
  type: FETCH_PROPOSALS,
  payload: societyId,
});

export const createProposal = (proposalData) => ({
  type: CREATE_PROPOSAL,
  payload: proposalData,
});

export const updateProposalStatus = (proposalId, action, data) => ({
  type: UPDATE_PROPOSAL_STATUS,
  payload: { proposalId, action, data },
});
```

### Reducer

```javascript
// proposalReducer.js
const initialState = {
  proposals: [],
  loading: false,
  error: null,
};

export default function proposalReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_PROPOSALS:
      return { ...state, loading: true };
    case CREATE_PROPOSAL:
      return {
        ...state,
        proposals: [...state.proposals, action.payload],
      };
    case UPDATE_PROPOSAL_STATUS:
      return {
        ...state,
        proposals: state.proposals.map((p) =>
          p.id === action.payload.proposalId
            ? { ...p, current_status: action.payload.data.nextStatus }
            : p
        ),
      };
    default:
      return state;
  }
}
```

---

## 9. ERROR HANDLING

### Global Error Handler

```javascript
function handleApiError(error) {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return `Invalid request: ${data.error}`;
      case 401:
        return 'Unauthorized. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return `Error: ${data.error}`;
    }
  } else if (error.request) {
    return 'No response from server. Check your connection.';
  } else {
    return `Error: ${error.message}`;
  }
}
```

---

## 10. TESTING INTEGRATION

### Component Testing

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import PresidentDashboard from './PresidentDashboard';

describe('PresidentDashboard', () => {
  it('should render create proposal form', () => {
    render(
      <PresidentDashboard
        token="test-token"
        userId={1}
        societyId={1}
      />
    );

    expect(screen.getByText('President Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Create New Proposal')).toBeInTheDocument();
  });

  it('should submit proposal form', async () => {
    render(
      <PresidentDashboard
        token="test-token"
        userId={1}
        societyId={1}
      />
    );

    fireEvent.click(screen.getByText('Create New Proposal'));
    fireEvent.change(screen.getByLabelText('Proposal Title'), {
      target: { value: 'Test Proposal' },
    });
    fireEvent.click(screen.getByText('Create Proposal'));

    // Assert API call was made
  });
});
```

---

## 11. DEPLOYMENT CHECKLIST

- [ ] Backend API deployed and running
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Frontend components integrated
- [ ] Authentication working
- [ ] API endpoints tested
- [ ] Error handling implemented
- [ ] Styling applied
- [ ] Responsive design verified
- [ ] Performance optimized
- [ ] Security checks passed
- [ ] User acceptance testing completed

---

## 12. TROUBLESHOOTING

### Common Issues

**Issue:** 401 Unauthorized
- **Solution:** Check token is valid and not expired. Re-login if needed.

**Issue:** 403 Forbidden
- **Solution:** Verify user role has permission for the action.

**Issue:** CORS errors
- **Solution:** Check backend CORS configuration in `.env`

**Issue:** File upload fails
- **Solution:** Verify file size is within limit and format is allowed.

**Issue:** Proposal status not updating
- **Solution:** Check current status is valid for the action. Verify user role.

---

## 13. PERFORMANCE OPTIMIZATION

### Lazy Loading

```javascript
import { lazy, Suspense } from 'react';

const PresidentDashboard = lazy(() => 
  import('./components/PresidentDashboard/PresidentDashboard')
);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PresidentDashboard />
    </Suspense>
  );
}
```

### Memoization

```javascript
import { memo } from 'react';

const ProposalCard = memo(({ proposal, onResubmit }) => {
  return (
    // Component JSX
  );
});

export default ProposalCard;
```

---

## 14. ACCESSIBILITY

### ARIA Labels

```jsx
<button
  aria-label="Create new proposal"
  onClick={handleCreate}
>
  Create Proposal
</button>
```

### Semantic HTML

```jsx
<form onSubmit={handleSubmit}>
  <fieldset>
    <legend>Proposal Details</legend>
    {/* Form fields */}
  </fieldset>
</form>
```

---

## 15. QUICK START

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API URL
   ```

3. **Import components:**
   ```jsx
   import PresidentDashboard from './components/PresidentDashboard/PresidentDashboard';
   import AdminHierarchy from './components/AdminHierarchy/AdminHierarchy';
   ```

4. **Set up routing:**
   ```jsx
   <Route path="/president/dashboard" element={<PresidentDashboard />} />
   <Route path="/admin/hierarchy" element={<AdminHierarchy />} />
   ```

5. **Test integration:**
   - Create a proposal
   - Upload files
   - Approve/reject proposals
   - Update society hierarchy

---

**Version:** 0.2.0  
**Status:** Ready for Integration  
**Last Updated:** January 2026
