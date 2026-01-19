// Simple session management for demo
let currentUser = null;

export const setCurrentUser = (user) => {
  currentUser = user;
  // Store in localStorage for persistence
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const getCurrentUser = () => {
  if (currentUser) return currentUser;
  
  // Try to get from localStorage
  const stored = localStorage.getItem('currentUser');
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  
  return null;
};

export const clearCurrentUser = () => {
  currentUser = null;
  localStorage.removeItem('currentUser');
};

export const getAuthHeaders = () => {
  const user = getCurrentUser();
  if (!user) return {};
  
  return {
    'x-user-id': user.id.toString(),
    'x-user-role': user.role,
    'x-user-email': user.email
  };
};