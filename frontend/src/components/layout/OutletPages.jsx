import { Navigate, useOutletContext } from 'react-router-dom';
import Dashboard from '../dashboard/Dashboard';
import Analytics from '../analytics/Analytics';
import Notifications from '../notifications/Notifications';
import SearchProposals from '../proposals/SearchProposals';
import Calendar from '../calendar/Calendar';
import BudgetManagement from '../budget/BudgetManagement';
import UserProfile from '../profile/UserProfile';
import ManageSocieties from '../admin/ManageSocieties';
import SuperAdminDashboard from '../admin/SuperAdminDashboard';

const SOCIETY_ADMIN_ROLES = ['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'];

function AccessDenied() {
  return (
    <div className="access-denied">
      <h2>Access Denied</h2>
      <p>You do not have permission to view this page.</p>
    </div>
  );
}

export function DashboardPage() {
  const { user, onViewProposal } = useOutletContext();
  if (user.role === 'SYSTEM_ADMIN') {
    return <Navigate to="/super-admin" replace />;
  }
  return <Dashboard user={user} onViewProposal={onViewProposal} />;
}

export function SuperAdminPage() {
  const { user } = useOutletContext();
  if (user.role !== 'SYSTEM_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  return <SuperAdminDashboard user={user} />;
}

export function SocietiesPage() {
  const { user } = useOutletContext();
  if (!SOCIETY_ADMIN_ROLES.includes(user.role)) {
    return <AccessDenied />;
  }
  return <ManageSocieties user={user} />;
}

export function AnalyticsPage() {
  const { user } = useOutletContext();
  if (!SOCIETY_ADMIN_ROLES.includes(user.role)) {
    return <AccessDenied />;
  }
  return <Analytics user={user} />;
}

export function NotificationsPage() {
  const { user } = useOutletContext();
  return <Notifications user={user} />;
}

export function SearchPage() {
  const { user } = useOutletContext();
  return <SearchProposals user={user} />;
}

export function CalendarPage() {
  const { user } = useOutletContext();
  return <Calendar user={user} />;
}

export function BudgetPage() {
  const { user } = useOutletContext();
  if (user.role !== 'DIRECTOR_SSC') {
    return <AccessDenied />;
  }
  return <BudgetManagement user={user} />;
}

export function ProfilePage() {
  const { user } = useOutletContext();
  return <UserProfile user={user} />;
}
