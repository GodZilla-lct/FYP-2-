import { useEffect } from 'react';
import { getSocket, subscribeToProposalUpdates } from '../utils/socket';

export const useRealtimeProposals = (onUpdate) => {
  useEffect(() => {
    const socket = getSocket();
    if (socket && onUpdate) {
      const unsubscribe = subscribeToProposalUpdates(onUpdate);
      return unsubscribe;
    }
  }, [onUpdate]);
};

export const useRealtimeComments = (proposalId, onNewComment) => {
  useEffect(() => {
    if (!proposalId) return;

    const socket = getSocket();
    if (socket && onNewComment) {
      socket.emit('joinProposal', proposalId);
      socket.on('newComment', onNewComment);

      return () => {
        socket.emit('leaveProposal', proposalId);
        socket.off('newComment', onNewComment);
      };
    }
  }, [proposalId, onNewComment]);
};
