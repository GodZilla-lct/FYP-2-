const { Server } = require('socket.io');
const { verifyToken } = require('./jwt');
const pool = require('./database');

let io;

/**
 * Initialize Socket.IO server
 */
function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      // Verify user exists and is active
      const connection = await pool.getConnection();
      try {
        const [users] = await connection.query(
          'SELECT id, name, email, role, COALESCE(session_version, 0) AS session_version FROM users WHERE id = ? AND is_active = TRUE',
          [decoded.id]
        );

        if (users.length === 0) {
          return next(new Error('User not found'));
        }

        const user = users[0];
        const tokenSessionVersion = decoded.sv ?? 0;
        if (decoded.type !== 'access' || tokenSessionVersion !== user.session_version) {
          return next(new Error('Session expired'));
        }

        socket.user = user;
        next();
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user.id})`);

    // Join user-specific room
    socket.join(`user:${socket.user.id}`);

    // Join role-specific room
    socket.join(`role:${socket.user.role}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user.id})`);
    });

    // Handle typing indicator for comments
    socket.on('typing:start', (data) => {
      socket.to(`proposal:${data.proposalId}`).emit('user:typing', {
        userId: socket.user.id,
        userName: socket.user.name,
        proposalId: data.proposalId,
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`proposal:${data.proposalId}`).emit('user:stopped-typing', {
        userId: socket.user.id,
        proposalId: data.proposalId,
      });
    });

    // Join proposal room for real-time updates
    socket.on('join:proposal', (proposalId) => {
      socket.join(`proposal:${proposalId}`);
    });

    socket.on('leave:proposal', (proposalId) => {
      socket.leave(`proposal:${proposalId}`);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Emit notification to specific user
 */
function emitToUser(userId, event, data) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit notification to role
 */
function emitToRole(role, event, data) {
  if (io) {
    io.to(`role:${role}`).emit(event, data);
  }
}

/**
 * Emit to proposal room
 */
function emitToProposal(proposalId, event, data) {
  if (io) {
    io.to(`proposal:${proposalId}`).emit(event, data);
  }
}

/**
 * Broadcast to all connected users
 */
function broadcast(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToRole,
  emitToProposal,
  broadcast,
};
