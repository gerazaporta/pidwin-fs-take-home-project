import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

class SocketService {
  private io: SocketIOServer | null = null;

  // Initialize the socket.io server
  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: [
          'content-type', 
          'authorization', 
          'upgrade', 
          'sec-websocket-extensions', 
          'sec-websocket-key', 
          'sec-websocket-version'
        ],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
      // Prefer WebSocket transport
      allowUpgrades: true,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e8 // 100MB
    });

    // Log server-level events
    this.io.engine.on('connection_error', (err) => {
      console.error('Connection error:', err);
    });

    this.io.on('connect_error', (err) => {
      console.error('Socket.IO connect error:', err);
    });

    this.io.on('connection', (socket) => {
      console.log('New client connected', socket.id, 'transport:', socket.conn.transport.name);

      // Log transport changes
      socket.conn.on('upgrade', (transport) => {
        console.log(`Socket ${socket.id} transport upgraded from ${socket.conn.transport.name} to ${transport.name}`);
      });

      // Handle user authentication
      socket.on('authenticate', (userId) => {
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        // Join a room specific to this user
        socket.join(`user:${userId}`);

        // Acknowledge the authentication
        socket.emit('authentication_successful', { userId });
      });

      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
      });

      socket.on('error', (error) => {
        console.error(`Socket ${socket.id} error:`, error);
      });

      socket.on('connect_error', (error) => {
        console.error(`Socket ${socket.id} connect error:`, error);
      });

      socket.on('connect_timeout', () => {
        console.error(`Socket ${socket.id} connect timeout`);
      });

      socket.on('reconnect_attempt', (attemptNumber) => {
        console.log(`Socket ${socket.id} reconnect attempt #${attemptNumber}`);
      });

      socket.on('reconnect_error', (error) => {
        console.error(`Socket ${socket.id} reconnect error:`, error);
      });

      socket.on('reconnect_failed', () => {
        console.error(`Socket ${socket.id} failed to reconnect`);
      });
    });

    console.log('Socket.io server initialized');
  }

  // Send token update to a specific user
  updateUserTokens(userId: string, tokens: number) {
    if (!this.io) {
      console.error('Socket.io server not initialized');
      return;
    }

    // Get the room for this user
    const room = `user:${userId}`;

    // Check if the user has any active sockets
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    const socketCount = socketsInRoom ? socketsInRoom.size : 0;

    console.log(`Emitting token update for user ${userId}: ${tokens} tokens (${socketCount} active connections)`);

    if (socketCount === 0) {
      console.warn(`No active sockets found for user ${userId}, token update may not be delivered`);
    }

    // Emit the token update event to all sockets in the user's room
    this.io.to(room).emit('token_update', { tokens });
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
