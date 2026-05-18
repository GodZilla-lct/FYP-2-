import { io } from 'socket.io-client';

let socket = null;

// Derive the backend URL from the API URL env var, or fall back to the proxy host.
// In development the proxy in package.json points to http://localhost:5001,
// so we use that same origin for the socket connection.
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL ||
  (process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '')
    : 'http://localhost:5001');

export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: token,
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    // Prevent socket errors from crashing the app
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    // Log but don't crash — real-time updates are optional
    console.warn('⚠️ Socket connection error (real-time updates unavailable):', error.message);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const subscribeToNotifications = (callback) => {
  if (!socket) return () => {};

  socket.on('notification', callback);

  return () => {
    socket.off('notification', callback);
  };
};

export const subscribeToProposalUpdates = (callback) => {
  if (!socket) return () => {};

  socket.on('proposalUpdate', callback);

  return () => {
    socket.off('proposalUpdate', callback);
  };
};

export const subscribeToComments = (proposalId, callback) => {
  if (!socket) return () => {};

  socket.emit('joinProposal', proposalId);
  socket.on('newComment', callback);

  return () => {
    socket.emit('leaveProposal', proposalId);
    socket.off('newComment', callback);
  };
};
