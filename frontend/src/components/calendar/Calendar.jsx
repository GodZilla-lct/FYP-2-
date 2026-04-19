import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import './Calendar.css';

const Calendar = ({ user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'list'

  useEffect(() => {
    fetchEvents();
  }, [selectedDate]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

      const response = await fetch(
        `/api/calendar/events?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`,
        { headers: getAuthHeaders() }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/export', {
        headers: getAuthHeaders()
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'campus_connect_events.ics';
      a.click();
    } catch (err) {
      console.error('Failed to export calendar:', err);
    }
  };

  const getDaysInMonth = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
      .toISOString().split('T')[0];
    return events.filter(e => e.event_date.startsWith(dateStr));
  };

  const changeMonth = (delta) => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + delta, 1));
  };

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>📅 Events Calendar</h2>
        <div className="calendar-actions">
          <button onClick={() => setViewMode(viewMode === 'month' ? 'list' : 'month')} className="btn btn-outline">
            {viewMode === 'month' ? 'List View' : 'Calendar View'}
          </button>
          <button onClick={exportCalendar} className="btn btn-outline">
            Export to iCal
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <>
          <div className="calendar-nav">
            <button onClick={() => changeMonth(-1)}>←</button>
            <h3>{selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
            <button onClick={() => changeMonth(1)}>→</button>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="weekday">{day}</div>
              ))}
            </div>
            <div className="calendar-days">
              {getDaysInMonth().map((day, index) => {
                const dayEvents = day ? getEventsForDay(day) : [];
                return (
                  <div key={index} className={`calendar-day ${!day ? 'empty' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}>
                    {day && (
                      <>
                        <div className="day-number">{day}</div>
                        {dayEvents.map(event => (
                          <div key={event.id} className="day-event" title={event.title}>
                            {event.title}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="events-list">
          {events.length === 0 ? (
            <div className="no-events">No events scheduled</div>
          ) : (
            events.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-date">
                  {new Date(event.event_date).toLocaleDateString()}
                </div>
                <div className="event-details">
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <div className="event-meta">
                    <span>🏛️ {event.society_name}</span>
                    {event.venue_name && <span>📍 {event.venue_name}</span>}
                    {event.location && <span>🏢 {event.location}</span>}
                    {event.start_time && <span>🕐 {event.start_time}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Calendar;
