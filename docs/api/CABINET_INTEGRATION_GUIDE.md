# Cabinet Management Integration Guide

## Quick Start: Adding Cabinet Management to Your App

---

## Option 1: Add to Society Dashboard (Recommended)

### Step 1: Import the Component

In `frontend/src/components/dashboard/SocietyDashboard.jsx`:

```jsx
import CabinetManagement from '../societies/CabinetManagement';
```

### Step 2: Add Cabinet Tab

Add 'cabinet' to your tabs:

```jsx
const [activeTab, setActiveTab] = useState('proposals');

// In your tab navigation
<div className="dashboard-tabs">
  <button
    className={activeTab === 'proposals' ? 'active' : ''}
    onClick={() => setActiveTab('proposals')}
  >
    📝 Proposals
  </button>
  <button
    className={activeTab === 'drafts' ? 'active' : ''}
    onClick={() => setActiveTab('drafts')}
  >
    📄 Drafts
  </button>
  <button
    className={activeTab === 'cabinet' ? 'active' : ''}
    onClick={() => setActiveTab('cabinet')}
  >
    👥 Cabinet
  </button>
</div>
```

### Step 3: Render Cabinet Component

```jsx
{activeTab === 'cabinet' && (
  <CabinetManagement
    societyId={userSocietyId}
    societyName={societyName}
    userRole={user.role}
    isLeader={isUserCoreLeader}
  />
)}
```

### Step 4: Get Required Props

You'll need to determine:

```jsx
// Get user's society ID
const userSocietyId = user.societyRoles?.[0]?.society_id;

// Check if user is core leader
const isUserCoreLeader = user.societyRoles?.some(role => role.is_core_leader);
```

---

## Option 2: Standalone Page

### Step 1: Create Route

In your routing file (e.g., `App.js`):

```jsx
import CabinetManagement from './components/societies/CabinetManagement';

// Add route
<Route 
  path="/society/cabinet" 
  element={
    <ProtectedRoute>
      <CabinetPage />
    </ProtectedRoute>
  } 
/>
```

### Step 2: Create Page Component

```jsx
// CabinetPage.jsx
import { useAuth } from '../hooks/useAuth';
import CabinetManagement from '../components/societies/CabinetManagement';

function CabinetPage() {
  const { user } = useAuth();
  
  // Get user's society info
  const userSociety = user.societyRoles?.[0];
  const isLeader = user.societyRoles?.some(r => r.is_core_leader);
  
  if (!userSociety) {
    return (
      <div className="error-page">
        <h2>No Society Found</h2>
        <p>You are not assigned to any society.</p>
      </div>
    );
  }
  
  return (
    <div className="page-container">
      <CabinetManagement
        societyId={userSociety.society_id}
        societyName={userSociety.society_name}
        userRole={user.role}
        isLeader={isLeader}
      />
    </div>
  );
}

export default CabinetPage;
```

### Step 3: Add Navigation Link

In your navigation menu:

```jsx
<nav>
  <Link to="/dashboard">Dashboard</Link>
  <Link to="/proposals">Proposals</Link>
  <Link to="/society/cabinet">Cabinet</Link>
</nav>
```

---

## Complete Integration Example

### Full Society Dashboard Integration

```jsx
// SocietyDashboard.jsx
import { useState, useEffect } from 'react';
import './SocietyDashboard.css';
import CabinetManagement from '../societies/CabinetManagement';
import { getAuthHeaders } from '../../utils/auth';

const SocietyDashboard = ({ user, onViewProposal }) => {
  const [activeTab, setActiveTab] = useState('proposals');
  const [proposals, setProposals] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [societyInfo, setSocietyInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSocietyInfo();
    fetchProposals();
    fetchDrafts();
  }, []);

  const fetchSocietyInfo = async () => {
    try {
      const response = await fetch('/api/societies', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        // Find user's society
        const userSociety = data.societies?.find(society => 
          society.roles?.some(role => role.roll_number === user.roll_number)
        );
        
        if (userSociety) {
          setSocietyInfo({
            id: userSociety.id,
            name: userSociety.name,
            isLeader: userSociety.roles?.some(r => 
              r.roll_number === user.roll_number && r.is_core_leader
            )
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch society info:', err);
    }
  };

  const fetchProposals = async () => {
    // Your existing proposal fetching logic
  };

  const fetchDrafts = async () => {
    // Your existing draft fetching logic
  };

  return (
    <div className="society-dashboard">
      <div className="dashboard-header">
        <h1>{societyInfo?.name || 'Society'} Dashboard</h1>
        <div className="user-info">
          <span>{user.name} ({user.roll_number})</span>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'proposals' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('proposals')}
        >
          📝 Proposals ({proposals.length})
        </button>
        <button
          className={activeTab === 'drafts' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('drafts')}
        >
          📄 Drafts ({drafts.length})
        </button>
        <button
          className={activeTab === 'cabinet' ? 'tab-active' : 'tab'}
          onClick={() => setActiveTab('cabinet')}
        >
          👥 Cabinet
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'proposals' && (
          <div className="proposals-view">
            {/* Your existing proposals view */}
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="drafts-view">
            {/* Your existing drafts view */}
          </div>
        )}

        {activeTab === 'cabinet' && societyInfo && (
          <CabinetManagement
            societyId={societyInfo.id}
            societyName={societyInfo.name}
            userRole={user.role}
            isLeader={societyInfo.isLeader}
          />
        )}
      </div>
    </div>
  );
};

export default SocietyDashboard;
```

---

## Props Reference

### CabinetManagement Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `societyId` | number | Yes | ID of the society |
| `societyName` | string | Yes | Name of the society |
| `userRole` | string | Yes | User's system role (e.g., 'STUDENT', 'DIRECTOR_SSC') |
| `isLeader` | boolean | Yes | Whether user is a core leader of the society |

### Example Props

```jsx
<CabinetManagement
  societyId={1}
  societyName="Drama Society"
  userRole="STUDENT"
  isLeader={true}
/>
```

---

## Determining User's Society

### Method 1: From User Profile

```jsx
const userSociety = user.societyRoles?.[0];
const societyId = userSociety?.society_id;
const societyName = userSociety?.society_name;
const isLeader = userSociety?.is_core_leader;
```

### Method 2: From API Call

```jsx
const fetchUserSociety = async () => {
  const response = await fetch('/api/societies', {
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  const userSociety = data.societies?.find(society => 
    society.roles?.some(role => role.roll_number === user.roll_number)
  );
  
  return {
    id: userSociety.id,
    name: userSociety.name,
    isLeader: userSociety.roles?.some(r => 
      r.roll_number === user.roll_number && r.is_core_leader
    )
  };
};
```

---

## Styling Integration

### Option 1: Use Existing Styles

The component comes with its own CSS file that should work out of the box:

```jsx
import './CabinetManagement.css';
```

### Option 2: Override Styles

Add custom styles in your parent component:

```css
/* In your SocietyDashboard.css */
.cabinet-management {
  /* Override styles here */
}
```

### Option 3: Theme Integration

If you have a theme system:

```jsx
import { ThemeProvider } from 'styled-components';
import CabinetManagement from './CabinetManagement';

<ThemeProvider theme={yourTheme}>
  <CabinetManagement {...props} />
</ThemeProvider>
```

---

## Testing the Integration

### Step 1: Verify Backend is Running

```bash
# Check backend server
curl http://localhost:5001/health

# Test cabinet endpoint
curl -X GET http://localhost:5001/api/cabinet/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 2: Check Component Renders

```jsx
// Add console logs
console.log('Society ID:', societyId);
console.log('Society Name:', societyName);
console.log('User Role:', userRole);
console.log('Is Leader:', isLeader);
```

### Step 3: Test Functionality

1. ✅ Component loads without errors
2. ✅ Cabinet members list displays
3. ✅ Add form appears (if authorized)
4. ✅ Can add new member
5. ✅ Can edit existing member
6. ✅ Can delete member
7. ✅ Search works
8. ✅ Year filter works

---

## Common Issues & Solutions

### Issue: "Cannot read property 'id' of undefined"

**Cause:** Society info not loaded yet

**Solution:** Add loading check

```jsx
{societyInfo ? (
  <CabinetManagement
    societyId={societyInfo.id}
    societyName={societyInfo.name}
    userRole={user.role}
    isLeader={societyInfo.isLeader}
  />
) : (
  <div>Loading society information...</div>
)}
```

### Issue: "Add Member button not showing"

**Cause:** User not authorized

**Solution:** Check isLeader prop

```jsx
// Debug
console.log('Is Leader:', isLeader);
console.log('User Role:', userRole);

// Ensure isLeader is boolean
const isLeader = Boolean(user.societyRoles?.some(r => r.is_core_leader));
```

### Issue: "API calls failing with 401"

**Cause:** Authentication token not included

**Solution:** Verify api utility is used

```jsx
// The service already uses the api utility
import { api } from '../utils/api';

// Which automatically includes auth headers
const response = await api.get('/cabinet/1');
```

### Issue: "Styles not applied"

**Cause:** CSS file not imported

**Solution:** Import CSS in component

```jsx
import './CabinetManagement.css';
```

---

## Performance Tips

### 1. Lazy Load Component

```jsx
import { lazy, Suspense } from 'react';

const CabinetManagement = lazy(() => 
  import('../societies/CabinetManagement')
);

// In render
<Suspense fallback={<div>Loading...</div>}>
  <CabinetManagement {...props} />
</Suspense>
```

### 2. Memoize Props

```jsx
import { useMemo } from 'react';

const cabinetProps = useMemo(() => ({
  societyId: societyInfo.id,
  societyName: societyInfo.name,
  userRole: user.role,
  isLeader: societyInfo.isLeader
}), [societyInfo, user]);

<CabinetManagement {...cabinetProps} />
```

### 3. Debounce Search

Already implemented in the component, but you can adjust the delay if needed.

---

## Next Steps

1. ✅ Integrate component into your app
2. ✅ Test with different user roles
3. ✅ Customize styling if needed
4. ✅ Add navigation links
5. ✅ Train users on new feature
6. ✅ Monitor usage and feedback

---

**Last Updated:** April 17, 2026  
**Version:** 1.0
