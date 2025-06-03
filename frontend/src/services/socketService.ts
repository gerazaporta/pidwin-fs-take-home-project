import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private tokenUpdateCallbacks: ((tokens: number) => void)[] = [];

  // Initialize the socket connection
  initialize() {
    // If socket already exists and is connected, return early
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, skipping initialization');
      return;
    }

    // If socket exists but is disconnected, clean it up first
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Check if user is authenticated before initializing socket
    const profile = localStorage.getItem('profile');
    if (!profile) {
      console.log('No authenticated user, skipping socket initialization');
      return;
    }

    try {
      const { token } = JSON.parse(profile);
      if (!token) {
        console.log('No token found, skipping socket initialization');
        return;
      }
    } catch (error) {
      console.error('Error parsing profile, skipping socket initialization:', error);
      return;
    }

    // Initialize socket only if user is authenticated
    this.socket = io('http://localhost:5500', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      // Prefer WebSocket transport
      upgrade: true,
      rememberUpgrade: true,
      forceNew: true
    });

    this.socket.on('connect', () => {
      const socketId = this.socket?.id;
      const transportType = this.getTransportType();
      console.log(`Connected to socket server. ID: ${socketId}, Transport: ${transportType}`);
      this.authenticateUser();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server:', reason);

      // If the server disconnected us, don't try to reconnect automatically
      if (reason === 'io server disconnect') {
        console.log('Server disconnected the socket, will not attempt to reconnect');
      } else if (reason === 'transport close' || reason === 'transport error') {
        console.log('Transport closed or error occurred, socket.io will attempt to reconnect automatically');
      }
    });

    this.socket.on('token_update', (data) => {
      console.log('Token update received:', data);
      this.notifyTokenUpdate(data.tokens);
    });

    this.socket.on('authentication_successful', (data) => {
      console.log(`Authentication successful for user ${data.userId}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);

      // If we get a CORS error, log it specifically
      if (error && error.message && error.message.includes('CORS')) {
        console.error('CORS error detected. Check CORS configuration on the server.');
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.authenticateUser();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);

      // On reconnection attempts, prefer websocket transport
      if (this.socket && this.socket.io && this.socket.io.opts) {
        this.socket.io.opts.transports = ['websocket', 'polling'];
      }
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket failed to reconnect after maximum attempts');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Log ping/pong events for debugging
    this.socket.io.on('ping', () => {
      console.debug('Socket ping sent');
    });

    // Use a more generic approach for the pong event
    // Using 'as any' to bypass TypeScript's type checking for this specific event
    // since the engine's pong event actually does provide a latency parameter
    this.socket.io.engine.on('pong', ((latency: number) => {
      console.debug(`Socket pong received (latency: ${latency}ms)`);
    }) as any);
  }

  // Authenticate the user with the socket server
  authenticateUser() {
    const profile = localStorage.getItem('profile');
    if (!profile) {
      return;
    }

    try {
      const { token } = JSON.parse(profile);
      if (!token) {
        return;
      }

      // Extract user ID from token
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { _id } = JSON.parse(jsonPayload);

      if (this.socket && _id) {
        this.socket.emit('authenticate', _id);
      }
    } catch (error) {
      console.error('Error authenticating user with socket:', error);
    }
  }

  // Register a callback for token updates
  onTokenUpdate(callback: (tokens: number) => void) {
    this.tokenUpdateCallbacks.push(callback);
    return () => {
      this.tokenUpdateCallbacks = this.tokenUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Notify all registered callbacks about token updates
  private notifyTokenUpdate(tokens: number) {
    this.tokenUpdateCallbacks.forEach(callback => callback(tokens));
  }

  // Check if the socket is connected
  isConnected() {
    return this.socket && this.socket.connected;
  }

  // Get the current socket ID
  getSocketId() {
    return this.socket ? this.socket.id : null;
  }

  // Get the current transport type
  getTransportType() {
    if (!this.socket || !this.socket.io || !this.socket.io.engine) {
      return null;
    }
    return this.socket.io.engine.transport.name;
  }

  // Disconnect the socket
  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket', this.socket.id);
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();

export default socketService;
