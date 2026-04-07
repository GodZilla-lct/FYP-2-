/**
 * Dashboard.jsx - Dynamic Role-Based Dashboard Router
 * 
 * This component dynamically renders different dashboard views based on user role:
 * - SOCIETY_LEADER (President, VP, GS) → SocietyPresidentDashboard
 * - Admin roles (VC, REGISTRAR, etc.) → AdminOverviewDashboard
 */

import { useMemo } from 'react';
import SocietyDashboard from './SocietyDashboard';
import AdminOverviewDashboard from './AdminOverviewDashboard';

const Dashboard = ({ user }) => {
  // Determine which dashboard to render based on user role
  const dashboardType = useMemo(() => {
    const adminRoles = ['VC', 'REGISTRAR', 'FINANCE_SECRETARY', 'DIRECTOR_SSC', 'ASST_DIRECTOR'];
    
    if (adminRoles.includes(user.role)) {
      return 'admin';
    }
    
    if (user.canAccessSocietyDashboard) {
      return 'society';
    }
    
    return 'none';
  }, [user.role, user.canAccessSocietyDashboard]);

  // Render appropriate dashboard
  switch (dashboardType) {
    case 'admin':
      return <AdminOverviewDashboard user={user} />;
    
    case 'society':
      return <SocietyDashboard user={user} />;
    
    case 'none':
    default:
      return (
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>You do not have permission to access the dashboard.</p>
          <p>Please contact the Director SSC office if you believe this is an error.</p>
        </div>
      );
  }
};

export default Dashboard;
