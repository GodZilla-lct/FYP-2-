/**
 * API utility — fetch wrapper with:
 * - Auto-logout on 401
 * - Sliding session: picks up X-New-Access-Token from every response
 * - Inactivity timer: logs out after 20 min with no API activity
 */

import { getAccessToken, clearAuthData, setTokenOnly } from './auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// ── Inactivity timer ───────────────────────────────────────────────────────
const INACTIVITY_MS = 20 * 60 * 1000; // 20 minutes
let _inactivityTimer = null;

function resetInactivityTimer() {
  if (_inactivityTimer) clearTimeout(_inactivityTimer);
  _inactivityTimer = setTimeout(() => {
    console.warn('🕐 Session expired due to inactivity. Logging out...');
    clearAuthData();
    window.location.href = '/login';
  }, INACTIVITY_MS);
}

/** Call once at app startup to begin the inactivity logout timer */
export function startInactivityTracking() {
  resetInactivityTimer();
}

export function stopInactivityTracking() {
  if (_inactivityTimer) clearTimeout(_inactivityTimer);
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });

    // ── Sliding session: store any fresh token the server issues ──────────
    const newToken = response.headers.get('X-New-Access-Token');
    if (newToken) {
      setTokenOnly(newToken);
    }

    // Reset inactivity timer on every successful API call
    resetInactivityTimer();

    // Auto-logout on 401 (expired / invalid token)
    if (response.status === 401) {
      console.warn('🔒 Session expired (401). Logging out...');
      clearAuthData();
      stopInactivityTracking();
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    return response;

  } catch (error) {
    if (error.message === 'Session expired. Please login again.') throw error;
    console.error('API Fetch Error:', error);
    throw error;
  }
}

// ── Convenience methods ────────────────────────────────────────────────────

export const api = {
  get:    (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: 'GET' }),
  post:   (endpoint, data, options = {}) => apiFetch(endpoint, { ...options, method: 'POST',   body: JSON.stringify(data) }),
  put:    (endpoint, data, options = {}) => apiFetch(endpoint, { ...options, method: 'PUT',    body: JSON.stringify(data) }),
  patch:  (endpoint, data, options = {}) => apiFetch(endpoint, { ...options, method: 'PATCH',  body: JSON.stringify(data) }),
  delete: (endpoint, options = {}) =>       apiFetch(endpoint, { ...options, method: 'DELETE' }),
};

/**
 * Global fetch interceptor — mirrors the sliding session logic for any
 * raw `fetch()` calls that don't go through `apiFetch`.
 */
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch(...args);

    const url = typeof args[0] === 'string' ? args[0] : '';
    const isApiCall = url.startsWith('/api') || url.startsWith(API_BASE_URL);

    if (isApiCall) {
      // Pick up fresh token
      const newToken = response.headers.get('X-New-Access-Token');
      if (newToken) setTokenOnly(newToken);

      // Reset inactivity timer
      resetInactivityTimer();

      // Auto-logout on 401
      if (response.status === 401) {
        console.warn('🔒 Session expired (401 interceptor). Logging out...');
        clearAuthData();
        stopInactivityTracking();
        window.location.href = '/login';
      }
    }

    return response;
  };
}

export default api;
