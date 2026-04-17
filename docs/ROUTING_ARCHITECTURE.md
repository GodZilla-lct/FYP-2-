# Campus Connect v4.0 - Routing Architecture

## Overview

This document describes the complete routing architecture implemented using `react-router-dom` v6.

---

## Visual Route Tree

```
┌─────────────────────────────────────────────────────────────┐
│                      BrowserRouter                          │
│                     (App.js Root)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─── PUBLIC ROUTES
                            │    │
                            │    ├─── /login
                            │    │    └─── LoginRoute Component
                            │    │         ├─── Auto-redirect if logged in
                            │    │         └─── Handles login success
                            │    │
                            │    ├─── /forgot-password
                            │    │    └─── ForgotPassword Component
                            │    │
                            │    └─── /reset-password
                            │         └─── ResetPassword Component
                            │
                            └─── PROTECTED ROUTES
                                 │
                                 └─── <RequireAuth> (Auth Guard)
                                      │
                                      ├─── Checks: user object exists
                                      ├─── If NO: → Navigate to /login
                                      └─── If YES: → Render <Outlet />
                                           │
                                           └─── <MainShell> (Layout)
                                                │
                                                ├─── Header with Navigation
                                                ├─── User Info Display
                                                ├─── Logout Button
                                                └─── <Outlet /> for Pages
                                                     │
                                                     ├─── /dashboard
                                                     │    └─── DashboardPage
                                                     │         ├─── Role check
                                                     │         └─── Dashboard Component
                                                     │
                                                     ├─── /super-admin
                                                     │    └─── SuperAdminPage
                                                     │         ├─── SYSTEM_ADMIN only
                                                     │         └─── SuperAdminDashboard
                                                     │
                                                     ├─── /societies
                                                     │    └─── SocietiesPage
                                                     │         ├─── Admin roles only
                                                     │         └─── ManageSocieties
                                                     │
                                                     ├─── /analytics
                                                     │    └─── AnalyticsPage
                                                     │         ├─── Admin roles only
                                                     │         └─── Analytics Component
                                                     │
                                                     ├─── /notifications
                                                     │    └─── NotificationsPage
                                                     │         └─── Notifications Component
                                                     │
                                                     ├─── /search
                                                     │    └─── SearchPage
                                                     │         └─── SearchProposals
                                                     │
                                                     ├─── /calendar
                                                     │    └─── CalendarPage
                                                     │         └─── Calendar Component
                                                     │
                                                     ├─── /budget
                                                     │    └─── BudgetPage
                                                     │         ├─── DIRECTOR_SSC only
                                                     │         └─── BudgetManagement
                                                     │
                                                     └─── /profile
                                                          └─── ProfilePage
                                                               └─── UserProfile Component
```

---

## Authentication Flow Diagram

```
┌──────────────┐
│ User visits  │
│   any URL    │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ Is route public?│
│ (/login, etc.)  │
└────┬────────┬───┘
     │        │
    YES      NO
     │        │
     │        ▼
     │   ┌──────────────┐
     │   │ RequireAuth  │
     │   │   checks     │
     │   └──────┬───────┘
     │          │
     │          ▼
     │   ┌──────────────────┐
     │   │ User object      │
     │   │   exists?        │
     │   └────┬────────┬────┘
     │       YES      NO
     │        │        │
     │        │        ▼
     │        │   ┌─────────────────┐
     │        │   │ Navigate to     │
     │        │   │ /login with     │
     │        │   │ return path     │
     │        │   └─────────────────┘
     │        │
     │        ▼
     │   ┌──────────────────┐
     │   │ Render MainShell │
     │   │ with navigation  │
     │   └────┬─────────────┘
     │        │
     │        ▼
     │   ┌──────────────────┐
     │   │ Render page via  │
     │   │   <Outlet />     │
     │   └──────────────────┘
     │
     ▼
┌──────────────────┐
│ Render public    │
│ page directly    │
└──────────────────┘
```

---

## Navigation Flow

### User Clicks Navigation Link

```
User clicks <NavLink to="/analytics">
           │
           ▼
React Router intercepts click
           │
           ▼
Updates browser URL to /analytics
           │
           ▼
Matches route in <Routes>
           │
           ▼
RequireAuth checks authentication
           │
           ▼
MainShell renders with updated context
           │
           ▼
<Outlet /> renders AnalyticsPage
           │
           ▼
Analytics component displays
           │
           ▼
NavLink gets 'active' class automatically
```

---

## Role-Based Access Control

### Access Control Layers

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: RequireAuth (Authentication)                  │
│ ├─── Checks: User logged in?                           │
│ └─── Action: Redirect to /login if not                 │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: MainShell Navigation (UI Visibility)          │
│ ├─── Checks: User role                                 │
│ └─── Action: Show/hide nav links based on role         │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Page Component (Authorization)                │
│ ├─── Checks: User has required role                    │
│ └─── Action: Show content or "Access Denied"           │
└─────────────────────────────────────────────────────────┘
```

### Role Matrix

| Role | Dashboard | Super Admin | Societies | Analytics | Budget | Calendar | Search | Notifications | Profile |
|------|-----------|-------------|-----------|-----------|--------|----------|--------|---------------|---------|
| SYSTEM_ADMIN | ❌ (→ /super-admin) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| DIRECTOR_SSC | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ASST_DIRECTOR | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| FINANCE_SECRETARY | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| REGISTRAR | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| VC | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| SOCIETY_PRESIDENT | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| SOCIETY_MEMBER | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

---

## Component Responsibilities

### App.js
- **Purpose**: Root routing configuration
- **Responsibilities**:
  - Define all routes
  - Manage global state (user, notifications, settings)
  - Handle login/logout callbacks
  - Initialize socket connections
  - Fetch system settings

### RequireAuth.jsx
- **Purpose**: Authentication guard
- **Responsibilities**:
  - Check if user is authenticated
  - Redirect to login if not
  - Preserve intended destination
  - Render child routes if authenticated

### MainShell.jsx
- **Purpose**: Authenticated layout wrapper
- **Responsibilities**:
  - Render header with navigation
  - Display user info
  - Show system announcements
  - Provide logout functionality
  - Render feedback button
  - Pass context to child routes via Outlet

### OutletPages.jsx
- **Purpose**: Page component wrappers
- **Responsibilities**:
  - Extract user from outlet context
  - Perform role-based access checks
  - Render appropriate page component
  - Handle role-based redirects

---

## Data Flow

### Context Propagation

```
App.js State
    │
    ├─── currentUser
    ├─── unreadNotifications
    ├─── systemSettings
    └─── onViewProposal callback
         │
         ▼
    MainShell Props
         │
         ├─── user
         ├─── unreadNotifications
         ├─── systemSettings
         ├─── onLogout
         └─── onViewProposal
              │
              ▼
         Outlet Context
              │
              ├─── user
              └─── onViewProposal
                   │
                   ▼
              Page Components
              (via useOutletContext)
```

---

## URL Structure

### Public URLs
- `https://campus-connect.com/login`
- `https://campus-connect.com/forgot-password`
- `https://campus-connect.com/reset-password`

### Protected URLs
- `https://campus-connect.com/dashboard`
- `https://campus-connect.com/super-admin`
- `https://campus-connect.com/societies`
- `https://campus-connect.com/analytics`
- `https://campus-connect.com/notifications`
- `https://campus-connect.com/search`
- `https://campus-connect.com/calendar`
- `https://campus-connect.com/budget`
- `https://campus-connect.com/profile`

### Special Routes
- `https://campus-connect.com/` → Redirects to `/dashboard` or `/login`
- `https://campus-connect.com/*` (404) → Redirects to `/dashboard` or `/login`

---

## Browser Integration

### History API
- Uses `BrowserRouter` (HTML5 History API)
- Clean URLs without hash (#)
- Browser back/forward buttons work correctly
- Bookmarkable URLs

### Active Link Styling
```javascript
// Automatic active class
<NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
  Dashboard
</NavLink>

// CSS applies automatically when route matches
.active {
  background-color: #007bff;
  color: white;
}
```

---

## Error Handling

### 404 Not Found
```javascript
<Route path="*" element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />} />
```

### Unauthorized Access
```javascript
// In OutletPages.jsx
if (!SOCIETY_ADMIN_ROLES.includes(user.role)) {
  return <AccessDenied />;
}
```

### Authentication Failure
```javascript
// In RequireAuth.jsx
if (!user) {
  return <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
```

---

## Performance Considerations

### Current Implementation
- All routes loaded in main bundle
- No code splitting
- Bundle size: ~88 kB (gzipped)

### Future Optimizations
```javascript
// Lazy loading example
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));

<Route 
  path="/dashboard" 
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardPage />
    </Suspense>
  } 
/>
```

---

## Testing Strategy

### Manual Testing
- [x] Direct URL navigation
- [x] Navigation link clicks
- [x] Browser back/forward
- [x] Page refresh on protected routes
- [x] Login redirect flow
- [x] Logout redirect flow
- [x] Role-based access control

### Automated Testing (Future)
```javascript
// Example test
test('redirects to login when not authenticated', () => {
  render(<App />);
  expect(window.location.pathname).toBe('/login');
});

test('shows dashboard after login', async () => {
  const { getByText } = render(<App />);
  // ... login flow
  await waitFor(() => {
    expect(window.location.pathname).toBe('/dashboard');
  });
});
```

---

## Deployment Considerations

### Server Configuration
For production deployment, configure server to serve `index.html` for all routes:

**Nginx**:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

**Apache** (`.htaccess`):
```apache
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Netlify** (`_redirects`):
```
/*    /index.html   200
```

---

## Migration Notes

### Before (State-Based)
```javascript
// OLD: Manual state management
const [currentView, setCurrentView] = useState('dashboard');

if (currentView === 'dashboard') return <Dashboard />;
if (currentView === 'analytics') return <Analytics />;

<button onClick={() => setCurrentView('analytics')}>Analytics</button>
```

### After (Router-Based)
```javascript
// NEW: React Router
<Routes>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/analytics" element={<Analytics />} />
</Routes>

<NavLink to="/analytics">Analytics</NavLink>
```

---

## Troubleshooting

### Issue: 404 on page refresh
**Solution**: Configure server to serve index.html for all routes

### Issue: Active link not highlighting
**Solution**: Use `NavLink` instead of `Link`, ensure CSS class is defined

### Issue: Redirect loop
**Solution**: Check RequireAuth logic, ensure user state is properly set

### Issue: Protected route accessible without login
**Solution**: Verify RequireAuth wraps the route, check user object

---

**Last Updated**: April 17, 2026  
**Version**: 4.0  
**Status**: Production Ready
