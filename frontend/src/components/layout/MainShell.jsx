import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import FeedbackModal from '../feedback/FeedbackModal';

/**
 * Authenticated chrome: banner, header nav, main outlet, feedback FAB.
 */
export default function MainShell({
  user,
  systemSettings,
  unreadNotifications,
  onLogout,
  onViewProposal,
}) {
  const navigate = useNavigate();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const bannerOffset = systemSettings?.announcement_text ? '48px' : '0';

  const navClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <div className="App">
      {systemSettings && systemSettings.announcement_text && (
        <div
          className={`w-full p-3 text-center text-white font-semibold ${systemSettings.announcement_color} fixed top-0 left-0 right-0 z-50`}
        >
          {systemSettings.announcement_text}
        </div>
      )}

      <header className="app-header" style={{ marginTop: bannerOffset }}>
        <h1>Campus Connect v4.0</h1>
        <div className="user-info">
          <span>
            {user.name} ({user.role})
          </span>
          <div className="header-actions">
            <div className="nav-menu">
              {user.role === 'SYSTEM_ADMIN' && (
                <NavLink to="/super-admin" className={navClass} title="Super Admin Control Panel">
                  Super Admin
                </NavLink>
              )}

              {user.role !== 'SYSTEM_ADMIN' && (
                <>
                  <NavLink to="/dashboard" className={navClass} title="View dashboard">
                    Dashboard
                  </NavLink>

                  {['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(user.role) && (
                    <NavLink to="/societies" className={navClass} title="View or manage societies">
                      Societies
                    </NavLink>
                  )}

                  {user.role === 'DIRECTOR_SSC' && (
                    <NavLink to="/budget" className={navClass} title="Budget allocation and management">
                      Budget
                    </NavLink>
                  )}

                  {['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(user.role) && (
                    <NavLink to="/analytics" className={navClass} title="View system analytics and reports">
                      Analytics
                    </NavLink>
                  )}

                  <NavLink to="/calendar" className={navClass} title="View event calendar">
                    Calendar
                  </NavLink>

                  <NavLink to="/search" className={navClass} title="Search proposals and users">
                    Search
                  </NavLink>

                  <NavLink
                    to="/notifications"
                    className={({ isActive }) => `notification-btn ${isActive ? 'active' : ''}`}
                    title="View notifications"
                  >
                    Notifications
                    {unreadNotifications > 0 && (
                      <span className="notification-badge">{unreadNotifications}</span>
                    )}
                  </NavLink>

                  <NavLink to="/profile" className={navClass} title="View and edit profile">
                    Profile
                  </NavLink>
                </>
              )}
            </div>

            <button
              type="button"
              className="logout-btn"
              onClick={() => {
                onLogout();
                navigate('/login', { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main" style={{ marginTop: bannerOffset }}>
        <Outlet context={{ user, onViewProposal }} />
      </main>

      {user.role !== 'SYSTEM_ADMIN' && (
        <>
          <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
          <button
            type="button"
            className="feedback-fab"
            onClick={() => setShowFeedbackModal(true)}
            title="Report an Issue / Feedback"
          >
            <span className="feedback-fab-icon" aria-hidden="true">
              &#128172;
            </span>
            <span className="feedback-fab-text">Feedback</span>
          </button>
        </>
      )}
    </div>
  );
}
