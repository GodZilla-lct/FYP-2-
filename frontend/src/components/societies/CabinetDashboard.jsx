/**
 * Cabinet Dashboard - Parent Container
 * Manages the society cabinet roster (non-login members)
 * 
 * IMPORTANT: Cabinet members do NOT receive portal access.
 * This is a historical ledger only.
 */

import { useState, useEffect } from 'react';
import AddMemberForm from './AddMemberForm';
import CabinetRosterTable from './CabinetRosterTable';
import { getCabinetMembers } from '../../services/cabinetService';
import './CabinetDashboard.css';

const CabinetDashboard = ({ societyId, societyName, userRole, isLeader }) => {
  // State for cabinet members list
  const [cabinetMembers, setCabinetMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Fetch cabinet members on mount
  useEffect(() => {
    fetchCabinetMembers();
  }, [societyId, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Fetch cabinet members from API
   */
  const fetchCabinetMembers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getCabinetMembers(societyId, selectedYear);
      
      if (response.success) {
        setCabinetMembers(response.data.members || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load cabinet members');
      console.error('Fetch cabinet members error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh cabinet members list
   */
  const refreshMembers = () => {
    fetchCabinetMembers();
  };

  /**
   * Get unique academic years for filter
   */
  const getUniqueYears = () => {
    const years = [...new Set(cabinetMembers.map(m => m.academic_year))];
    return years.sort().reverse();
  };

  const academicYears = getUniqueYears();
  const canManage = isLeader || userRole === 'DIRECTOR_SSC' || userRole === 'COORDINATOR';

  return (
    <div className="cabinet-dashboard">
      {/* Header */}
      <div className="cabinet-header">
        <div className="header-content">
          <h2 className="header-title">
            📋 Cabinet Roster Management
          </h2>
          <p className="header-subtitle">
            {societyName} Leadership Ledger
          </p>
          <div className="info-banner">
            <span className="info-icon">ℹ️</span>
            <p className="info-text">
              <strong>Note:</strong> Cabinet members listed here are for record-keeping only. 
              They do not receive portal access or login credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Add Member Form (only for authorized users) */}
      {canManage && (
        <AddMemberForm
          societyId={societyId}
          onMemberAdded={refreshMembers}
        />
      )}

      {/* Year Filter */}
      {academicYears.length > 0 && (
        <div className="filter-section">
          <label htmlFor="year-filter" className="filter-label">
            📅 Filter by Academic Year:
          </label>
          <select
            id="year-filter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="filter-select"
            disabled={loading}
          >
            <option value="">All Years</option>
            {academicYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {selectedYear && (
            <button
              onClick={() => setSelectedYear('')}
              className="filter-clear-btn"
              disabled={loading}
            >
              Clear Filter
            </button>
          )}
        </div>
      )}

      {/* Cabinet Roster Table */}
      <CabinetRosterTable
        cabinetMembers={cabinetMembers}
        loading={loading}
        canManage={canManage}
        onMemberDeleted={refreshMembers}
      />

      {/* Member Count */}
      {!loading && cabinetMembers.length > 0 && (
        <div className="member-count">
          <span className="count-badge">
            {cabinetMembers.length} {cabinetMembers.length === 1 ? 'member' : 'members'} 
            {selectedYear && ` in ${selectedYear}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default CabinetDashboard;
