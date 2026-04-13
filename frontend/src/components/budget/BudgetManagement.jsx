import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './BudgetManagement.css';

const BudgetManagement = ({ user }) => {
  const [allocations, setAllocations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [societies, setSocieties] = useState([]);
  const [newAllocation, setNewAllocation] = useState({
    societyId: '',
    financialYear: new Date().getFullYear(),
    allocatedAmount: ''
  });

  useEffect(() => {
    fetchBudgetData();
    fetchSocieties();
  }, [selectedYear]);

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const [allocationsRes, summaryRes] = await Promise.all([
        fetch(`/api/budget/allocations?financialYear=${selectedYear}`, {
          headers: getAuthHeaders()
        }),
        fetch(`/api/budget/summary?financialYear=${selectedYear}`, {
          headers: getAuthHeaders()
        })
      ]);

      if (allocationsRes.ok && summaryRes.ok) {
        const allocationsData = await allocationsRes.json();
        const summaryData = await summaryRes.json();
        setAllocations(allocationsData.allocations);
        setSummary(summaryData.summary);
      }
    } catch (err) {
      console.error('Failed to fetch budget data:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleAddAllocation = async () => {
    try {
      const response = await fetch('/api/budget/allocations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(newAllocation)
      });

      if (response.ok) {
        setShowAddModal(false);
        setNewAllocation({ societyId: '', financialYear: new Date().getFullYear(), allocatedAmount: '' });
        fetchBudgetData();
      }
    } catch (err) {
      console.error('Failed to add allocation:', err);
    }
  };

  if (loading) {
    return <div className="budget-loading">Loading budget data...</div>;
  }

  return (
    <div className="budget-container">
      <div className="budget-header">
        <h2>💰 Budget Management</h2>
        <div className="budget-actions">
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {[2024, 2025, 2026, 2027].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {['DIRECTOR_SSC', 'FINANCE_SECRETARY'].includes(user.role) && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              + Add Allocation
            </button>
          )}
        </div>
      </div>

      {summary && (
        <div className="budget-summary">
          <div className="summary-card">
            <div className="summary-value">PKR {summary.totalAllocated.toLocaleString()}</div>
            <div className="summary-label">Total Allocated</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">PKR {summary.totalSpent.toLocaleString()}</div>
            <div className="summary-label">Total Spent</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">PKR {summary.remaining.toLocaleString()}</div>
            <div className="summary-label">Remaining</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{summary.utilizationRate}%</div>
            <div className="summary-label">Utilization Rate</div>
          </div>
        </div>
      )}

      <div className="allocations-table">
        <table>
          <thead>
            <tr>
              <th>Society</th>
              <th>Allocated</th>
              <th>Spent</th>
              <th>Remaining</th>
              <th>Utilization</th>
            </tr>
          </thead>
          <tbody>
            {allocations.map(allocation => (
              <tr key={allocation.id}>
                <td>{allocation.society_name}</td>
                <td>PKR {allocation.allocated_amount.toLocaleString()}</td>
                <td>PKR {allocation.spent.toLocaleString()}</td>
                <td>PKR {allocation.remaining.toLocaleString()}</td>
                <td>
                  <div className="utilization-bar">
                    <div 
                      className="utilization-fill"
                      style={{ 
                        width: `${allocation.utilization_percentage}%`,
                        backgroundColor: allocation.utilization_percentage > 90 ? '#dc3545' : '#28a745'
                      }}
                    ></div>
                    <span>{allocation.utilization_percentage}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Budget Allocation</h3>
            <select 
              value={newAllocation.societyId}
              onChange={(e) => setNewAllocation({...newAllocation, societyId: e.target.value})}
            >
              <option value="">Select Society</option>
              {societies.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Allocated Amount"
              value={newAllocation.allocatedAmount}
              onChange={(e) => setNewAllocation({...newAllocation, allocatedAmount: e.target.value})}
            />
            <div className="modal-actions">
              <button onClick={() => setShowAddModal(false)}>Cancel</button>
              <button onClick={handleAddAllocation}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;
