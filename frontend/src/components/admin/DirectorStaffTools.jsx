import { useState, useCallback } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './DirectorStaffTools.css';

/**
 * Director SSC tools: user activity, activate/deactivate accounts, bulk JSON import.
 */
export default function DirectorStaffTools({ user }) {
  const [lookupId, setLookupId] = useState('');
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  const [bulkJson, setBulkJson] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const fetchActivity = useCallback(async () => {
    const id = parseInt(lookupId, 10);
    if (!id) {
      setActivityError('Enter a numeric user ID (from Search → Users).');
      return;
    }
    setActivityLoading(true);
    setActivityError('');
    try {
      const res = await fetch(`/api/users/${id}/activity`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) {
        setActivityError(data.error || 'Failed to load activity');
        setActivity([]);
        return;
      }
      setActivity(data.activity || []);
    } catch (e) {
      setActivityError(e.message || 'Request failed');
    } finally {
      setActivityLoading(false);
    }
  }, [lookupId]);

  const setActiveState = async (active) => {
    const id = parseInt(lookupId, 10);
    if (!id) {
      alert('Enter user ID first');
      return;
    }
    const path = active ? 'reactivate' : 'deactivate';
    const res = await fetch(`/api/users/${id}/${path}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      alert(data.message || 'Updated');
      fetchActivity();
    } else {
      alert(data.error || 'Request failed');
    }
  };

  const runBulkImport = async () => {
    let users;
    try {
      users = JSON.parse(bulkJson);
    } catch {
      alert('Invalid JSON. Expected an array like [{"name":"A","email":"a@u.edu","rollNumber":"2020-CS-1"}]');
      return;
    }
    if (!Array.isArray(users) || users.length === 0) {
      alert('Provide a non-empty JSON array');
      return;
    }
    setBulkBusy(true);
    setBulkResult(null);
    try {
      const res = await fetch('/api/users/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ users }),
      });
      const data = await res.json();
      setBulkResult(data);
    } catch (e) {
      setBulkResult({ error: e.message });
    } finally {
      setBulkBusy(false);
    }
  };

  if (user.role !== 'DIRECTOR_SSC') {
    return (
      <div className="access-denied">
        <h2>Access denied</h2>
        <p>Only Director SSC can use staff tools.</p>
      </div>
    );
  }

  return (
    <div className="director-staff-tools">
      <h1>Staff tools</h1>
      <p className="lead">
        Look up a user by ID, review their portal activity, deactivate or reactivate their account, or bulk-import
        students from JSON.
      </p>

      <section className="dst-section">
        <h2>User lookup & activity</h2>
        <div className="dst-row">
          <label htmlFor="user-id-lookup">User ID</label>
          <input
            id="user-id-lookup"
            type="number"
            min="1"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="e.g. 42"
          />
          <button type="button" onClick={fetchActivity} disabled={activityLoading}>
            {activityLoading ? 'Loading…' : 'Load activity'}
          </button>
          <button type="button" className="btn-warn" onClick={() => setActiveState(false)} disabled={!lookupId}>
            Deactivate
          </button>
          <button type="button" className="btn-ok" onClick={() => setActiveState(true)} disabled={!lookupId}>
            Reactivate
          </button>
        </div>
        {activityError && <p className="dst-error">{activityError}</p>}
        <ul className="activity-feed">
          {activity.length === 0 && !activityLoading && !activityError && (
            <li className="muted">No activity loaded yet.</li>
          )}
          {activity.map((row, i) => (
            <li key={`${row.type}-${row.related_id}-${i}`}>
              <span className="atype">{row.type}</span>
              <span className="adesc">{row.description}</span>
              <time>{new Date(row.timestamp).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      </section>

      <section className="dst-section">
        <h2>Bulk import (JSON)</h2>
        <p className="muted">
          Array of objects: <code>name</code>, <code>email</code>, <code>rollNumber</code>, optional{' '}
          <code>role</code> (defaults to STUDENT). Default password: <code>default123</code>.
        </p>
        <textarea
          rows={10}
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          placeholder='[{"name":"Ali","email":"ali@campus.edu","rollNumber":"2024-CS-01"}]'
        />
        <button type="button" onClick={runBulkImport} disabled={bulkBusy}>
          {bulkBusy ? 'Importing…' : 'Run import'}
        </button>
        {bulkResult && (
          <pre className="bulk-result">{JSON.stringify(bulkResult, null, 2)}</pre>
        )}
      </section>
    </div>
  );
}
