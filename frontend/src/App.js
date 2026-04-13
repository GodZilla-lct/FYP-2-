import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ProposalDetails from './components/proposals/ProposalDetails';
import RequireAuth from './components/layout/RequireAuth';
import MainShell from './components/layout/MainShell';
import {
  DashboardPage,
  SuperAdminPage,
  SocietiesPage,
  AnalyticsPage,
  NotificationsPage,
  SearchPage,
  CalendarPage,
  BudgetPage,
  ProfilePage,
} from './components/layout/OutletPages';
import { getCurrentUser, logout } from './utils/auth';
import { initializeSocket, disconnectSocket } from './utils/socket';
import { setupFetchInterceptor } from './utils/api';

function LoginRoute({ onLoggedIn }) {
  const navigate = useNavigate();
  useEffect(() => {
    const u = getCurrentUser();
    if (u) {
      navigate(u.role === 'SYSTEM_ADMIN' ? '/super-admin' : '/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleLogin = (u) => {
    onLoggedIn(u);
    navigate(u.role === 'SYSTEM_ADMIN' ? '/super-admin' : '/dashboard', { replace: true });
  };

  return <Login onLogin={handleLogin} />;
}

function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?unreadOnly=true', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_connect_token')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadNotifications(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, []);

  const fetchSystemSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/system/settings');
      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data);
      }
    } catch (err) {
      console.error('Failed to fetch system settings:', err);
    }
  }, []);

  useEffect(() => {
    setupFetchInterceptor();
    fetchSystemSettings();
  }, [fetchSystemSettings]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const token = localStorage.getItem('campus_connect_token');
      if (token) initializeSocket(token);
      fetchUnreadCount();
    }
    return () => disconnectSocket();
  }, [fetchUnreadCount]);

  const handleLogout = async () => {
    disconnectSocket();
    await logout();
    setCurrentUser(null);
    setSelectedProposalId(null);
  };

  const handleLoggedIn = (user) => {
    setCurrentUser(user);
    const token = localStorage.getItem('campus_connect_token');
    if (token) initializeSocket(token);
    fetchSystemSettings();
  };

  const handleProposalActionComplete = () => {
    setSelectedProposalId(null);
    fetchUnreadCount();
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginRoute onLoggedIn={handleLoggedIn} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<RequireAuth user={currentUser} />}>
          <Route
            element={
              <MainShell
                user={currentUser}
                systemSettings={systemSettings}
                unreadNotifications={unreadNotifications}
                onLogout={handleLogout}
                onViewProposal={setSelectedProposalId}
              />
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/super-admin" element={<SuperAdminPage />} />
            <Route path="/societies" element={<SocietiesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/budget" element={<BudgetPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />} />
        <Route path="*" element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />} />
      </Routes>

      {currentUser && selectedProposalId && (
        <ProposalDetails
          proposalId={selectedProposalId}
          user={currentUser}
          onClose={() => setSelectedProposalId(null)}
          onActionComplete={handleProposalActionComplete}
        />
      )}
    </>
  );
}

export default App;
