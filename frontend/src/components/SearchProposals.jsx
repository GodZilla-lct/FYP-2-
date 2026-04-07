import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../utils/auth';
import './SearchProposals.css';

const SearchProposals = ({ user }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    societyId: '',
    startDate: '',
    endDate: '',
    minBudget: '',
    maxBudget: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
  });
  const [proposals, setProposals] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      const response = await fetch('/api/societies', {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSocieties(data.societies || []);
      }
    } catch (err) {
      console.error('Failed to fetch societies:', err);
    }
  };

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
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals);
        setPagination(data.pagination);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="search-container">
      <h2>🔍 Search Proposals</h2>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={() => handleSearch()} disabled={loading}>
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
          {societies.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
          placeholder="Start Date"
        />

        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
          placeholder="End Date"
        />
      </div>

      {loading ? (
        <div className="loading">Searching...</div>
      ) : (
        <>
          <div className="results-list">
            {proposals.map(p => (
              <div key={p.id} className="result-item">
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <div className="result-meta">
                  <span>{p.society_name}</span>
                  <span>PKR {p.budget_requested.toLocaleString()}</span>
                  <span className={`status-badge ${p.current_status}`}>
                    {p.current_status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handleSearch(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {pagination.totalPages}</span>
              <button 
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
  );
};

export default SearchProposals;
