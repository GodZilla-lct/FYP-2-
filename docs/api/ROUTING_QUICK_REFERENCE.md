# Campus Connect v4.0 - Routing Quick Reference

## 🚀 Quick Start

### Current Status
✅ **Routing is fully implemented and production-ready**

### Key Files
- `frontend/src/App.js` - Main routing configuration
- `frontend/src/components/layout/RequireAuth.jsx` - Auth guard
- `frontend/src/components/layout/MainShell.jsx` - Layout with navigation
- `frontend/src/components/layout/OutletPages.jsx` - Page wrappers

---

## 📍 Available Routes

### Public Routes (No Authentication Required)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/login` | LoginRoute | User login |
| `/forgot-password` | ForgotPassword | Password recovery |
| `/reset-password` | ResetPassword | Password reset with token |

### Protected Routes (Authentication Required)
| Route | Component | Access |
|-------|-----------|--------|
| `/dashboard` | DashboardPage | All users except SYSTEM_ADMIN |
| `/super-admin` | SuperAdminPage | SYSTEM_ADMIN only |
| `/societies` | SocietiesPage | Admin roles only |
| `/analytics` | AnalyticsPage | Admin roles only |
| `/budget` | BudgetPage | DIRECTOR_SSC only |
| `/calendar` | CalendarPage | All authenticated users |
| `/search` | SearchPage | All authenticated users |
| `/notifications` | NotificationsPage | All authenticated users |
| `/profile` | ProfilePage | All authenticated users |

---

## 🔐 Role-Based Access

### Admin Roles
- DIRECTOR_SSC
- ASST_DIRECTOR
- FINANCE_SECRETARY
- REGISTRAR
- VC

### Access Matrix
```
SYSTEM_ADMIN     → /super-admin only
DIRECTOR_SSC     → All routes except /super-admin
ASST_DIRECTOR    → All routes except /super-admin and /budget
FINANCE_SEC      → All routes except /super-admin and /budget
REGISTRAR        → All routes except /super-admin and /budget
VC               → All routes except /super-admin and /budget
SOCIETY_PRES     → /dashboard, /calendar, /search, /notifications, /profile
SOCIETY_MEMBER   → /dashboard, /calendar, /search, /notifications, /profile
```

---

## 🛠️ How to Add a New Route

### Step 1: Create the Page Component
```javascript
// frontend/src/components/reports/Reports.jsx
export default function Reports({ user }) {
  return (
    <div>
      <h1>Reports</h1>
      {/* Your component code */}
    </div>
  );
}
```

### Step 2: Create Page Wrapper in OutletPages.jsx
```javascript
// frontend/src/components/layout/OutletPages.jsx
import Reports from '../reports/Reports';

export function ReportsPage() {
  const { user } = useOutletContext();
  
  // Optional: Add role-based access control
  if (!ADMIN_ROLES.includes(user.role)) {
    return <AccessDenied />;
  }
  
  return <Reports user={user} />;
}
```

### Step 3: Add Route in App.js
```javascript
// frontend/src/App.js
import { ReportsPage } from './components/layout/OutletPages';

// Inside the MainShell Route section:
<Route path="/reports" element={<ReportsPage />} />
```

### Step 4: Add Navigation Link in MainShell.jsx
```javascript
// frontend/src/components/layout/MainShell.jsx
<NavLink to="/reports" className={navClass} title="View reports">
  Reports
</NavLink>
```

---

## 🔗 Navigation Examples

### Using NavLink (Recommended)
```javascript
import { NavLink } from 'react-router-dom';

// Basic usage
<NavLink to="/dashboard">Dashboard</NavLink>

// With active class
<NavLink 
  to="/dashboard" 
  className={({ isActive }) => isActive ? 'active' : ''}
>
  Dashboard
</NavLink>

// With inline styles
<NavLink 
  to="/dashboard"
  style={({ isActive }) => ({
    color: isActive ? 'blue' : 'black'
  })}
>
  Dashboard
</NavLink>
```

### Using Link (No Active State)
```javascript
import { Link } from 'react-router-dom';

<Link to="/dashboard">Go to Dashboard</Link>
```

### Programmatic Navigation
```javascript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/dashboard');
  };
  
  const handleBack = () => {
    navigate(-1); // Go back
  };
  
  const handleReplace = () => {
    navigate('/dashboard', { replace: true }); // Replace history
  };
  
  return (
    <button onClick={handleClick}>Go to Dashboard</button>
  );
}
```

---

## 🛡️ Protected Route Pattern

### Current Implementation
```javascript
// App.js
<Route element={<RequireAuth user={currentUser} />}>
  <Route element={<MainShell {...props} />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    {/* More protected routes */}
  </Route>
</Route>
```

### RequireAuth Component
```javascript
// RequireAuth.jsx
export default function RequireAuth({ user }) {
  const location = useLocation();
  
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  
  return <Outlet />;
}
```

---

## 📊 Accessing Route Data

### Get Current Location
```javascript
import { useLocation } from 'react-router-dom';

function MyComponent() {
  const location = useLocation();
  
  console.log(location.pathname); // "/dashboard"
  console.log(location.search);   // "?tab=active"
  console.log(location.hash);     // "#section"
  console.log(location.state);    // { from: "/login" }
}
```

### Get Route Parameters
```javascript
import { useParams } from 'react-router-dom';

// Route: /proposals/:id
function ProposalDetail() {
  const { id } = useParams();
  console.log(id); // "123"
}
```

### Get Search Parameters
```javascript
import { useSearchParams } from 'react-router-dom';

function MyComponent() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tab = searchParams.get('tab'); // "active"
  
  // Update search params
  setSearchParams({ tab: 'completed' });
}
```

### Access Outlet Context
```javascript
import { useOutletContext } from 'react-router-dom';

function ChildComponent() {
  const { user, onViewProposal } = useOutletContext();
  
  return <div>Welcome, {user.name}</div>;
}
```

---

## 🎨 Active Link Styling

### CSS Approach
```css
/* App.css */
.nav-link {
  color: #333;
  text-decoration: none;
  padding: 10px;
}

.nav-link.active {
  color: #007bff;
  font-weight: bold;
  border-bottom: 2px solid #007bff;
}
```

```javascript
<NavLink to="/dashboard" className="nav-link">
  Dashboard
</NavLink>
```

### Inline Style Approach
```javascript
<NavLink 
  to="/dashboard"
  style={({ isActive }) => ({
    color: isActive ? '#007bff' : '#333',
    fontWeight: isActive ? 'bold' : 'normal'
  })}
>
  Dashboard
</NavLink>
```

### Function Approach
```javascript
const navClass = ({ isActive }) => isActive ? 'active' : '';

<NavLink to="/dashboard" className={navClass}>
  Dashboard
</NavLink>
```

---

## 🔄 Redirects

### Declarative Redirect
```javascript
import { Navigate } from 'react-router-dom';

// Redirect to login
<Navigate to="/login" replace />

// Redirect with state
<Navigate to="/login" replace state={{ from: location.pathname }} />
```

### Conditional Redirect
```javascript
function DashboardPage() {
  const { user } = useOutletContext();
  
  if (user.role === 'SYSTEM_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }
  
  return <Dashboard user={user} />;
}
```

### Programmatic Redirect
```javascript
const navigate = useNavigate();

// Redirect
navigate('/dashboard');

// Redirect with replace
navigate('/dashboard', { replace: true });

// Redirect with state
navigate('/dashboard', { state: { from: 'login' } });
```

---

## 🧪 Testing Routes

### Manual Testing Checklist
- [ ] Direct URL navigation works
- [ ] Navigation links update URL
- [ ] Browser back/forward buttons work
- [ ] Page refresh maintains route
- [ ] Protected routes redirect to login
- [ ] Login redirects to intended destination
- [ ] Active link highlighting works
- [ ] Role-based access control enforced

### Test URLs
```
http://localhost:3000/login
http://localhost:3000/dashboard
http://localhost:3000/super-admin
http://localhost:3000/societies
http://localhost:3000/analytics
http://localhost:3000/calendar
http://localhost:3000/search
http://localhost:3000/notifications
http://localhost:3000/profile
http://localhost:3000/budget
```

---

## 🐛 Common Issues & Solutions

### Issue: 404 on page refresh
**Cause**: Server not configured to serve index.html for all routes  
**Solution**: Configure server (see deployment section)

### Issue: Active link not highlighting
**Cause**: Using `Link` instead of `NavLink`  
**Solution**: Use `NavLink` component

### Issue: Redirect loop
**Cause**: RequireAuth logic error  
**Solution**: Check user state is properly set

### Issue: Protected route accessible without login
**Cause**: Route not wrapped in RequireAuth  
**Solution**: Ensure route is inside `<Route element={<RequireAuth />}>`

### Issue: Navigation doesn't update URL
**Cause**: Using manual state instead of router  
**Solution**: Use `navigate()` or `<NavLink>`

---

## 📦 Build & Deploy

### Development
```bash
cd frontend
npm start
```

### Production Build
```bash
cd frontend
npm run build
```

### Deploy
```bash
# Serve build folder
npm install -g serve
serve -s build
```

---

## 📚 Additional Resources

### React Router Documentation
- [React Router v6 Docs](https://reactrouter.com/en/main)
- [Upgrading to v6](https://reactrouter.com/en/main/upgrading/v5)

### Project Documentation
- `PHASE_3_ROUTING_COMPLETE.md` - Detailed completion report
- `docs/ROUTING_ARCHITECTURE.md` - Architecture documentation
- `PHASE_3_EXECUTION_SUMMARY.md` - Execution summary

---

## 🎯 Best Practices

### ✅ DO
- Use `<NavLink>` for navigation with active states
- Use `<Link>` for simple navigation without active states
- Use `useNavigate()` for programmatic navigation
- Wrap protected routes in `<RequireAuth>`
- Use `<Outlet />` for nested routes
- Use `<Navigate />` for redirects
- Keep route definitions in one place (App.js)

### ❌ DON'T
- Don't use `window.location.href` for internal navigation
- Don't use `history.push()` (deprecated in v6)
- Don't use hash-based routing (`#/dashboard`)
- Don't manually manage view state for navigation
- Don't forget to configure server for SPA routing

---

**Last Updated**: April 17, 2026  
**Version**: 4.0  
**Status**: Production Ready
