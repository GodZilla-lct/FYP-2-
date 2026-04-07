// Authentication utility functions for Campus Connect v4.0

const TOKEN_KEY = 'campus_connect_token';
const REFRESH_TOKEN_KEY = 'campus_connect_refresh_token';
const USER_KEY = 'campus_connect_user';

/**
 * Store authentication tokens and user data
 */
export function setAuthData(accessToken, refreshToken, user) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get access token
 */
export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get refresh token
 */
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Update current user data
 */
export function updateCurrentUser(userData) {
  const currentUser = getCurrentUser();
  if (currentUser) {
    const updatedUser = { ...currentUser, ...userData };
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }
}

/**
 * Clear authentication data (logout)
 */
export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAccessToken();
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders() {
  const token = getAccessToken();
  return token ? {
    'Authorization': `Bearer ${token}`,
  } : {};
}

/**
 * Refresh access token
 */
export async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    return data.accessToken;

  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthData();
    window.location.href = '/';
    throw error;
  }
}

/**
 * Make authenticated API request with automatic token refresh
 */
export async function authenticatedFetch(url, options = {}) {
  try {
    const headers = {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, try to refresh token
    if (response.status === 401) {
      await refreshAccessToken();
      
      // Retry request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
    }

    return response;

  } catch (error) {
    console.error('Authenticated fetch error:', error);
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout() {
  try {
    const refreshToken = getRefreshToken();
    
    if (refreshToken) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearAuthData();
  }
}

// Legacy functions for backward compatibility
export function setCurrentUser(user) {
  // For backward compatibility with old login flow
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser() {
  clearAuthData();
}
