import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import AdminHierarchy from './components/AdminHierarchy';
import AdminDashboard from './components/AdminDashboard';
import Analytics from './components/Analytics';
import Notifications from './components/Notifications';
import SearchProposals from './components/SearchProposals';
import Calendar from './components/Calendar';
import BudgetManagement from './components/BudgetManagement';
import UserProfile from './components/UserProfile';
import ManageSocieties from './components/ManageSocieties';
import { getCurrentUser, clearAuthData, logout } from './utils/auth';
import { initializeSocket, disconnectSocket } from './utils/socket';
import { setupFetchInterceptor } from './utils/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard', 'admin', 'analytics', 'notifications', 'search', 'calendar', 'budget', 'profile'
  const [authView, setAuthView] = useState('login'); // 'login', 'forgot-password'
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Check for existing session on app load
  useEffect(() => {
    // Setup fetch interceptor for auto-logout on 401/403
    setupFetchInterceptor();
    
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      
      // Set initial view based on role
      const adminRoles = ['VC', 'REGISTRAR', 'FINANCE_SECRETARY', 'DIRECTOR_SSC', 'ASST_DIRECTOR'];
      if (adminRoles.includes(user.role)) {
        setView('dashboard'); // Admins see AdminOverviewDashboard
      } else if (user.canAccessSocietyDashboard) {
        setView('dashboard'); // Society leaders see SocietyDashboard
      }
      
      // Initialize WebSocket connection
      const token = localStorage.getItem('campus_connect_token');
      if (token) {
        initializeSocket(token);
      }
      
      // Fetch unread notifications count
      fetchUnreadCount();
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('campus_connect_token')}`,
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    
    // Initialize WebSocket connection
    const token = localStorage.getItem('campus_connect_token');
    if (token) {
      initializeSocket(token);
    }
    
    // Set initial view based on role - ALL users go to dashboard
    // Dashboard component will render appropriate view based on role
    setView('dashboard');
    setAuthView('login');
  };

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
    setCurrentUser(null);
    setView('dashboard');
    setAuthView('login');
  };

  const handleViewSwitch = (newView) => {
    setView(newView);
  };

  // Show auth screens if no user is logged in
  if (!currentUser) {
    if (authView === 'forgot-password') {
      return <ForgotPassword onBackToLogin={() => setAuthView('login')} />;
    }
    return (
      <Login 
        onLogin={handleLogin}
        onShowForgotPassword={() => setAuthView('forgot-password')}
      />
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Campus Connect v4.0</h1>
        <div className="user-info">
          <span>{currentUser.name} ({currentUser.role})</span>
          <div className="header-actions">
            {/* Navigation Menu - RBAC Enforced */}
            <div className="nav-menu">
              {/* DASHBOARD - Available to all authenticated users */}
              <button 
                onClick={() => handleViewSwitch('dashboard')}
                className={view === 'dashboard' ? 'active' : ''}
                title="View dashboard"
              >
                🏠 Dashboard
              </button>
              
              {/* MANAGE SOCIETIES - All admins can VIEW, only Director/Asst can EDIT */}
              {['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(currentUser.role) && (
                <button 
                  onClick={() => handleViewSwitch('societies')}
                  className={view === 'societies' ? 'active' : ''}
                  title="View or manage societies"
                >
                  🏛️ Societies
                </button>
              )}

              {/* BUDGET - Director SSC only */}
              {currentUser.role === 'DIRECTOR_SSC' && (
                <button 
                  onClick={() => handleViewSwitch('budget')}
                  className={view === 'budget' ? 'active' : ''}
                  title="Budget allocation and management"
                >
                  💰 Budget
                </button>
              )}

              {/* ANALYTICS - Admin roles only */}
              {['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(currentUser.role) && (
                <button 
                  onClick={() => handleViewSwitch('analytics')}
                  className={view === 'analytics' ? 'active' : ''}
                  title="View system analytics and reports"
                >
                  📊 Analytics
                </button>
              )}

              {/* CALENDAR - Available to all authenticated users */}
              <button 
                onClick={() => handleViewSwitch('calendar')}
                className={view === 'calendar' ? 'active' : ''}
                title="View event calendar"
              >
                📅 Calendar
              </button>

              {/* SEARCH - Available to all authenticated users */}
              <button 
                onClick={() => handleViewSwitch('search')}
                className={view === 'search' ? 'active' : ''}
                title="Search proposals and users"
              >
                🔍 Search
              </button>

              {/* NOTIFICATIONS - Available to all authenticated users */}
              <button 
                onClick={() => handleViewSwitch('notifications')}
                className={`notification-btn ${view === 'notifications' ? 'active' : ''}`}
                title="View notifications"
              >
                🔔 Notifications
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </button>

              {/* PROFILE - Available to all authenticated users */}
              <button 
                onClick={() => handleViewSwitch('profile')}
                className={view === 'profile' ? 'active' : ''}
                title="View and edit profile"
              >
                👤 Profile
              </button>
            </div>

            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* DASHBOARD - Dynamic rendering based on role */}
        {view === 'dashboard' && (
          <Dashboard user={currentUser} />
        )}
        
        {/* SOCIETIES - All admins can view, only Director/Asst can modify */}
        {view === 'societies' && ['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(currentUser.role) && (
          <ManageSocieties user={currentUser} />
        )}
        
        {view === 'analytics' && (
          <Analytics user={currentUser} />
        )}
        {view === 'notifications' && (
          <Notifications user={currentUser} />
        )}
        {view === 'search' && (
          <SearchProposals user={currentUser} />
        )}
        {view === 'calendar' && (
          <Calendar user={currentUser} />
        )}
        {view === 'budget' && currentUser.role === 'DIRECTOR_SSC' && (
          <BudgetManagement user={currentUser} />
        )}
        {view === 'profile' && (
          <UserProfile user={currentUser} />
        )}
      </main>
    </div>
  );
}

export default App;
