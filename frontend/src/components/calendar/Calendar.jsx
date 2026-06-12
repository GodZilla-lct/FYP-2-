import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './Calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const Calendar = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'list'
  const [selectedDayEvents, setSelectedDayEvents] = useState(null); // { date, events[] }
  const [selectedEvent, setSelectedEvent] = useState(null); // single event detail modal

  const canSchedule = ['DIRECTOR_SSC', 'ASST_DIRECTOR'].includes(user?.role);
  const [approvedProposals, setApprovedProposals] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    proposalId: '',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Main campus',
  });
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState('');
  const [conflictCheck, setConflictCheck] = useState({ eventDate: '', startTime: '', endTime: '' });
  const [conflictResult, setConflictResult] = useState(null);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate   = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const res = await fetch(
        `/api/calendar/events?startDate=${startDate}&endDate=${endDate}`,
        { headers: getAuthHeaders() }
      );

      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (!canSchedule) return;
    (async () => {
      try {
        const r = await fetch('/api/proposals', { headers: getAuthHeaders() });
        if (!r.ok) return;
        const d = await r.json();
        setApprovedProposals((d.proposals || []).filter((p) => p.current_status === 'APPROVED'));
      } catch {
        /* ignore */
      }
    })();
  }, [canSchedule]);

  const submitSchedule = async (e) => {
    e.preventDefault();
    setScheduleMsg('');
    if (!scheduleForm.proposalId) {
      setScheduleMsg('Choose a proposal');
      return;
    }
    setScheduleBusy(true);
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          proposalId: Number(scheduleForm.proposalId),
          startTime: scheduleForm.startTime,
          endTime: scheduleForm.endTime,
          location: scheduleForm.location,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setScheduleMsg(data.message || 'Saved');
        fetchEvents();
      } else {
        setScheduleMsg(data.error || data.message || 'Could not save');
      }
    } catch (err) {
      setScheduleMsg(err.message || 'Network error');
    } finally {
      setScheduleBusy(false);
    }
  };

  const runConflictCheck = async () => {
    setConflictResult(null);
    const { eventDate, startTime, endTime } = conflictCheck;
    if (!eventDate || !startTime || !endTime) {
      setConflictResult({ error: 'Fill date and times' });
      return;
    }
    try {
      const params = new URLSearchParams({ eventDate, startTime, endTime });
      const res = await fetch(`/api/calendar/check-conflicts?${params}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setConflictResult(data);
    } catch (e) {
      setConflictResult({ error: e.message });
    }
  };

  const deleteCalendarSlot = async () => {
    if (!selectedEvent?.calendar_event_id) return;
    if (!window.confirm('Remove this scheduled time from the calendar?')) return;
    try {
      const res = await fetch(`/api/calendar/events/${selectedEvent.calendar_event_id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setSelectedEvent(null);
        fetchEvents();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Delete failed');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return events.filter(e => e.event_date && e.event_date.startsWith(dateStr));
  };

  const buildCalendarDays = () => {
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const isToday = (day) => {
    const t = new Date();
    return day === t.getDate() && month === t.getMonth() && year === t.getFullYear();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  };

  const formatTime = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour < 12 ? 'AM' : 'PM'}`;
  };

  const exportCalendar = async () => {
    try {
      const res = await fetch('/api/calendar/export', { headers: getAuthHeaders() });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'campus_connect_events.ics'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="calendar-container">

      {/* ── Header ── */}
      <div className="calendar-header">
        <h2>📅 Campus Events Calendar</h2>
        <div className="calendar-actions">
          <button
            className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('month')}
          >📆 Month</button>
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setViewMode('list')}
          >📋 List</button>
          <button className="btn btn-outline" onClick={exportCalendar}>
            ⬇️ Export iCal
          </button>
        </div>
      </div>

      {canSchedule && (
        <div className="calendar-admin-panel">
          <h3>Schedule approved proposals</h3>
          <p className="calendar-admin-help">
            Attach start/end times and a display location to an approved proposal so it appears with timing on the calendar.
          </p>
          <form className="calendar-schedule-form" onSubmit={submitSchedule}>
            <label>
              Proposal
              <select
                value={scheduleForm.proposalId}
                onChange={(e) => setScheduleForm((f) => ({ ...f, proposalId: e.target.value }))}
                required
              >
                <option value="">Select approved proposal…</option>
                {approvedProposals.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.id} — {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start
              <input
                type="time"
                value={scheduleForm.startTime}
                onChange={(e) => setScheduleForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </label>
            <label>
              End
              <input
                type="time"
                value={scheduleForm.endTime}
                onChange={(e) => setScheduleForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </label>
            <label className="calendar-location-field">
              Location note
              <input
                type="text"
                value={scheduleForm.location}
                onChange={(e) => setScheduleForm((f) => ({ ...f, location: e.target.value }))}
              />
            </label>
            <button type="submit" className="btn btn-primary" disabled={scheduleBusy}>
              {scheduleBusy ? 'Saving…' : 'Save to calendar'}
            </button>
          </form>
          {scheduleMsg && <p className="calendar-schedule-msg">{scheduleMsg}</p>}

          <div className="calendar-conflict-check">
            <h4>Check time conflicts</h4>
            <div className="calendar-conflict-row">
              <input
                type="date"
                value={conflictCheck.eventDate}
                onChange={(e) => setConflictCheck((c) => ({ ...c, eventDate: e.target.value }))}
              />
              <input
                type="time"
                value={conflictCheck.startTime}
                onChange={(e) => setConflictCheck((c) => ({ ...c, startTime: e.target.value }))}
              />
              <input
                type="time"
                value={conflictCheck.endTime}
                onChange={(e) => setConflictCheck((c) => ({ ...c, endTime: e.target.value }))}
              />
              <button type="button" className="btn btn-outline" onClick={runConflictCheck}>
                Check
              </button>
            </div>
            {conflictResult && (
              <div className="calendar-conflict-result">
                {conflictResult.error && <p className="text-danger">{conflictResult.error}</p>}
                {conflictResult.success !== undefined && (
                  <p>
                    {conflictResult.hasConflicts
                      ? `Conflicts: ${(conflictResult.conflicts || []).map((c) => c.title).join(', ')}`
                      : 'No overlapping calendar slots for that window.'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Month Navigator ── */}
      <div className="calendar-nav">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>‹ Prev</button>
        <h3>{MONTHS[month]} {year}</h3>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>Next ›</button>
      </div>

      {loading ? (
        <div className="calendar-loading">Loading events...</div>
      ) : viewMode === 'month' ? (

        /* ── Month Grid ── */
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {WEEKDAYS.map(d => <div key={d} className="weekday">{d}</div>)}
          </div>

          <div className="calendar-days">
            {buildCalendarDays().map((day, idx) => {
              const dayEvents = day ? getEventsForDay(day) : [];
              return (
                <div
                  key={idx}
                  className={[
                    'calendar-day',
                    !day          ? 'empty'      : '',
                    isToday(day)  ? 'today'      : '',
                    dayEvents.length > 0 ? 'has-events' : '',
                  ].join(' ')}
                  onClick={() => day && dayEvents.length > 0 && setSelectedDayEvents({
                    date: `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
                    events: dayEvents
                  })}
                >
                  {day && (
                    <>
                      <div className="day-number">{day}</div>
                      {dayEvents.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          className="day-event"
                          title={`${ev.title} — ${ev.society_name}`}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="day-event-more">+{dayEvents.length - 3} more</div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      ) : (

        /* ── List View ── */
        <div className="events-list">
          {events.length === 0 ? (
            <div className="no-events">
              <p>📭 No approved events this month.</p>
            </div>
          ) : (
            events.map(ev => (
              <div
                key={ev.id}
                className="event-card"
                onClick={() => setSelectedEvent(ev)}
                style={{ cursor: 'pointer' }}
              >
                <div className="event-date-badge">
                  <div className="event-date-month">{MONTHS[new Date(ev.event_date + 'T00:00:00').getMonth()].slice(0,3)}</div>
                  <div className="event-date-day">{new Date(ev.event_date + 'T00:00:00').getDate()}</div>
                </div>
                <div className="event-details">
                  <h3>{ev.title}</h3>
                  <p className="event-desc">{ev.description}</p>
                  <div className="event-meta">
                    <span>🏛️ {ev.society_name}</span>
                    {ev.venue_name && <span>📍 {ev.venue_name}</span>}
                    {ev.start_time && <span>🕐 {formatTime(ev.start_time)}{ev.end_time ? ` – ${formatTime(ev.end_time)}` : ''}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Day Events Modal (month view click) ── */}
      {selectedDayEvents && (
        <div className="cal-modal-overlay" onClick={() => setSelectedDayEvents(null)}>
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h3>📅 {formatDate(selectedDayEvents.date)}</h3>
              <button className="cal-modal-close" onClick={() => setSelectedDayEvents(null)}>✕</button>
            </div>
            <div className="cal-modal-body">
              {selectedDayEvents.events.map(ev => (
                <div
                  key={ev.id}
                  className="cal-day-event-item"
                  onClick={() => { setSelectedEvent(ev); setSelectedDayEvents(null); }}
                >
                  <div className="cal-day-event-title">{ev.title}</div>
                  <div className="cal-day-event-meta">
                    <span>🏛️ {ev.society_name}</span>
                    {ev.venue_name && <span>📍 {ev.venue_name}</span>}
                    {ev.start_time && <span>🕐 {formatTime(ev.start_time)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Single Event Detail Modal ── */}
      {selectedEvent && (
        <div className="cal-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="cal-modal cal-modal-detail" onClick={e => e.stopPropagation()}>
            <div className="cal-modal-header">
              <h3>{selectedEvent.title}</h3>
              <button className="cal-modal-close" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="cal-modal-body">
              <div className="cal-detail-grid">
                <div className="cal-detail-row">
                  <span className="cal-detail-label">📅 Date</span>
                  <span className="cal-detail-value">{formatDate(selectedEvent.event_date)}</span>
                </div>
                <div className="cal-detail-row">
                  <span className="cal-detail-label">🏛️ Society</span>
                  <span className="cal-detail-value">{selectedEvent.society_name}</span>
                </div>
                {selectedEvent.venue_name && (
                  <div className="cal-detail-row">
                    <span className="cal-detail-label">📍 Venue</span>
                    <span className="cal-detail-value">
                      {selectedEvent.venue_name}
                      {selectedEvent.venue_capacity && ` (Capacity: ${selectedEvent.venue_capacity})`}
                    </span>
                  </div>
                )}
                {(selectedEvent.start_time || selectedEvent.end_time) && (
                  <div className="cal-detail-row">
                    <span className="cal-detail-label">🕐 Time</span>
                    <span className="cal-detail-value">
                      {formatTime(selectedEvent.start_time)}
                      {selectedEvent.end_time && ` – ${formatTime(selectedEvent.end_time)}`}
                    </span>
                  </div>
                )}
                {selectedEvent.location && (
                  <div className="cal-detail-row">
                    <span className="cal-detail-label">🏢 Location</span>
                    <span className="cal-detail-value">{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.budget_requested && (
                  <div className="cal-detail-row">
                    <span className="cal-detail-label">💰 Budget</span>
                    <span className="cal-detail-value">PKR {parseFloat(selectedEvent.budget_requested).toLocaleString()}</span>
                  </div>
                )}
                {selectedEvent.created_by_name && (
                  <div className="cal-detail-row">
                    <span className="cal-detail-label">Organiser</span>
                    <span className="cal-detail-value">{selectedEvent.created_by_name}</span>
                  </div>
                )}
              </div>
              {user?.role === 'DIRECTOR_SSC' && selectedEvent.calendar_event_id && (
                <div className="cal-admin-actions">
                  <button type="button" className="btn btn-outline btn-danger" onClick={deleteCalendarSlot}>
                    Remove calendar time slot
                  </button>
                </div>
              )}
              {selectedEvent.description && (
                <div className="cal-detail-description">
                  <h4>Description</h4>
                  <p>{selectedEvent.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
