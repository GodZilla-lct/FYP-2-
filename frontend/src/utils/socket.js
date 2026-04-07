import { io } from 'socket.io-client';

let socket = null;

export const initializeSocket = (token) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io('http://localhost:5000', {
    auth: {
      token: token
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
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
  if (!socket) return;
  
  socket.on('notification', callback);
  
  return () => {
    socket.off('notification', callback);
  };
};

export const subscribeToProposalUpdates = (callback) => {
  if (!socket) return;
  
  socket.on('proposalUpdate', callback);
  
  return () => {
    socket.off('proposalUpdate', callback);
  };
};

export const subscribeToComments = (proposalId, callback) => {
  if (!socket) return;
  
  socket.emit('joinProposal', proposalId);
  socket.on('newComment', callback);
  
  return () => {
    socket.emit('leaveProposal', proposalId);
    socket.off('newComment', callback);
  };
};
