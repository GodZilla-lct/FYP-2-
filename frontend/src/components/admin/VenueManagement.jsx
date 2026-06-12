import { useState, useEffect } from 'react';

function VenueManagement() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [formData, setFormData] = useState({ name: '', capacity: '' });
  const [checkVenueId, setCheckVenueId] = useState('');
  const [checkEventDate, setCheckEventDate] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/venues', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_connect_token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch venues');

      const data = await response.json();
      setVenues(data.venues);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editingVenue
        ? `/api/venues/${editingVenue.id}`
        : '/api/venues';
      
      const method = editingVenue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('campus_connect_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error);
      }

      await fetchVenues();
      setShowAddModal(false);
      setEditingVenue(null);
      setFormData({ name: '', capacity: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleAvailability = async (venue) => {
    try {
      const response = await fetch(`/api/venues/${venue.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('campus_connect_token')}`,
        },
        body: JSON.stringify({ is_available: !venue.is_available }),
      });

      if (!response.ok) throw new Error('Failed to update venue');

      await fetchVenues();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (venueId) => {
    if (!window.confirm('Are you sure you want to delete this venue? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/venues/${venueId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('campus_connect_token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error);
      }

      await fetchVenues();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditModal = (venue) => {
    setEditingVenue(venue);
    setFormData({ name: venue.name, capacity: venue.capacity });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingVenue(null);
    setFormData({ name: '', capacity: '' });
  };

  const runVenueAvailabilityCheck = async () => {
    setCheckResult(null);
    if (!checkVenueId || !checkEventDate) {
      setCheckResult({ error: 'Select venue and date' });
      return;
    }
    try {
      const res = await fetch('/api/venues/check-availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('campus_connect_token')}`,
        },
        body: JSON.stringify({ venueId: Number(checkVenueId), eventDate: checkEventDate }),
      });
      const data = await res.json();
      setCheckResult(data);
    } catch (e) {
      setCheckResult({ error: e.message });
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading venues...</p>
      </div>
    );
  }

  return (
    <section className="control-section">
      <div className="section-header">
        <h2>🏛️ VENUE MANAGEMENT</h2>
        <button onClick={() => setShowAddModal(true)} className="btn-refresh">
          ➕ Add New Hall
        </button>
      </div>

      {error && (
        <div style={{ 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          color: '#721c24', 
          padding: '12px', 
          borderRadius: '4px', 
          marginBottom: '16px' 
        }}>
          {error}
        </div>
      )}

      <div className="mb-5 p-4 sm:p-6 lg:p-8" style={{
        background: '#1a1f2e',
        borderRadius: '8px',
        border: '1px solid #2d3548',
      }}>
        <h3 style={{ marginTop: 0, color: '#fff' }}>Check hall availability</h3>
        <p style={{ color: '#adb5bd', fontSize: '0.9rem' }}>
          See if an approved proposal already uses this hall on the selected date.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <select
            value={checkVenueId}
            onChange={(e) => setCheckVenueId(e.target.value)}
            style={{ padding: '8px', minWidth: '200px' }}
          >
            <option value="">Select venue</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={checkEventDate}
            onChange={(e) => setCheckEventDate(e.target.value)}
            style={{ padding: '8px' }}
          />
          <button type="button" className="btn-refresh" onClick={runVenueAvailabilityCheck}>
            Check
          </button>
        </div>
        {checkResult && (
          <pre
            style={{
              marginTop: '12px',
              background: '#0d1117',
              color: '#c9d1d9',
              padding: '12px',
              borderRadius: '6px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(checkResult, null, 2)}
          </pre>
        )}
      </div>

      <div className="overflow-x-auto whitespace-nowrap scrollbar-thin">
        <table className="control-table min-w-full">
          <thead>
            <tr>
              <th className="text-left">Venue Name</th>
              <th className="hidden sm:table-cell text-left">Capacity</th>
              <th className="text-left">Status</th>
              <th className="text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {venues.length === 0 ? (
              <tr>
                <td colSpan="4" className="no-data">
                  No venues found. Click "Add New Hall" to create one.
                </td>
              </tr>
            ) : (
              venues.map((venue) => (
                <tr key={venue.id}>
                  <td>
                    <strong>{venue.name}</strong>
                  </td>
                  <td className="hidden sm:table-cell">{venue.capacity} people</td>
                  <td>
                    <span className={venue.is_available ? 'status-indicator active' : 'status-indicator inactive'}>
                      {venue.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        onClick={() => handleToggleAvailability(venue)}
                        className="btn-action"
                        style={{ 
                          background: venue.is_available ? '#dc3545' : '#28a745',
                          color: '#ffffff',
                          padding: '6px 12px',
                          fontSize: '0.75rem'
                        }}
                        title={venue.is_available ? 'Disable' : 'Enable'}
                      >
                        {venue.is_available ? '🔴 Disable' : '🟢 Enable'}
                      </button>
                      <button
                        onClick={() => openEditModal(venue)}
                        className="btn-action"
                        style={{ 
                          background: '#17a2b8',
                          color: '#ffffff',
                          padding: '6px 12px',
                          fontSize: '0.75rem'
                        }}
                        title="Edit"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(venue.id)}
                        className="btn-action"
                        style={{ 
                          background: '#6c757d',
                          color: '#ffffff',
                          padding: '6px 12px',
                          fontSize: '0.75rem'
                        }}
                        title="Delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVenue ? 'Edit Venue' : 'Add New Venue'}</h2>
              <button onClick={closeModal} className="modal-close">
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="venueName">Venue Name *</label>
                  <input
                    type="text"
                    id="venueName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                    required
                    placeholder="Enter venue name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="venueCapacity">Capacity *</label>
                  <input
                    type="number"
                    id="venueCapacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="form-input"
                    min="0"
                    required
                    placeholder="Enter capacity"
                  />
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingVenue ? 'Update Venue' : 'Create Venue'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default VenueManagement;
