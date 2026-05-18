import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './Calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'list'
  const [selectedDayEvents, setSelectedDayEvents] = useState(null); // { date, events[] }
  const [selectedEvent, setSelectedEvent] = useState(null); // single event detail modal

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
                    <span className="cal-detail-label">� Organiser</span>
                    <span className="cal-detail-value">{selectedEvent.created_by_name}</span>
                  </div>
                )}
              </div>
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
