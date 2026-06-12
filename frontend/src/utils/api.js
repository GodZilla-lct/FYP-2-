/**
 * API Configuration with Axios Interceptor for Auto-Logout
 * Handles 401/403 responses by clearing tokens and redirecting to login
 */

import { getAccessToken, clearAuthData } from './auth';

/**
 * Base API URL
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Create fetch wrapper with auto-logout on 401/403
 */
export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Add authorization header if token exists
  const token = getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Auto-logout only on 401 Unauthorized (expired/invalid token)
    if (response.status === 401) {
      console.warn('🔒 Session expired. Logging out...');

      // Clear all auth data from localStorage
      clearAuthData();

      // Force redirect to login page
      window.location.href = '/login';

      // Throw error to prevent further processing
      throw new Error('Session expired. Please login again.');
    }

    return response;

  } catch (error) {
    // If it's a network error or other fetch error, rethrow
    if (error.message === 'Session expired. Please login again.') {
      throw error;
    }
    
    console.error('API Fetch Error:', error);
    throw error;
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (endpoint, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: 'GET',
    });
  },

  post: (endpoint, data, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put: (endpoint, data, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: (endpoint, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },

  patch: (endpoint, data, options = {}) => {
    return apiFetch(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

/**
 * Setup global fetch interceptor (alternative approach)
 * Call this in your App.js or index.js
 */
export function setupFetchInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    const response = await originalFetch(...args);
    
    // Only auto-logout for 401 responses (token problems). 403 is a permissions issue and
    // should be handled by the UI without logging the user out.
    if (response.status === 401) {
      const url = args[0];
      if (typeof url === 'string' && (url.startsWith('/api') || url.startsWith(API_BASE_URL))) {
        console.warn('🔒 Session expired (401). Auto-logout triggered.');
        clearAuthData();
        window.location.href = '/login';
      }
    }
    
    return response;
  };
}

export default api;
