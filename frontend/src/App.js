import { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import SocietyDashboard from './components/SocietyDashboard';
import AdminHierarchy from './components/AdminHierarchy';
import AdminDashboard from './components/AdminDashboard';
import { getCurrentUser, clearCurrentUser } from './utils/auth';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'admin'

  // Check for existing session on app load
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'DIRECTOR_SSC') {
        setView('admin');
      } else if (user.canAccessSocietyDashboard) {
        setView('dashboard');
      }
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    // Set initial view based on role
    if (user.role === 'DIRECTOR_SSC') {
      setView('admin');
    } else if (user.canAccessSocietyDashboard) {
      setView('dashboard');
    } else {
      // Non-core leaders cannot access any dashboard
      alert('Access denied. Only core society leaders can access the dashboard.');
      setCurrentUser(null);
    }
  };

  const handleLogout = () => {
    clearCurrentUser();
    setCurrentUser(null);
    setView('dashboard');
  };

  const handleViewSwitch = (newView) => {
    setView(newView);
  };

  // Show login if no user is logged in
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Campus Connect</h1>
        <div className="user-info">
          <span>{currentUser.name} ({currentUser.role})</span>
          <div className="header-actions">
            {currentUser.role === 'DIRECTOR_SSC' && (
              <div className="view-switcher">
                <button 
                  onClick={() => handleViewSwitch('dashboard')}
                  className={view === 'dashboard' ? 'active' : ''}
                >
                  Proposals Dashboard
                </button>
                <button 
                  onClick={() => handleViewSwitch('admin')}
                  className={view === 'admin' ? 'active' : ''}
                >
                  Manage Hierarchy
                </button>
              </div>
            )}
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {view === 'dashboard' && currentUser.canAccessSocietyDashboard && (
          <SocietyDashboard user={currentUser} />
        )}
        {view === 'dashboard' && currentUser.role === 'DIRECTOR_SSC' && (
          <AdminDashboard user={currentUser} />
        )}
        {view === 'admin' && currentUser.role === 'DIRECTOR_SSC' && (
          <AdminHierarchy user={currentUser} />
        )}
        {!currentUser.canAccessSocietyDashboard && currentUser.role !== 'DIRECTOR_SSC' && (
          <div className="access-denied">
            <h2>Access Denied</h2>
            <p>Only core society leaders (President, VP, General Secretary) can access the dashboard.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
