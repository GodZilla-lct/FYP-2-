import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './SearchProposals.css';

const emptyProposalFilters = {
  status: '',
  societyId: '',
  startDate: '',
  endDate: '',
  minBudget: '',
  maxBudget: '',
  sortBy: 'created_at',
  sortOrder: 'DESC',
};

const SearchProposals = () => {
  const [mainTab, setMainTab] = useState('proposals'); // proposals | users

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ ...emptyProposalFilters });
  const [proposals, setProposals] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const [savedFilters, setSavedFilters] = useState([]);
  const [saveFilterName, setSaveFilterName] = useState('');

  const fetchSocieties = useCallback(async () => {
    try {
      const response = await fetch('/api/societies', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setSocieties(data.societies || []);
      }
    } catch (err) {
      console.error('Failed to fetch societies:', err);
    }
  }, []);

  const loadSavedFilters = useCallback(async () => {
    try {
      const res = await fetch('/api/search/filters', { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setSavedFilters(data.filters || []);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchSocieties();
    loadSavedFilters();
  }, [fetchSocieties, loadSavedFilters]);

  const handleSearch = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        page,
        limit: 20,
        ...filters,
      });

      const response = await fetch(`/api/search/proposals?${params}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals || []);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({ query: userQuery, limit: '30' });
      if (userRoleFilter) params.set('role', userRoleFilter);
      const res = await fetch(`/api/search/users?${params}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applySavedFilter = (raw) => {
    try {
      const parsed =
        typeof raw === 'string'
          ? JSON.parse(raw)
          : typeof raw === 'object' && raw !== null
            ? raw
            : JSON.parse(String(raw));
      if (parsed.searchQuery !== undefined) setSearchQuery(parsed.searchQuery);
      setFilters({ ...emptyProposalFilters, ...(parsed.filters || {}) });
    } catch {
      alert('Could not read saved filter');
    }
  };

  const saveCurrentFilter = async () => {
    if (!saveFilterName.trim()) {
      alert('Enter a name for this saved filter');
      return;
    }
    const res = await fetch('/api/search/filters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        name: saveFilterName.trim(),
        filters: { searchQuery, filters },
      }),
    });
    if (res.ok) {
      setSaveFilterName('');
      loadSavedFilters();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Save failed');
    }
  };

  const deleteSavedFilter = async (id) => {
    if (!window.confirm('Remove this saved filter?')) return;
    const res = await fetch(`/api/search/filters/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) loadSavedFilters();
  };

  return (
    <div className="search-container">
      <h2>Search</h2>
      <div className="search-main-tabs">
        <button
          type="button"
          className={mainTab === 'proposals' ? 'tab active' : 'tab'}
          onClick={() => setMainTab('proposals')}
        >
          Proposals
        </button>
        <button
          type="button"
          className={mainTab === 'users' ? 'tab active' : 'tab'}
          onClick={() => setMainTab('users')}
        >
          Users
        </button>
      </div>

      {mainTab === 'proposals' && (
        <div className="search-proposals-layout">
          <aside className="saved-filters-panel">
            <h3>Saved filters</h3>
            <p className="saved-filters-hint">Save the current proposal query and filters for one-click reuse.</p>
            <div className="save-filter-row">
              <input
                type="text"
                placeholder="Name (e.g. Pending — Society X)"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
              />
              <button type="button" className="btn-small" onClick={saveCurrentFilter}>
                Save
              </button>
            </div>
            <ul className="saved-filters-list">
              {savedFilters.length === 0 ? (
                <li className="muted">No saved filters yet.</li>
              ) : (
                savedFilters.map((f) => (
                  <li key={f.id}>
                    <button type="button" className="link-btn" onClick={() => applySavedFilter(f.filters)}>
                      {f.name}
                    </button>
                    <button type="button" className="link-btn danger" onClick={() => deleteSavedFilter(f.id)}>
                      Delete
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>

          <div className="search-proposals-main">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button type="button" onClick={() => handleSearch()} disabled={loading}>
                Search
              </button>
            </div>

            <div className="filters-panel">
              <select name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">All Statuses</option>
                <option value="PENDING_COORDINATOR">Pending Coordinator</option>
                <option value="PENDING_DIRECTOR_SSC">Pending Director</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select name="societyId" value={filters.societyId} onChange={handleFilterChange}>
                <option value="">All Societies</option>
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
            </div>

            {loading ? (
              <div className="loading">Searching...</div>
            ) : (
              <>
                <div className="results-list">
                  {proposals.map((p) => (
                    <div key={p.id} className="result-item">
                      <h3>{p.title}</h3>
                      <p>{p.description}</p>
                      <div className="result-meta">
                        <span>{p.society_name}</span>
                        <span>PKR {Number(p.budget_requested || 0).toLocaleString()}</span>
                        <span className={`status-badge ${p.current_status}`}>{p.current_status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="pagination">
                    <button type="button" onClick={() => handleSearch(currentPage - 1)} disabled={currentPage === 1}>
                      Previous
                    </button>
                    <span>
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSearch(currentPage + 1)}
                      disabled={currentPage === pagination.totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {mainTab === 'users' && (
        <div className="search-users-panel">
          <div className="search-box">
            <input
              type="text"
              placeholder="Name, email, or roll number..."
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            />
            <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
              <option value="">Any role</option>
              <option value="STUDENT">STUDENT</option>
              <option value="COORDINATOR">COORDINATOR</option>
              <option value="DIRECTOR_SSC">DIRECTOR_SSC</option>
              <option value="SYSTEM_ADMIN">SYSTEM_ADMIN</option>
            </select>
            <button type="button" onClick={searchUsers} disabled={usersLoading}>
              {usersLoading ? 'Searching…' : 'Search users'}
            </button>
          </div>
          <div className="users-results">
            {users.map((u) => (
              <div key={u.id} className="user-result-card">
                <div>
                  <strong>{u.name}</strong>
                  <span className="muted"> #{u.id}</span>
                </div>
                <div>{u.email}</div>
                <div>
                  Roll: {u.roll_number || '—'} · Role: {u.role} ·{' '}
                  {u.is_active ? <span className="ok">Active</span> : <span className="warn">Inactive</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchProposals;
