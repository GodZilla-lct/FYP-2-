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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const bannerOffset = systemSettings?.announcement_text ? '48px' : '0';

  const navClass = ({ isActive }) => (isActive ? 'active' : '');

  return (
    <div className="App">
      {systemSettings && systemSettings.announcement_text && (
        <div className={`app-announcement app-announcement--${systemSettings.announcement_color}`}>
          {systemSettings.announcement_text}
        </div>
      )}

      <header className="app-header" style={{ marginTop: bannerOffset }}>
        <div className="app-header__inner">
          <div className="app-header__brand">
            <button
              aria-label="Toggle navigation"
              className="app-header__menu-toggle"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              <svg className="app-header__menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="app-header__title">Campus Connect v4.0</h1>
          </div>

          <div className="app-header__mobile-meta">
            <div className="app-header__user app-header__user--mobile">
              <div className="user-info user-info--compact">
                <div className="user-info__name">{user.name}</div>
                <div className="user-info__role">{user.role}</div>
              </div>
            </div>

            <button
              type="button"
              className="logout-btn app-header__logout app-header__logout--mobile"
              onClick={() => {
                onLogout();
                navigate('/login', { replace: true });
              }}
            >
              Logout
            </button>
          </div>

          <div className="app-header__user app-header__user--desktop">
            <div className="user-info">
              <div className="user-info__name">{user.name}</div>
              <div className="user-info__role">{user.role}</div>
            </div>
          </div>

          <div className="app-header__actions">
            <div className="app-header__nav app-header__nav--desktop">
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

                    {['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC', 'COORDINATOR'].includes(user.role) && (
                      <NavLink to="/societies" className={navClass} title="View or manage societies">
                        Societies
                      </NavLink>
                    )}

                    {user.role === 'DIRECTOR_SSC' && (
                      <NavLink to="/budget" className={navClass} title="Budget allocation and management">
                        Budget
                      </NavLink>
                    )}

                    {user.role === 'DIRECTOR_SSC' && (
                      <NavLink to="/staff-tools" className={navClass} title="User activity, bulk import, account status">
                        Staff tools
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
            </div>

            <button
              type="button"
              className="logout-btn app-header__logout app-header__logout--desktop"
              onClick={() => {
                onLogout();
                navigate('/login', { replace: true });
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className={`app-drawer ${mobileNavOpen ? 'app-drawer--open' : ''}`} aria-hidden={!mobileNavOpen}>
          <div className="app-drawer__backdrop" onClick={() => setMobileNavOpen(false)} />
          <nav className="app-drawer__panel">
            <div className="app-drawer__header">
              <div className="app-drawer__title">Menu</div>
              <button onClick={() => setMobileNavOpen(false)} aria-label="Close menu" className="app-drawer__close">
                ×
              </button>
            </div>
            <div className="nav-menu app-drawer__nav">
              {user.role === 'SYSTEM_ADMIN' && (
                <NavLink to="/super-admin" className={navClass} onClick={() => setMobileNavOpen(false)}>
                  Super Admin
                </NavLink>
              )}

              {user.role !== 'SYSTEM_ADMIN' && (
                <>
                  <NavLink to="/dashboard" className={navClass} onClick={() => setMobileNavOpen(false)}>
                    Dashboard
                  </NavLink>

                  {['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC', 'COORDINATOR'].includes(user.role) && (
                    <NavLink to="/societies" className={navClass} onClick={() => setMobileNavOpen(false)}>
                      Societies
                    </NavLink>
                  )}

                  {user.role === 'DIRECTOR_SSC' && (
                    <NavLink to="/budget" className={navClass} onClick={() => setMobileNavOpen(false)}>
                      Budget
                    </NavLink>
                  )}

                  {user.role === 'DIRECTOR_SSC' && (
                    <NavLink to="/staff-tools" className={navClass} onClick={() => setMobileNavOpen(false)}>
                      Staff tools
                    </NavLink>
                  )}

                  {['DIRECTOR_SSC', 'ASST_DIRECTOR', 'FINANCE_SECRETARY', 'REGISTRAR', 'VC'].includes(user.role) && (
                    <NavLink to="/analytics" className={navClass} onClick={() => setMobileNavOpen(false)}>
                      Analytics
                    </NavLink>
                  )}

                  <NavLink to="/calendar" className={navClass} onClick={() => setMobileNavOpen(false)}>
                    Calendar
                  </NavLink>

                  <NavLink to="/search" className={navClass} onClick={() => setMobileNavOpen(false)}>
                    Search
                  </NavLink>

                  <NavLink
                    to="/notifications"
                    className={({ isActive }) => `notification-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    Notifications
                    {unreadNotifications > 0 && (
                      <span className="notification-badge">{unreadNotifications}</span>
                    )}
                  </NavLink>

                  <NavLink to="/profile" className={navClass} onClick={() => setMobileNavOpen(false)}>
                    Profile
                  </NavLink>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <Outlet context={{ user, onViewProposal }} />
      </main>

      {user.role !== 'SYSTEM_ADMIN' && (
        <>
          <FeedbackModal isOpen={showFeedbackModal} onClose={() => setShowFeedbackModal(false)} />
          <button
            type="button"
            className="feedback-fab fixed bottom-4 right-4 z-40 p-3 sm:p-4 rounded-full shadow-lg"
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
