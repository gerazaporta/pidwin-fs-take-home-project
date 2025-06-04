import { io, Socket } from 'socket.io-client';

interface RollResult {
  hasWon: boolean;
  winnings: number;
  diceSum: number;
}

interface RecentRoll {
  id: string;
  dice1: number;
  dice2: number;
  diceSum: number;
  isLucky7: boolean;
  rollTime: string;
  amount: number;
  hasWon: boolean;
  isLucky7Wager: boolean;
}

interface WinStreak {
  username: string;
  winStreak: number;
  amount: number;
  isLucky7Wager: boolean;
}

class SocketService {
  private socket: Socket | null = null;
  private tokenUpdateCallbacks: ((tokens: number) => void)[] = [];
  private rollResultCallbacks: ((result: RollResult) => void)[] = [];
  private recentRollsCallbacks: ((rolls: RecentRoll[]) => void)[] = [];
  private winStreaksCallbacks: ((streaks: WinStreak[]) => void)[] = [];

  // Initialize the socket connection
  initialize() {
    console.log('Socket initialization requested');

    // If socket already exists and is connected, return early
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, skipping initialization');
      return;
    }

    // If socket exists but is disconnected, clean it up first
    if (this.socket) {
      console.log('Cleaning up existing socket');
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
      const parsedProfile = JSON.parse(profile);
      if (!parsedProfile.token) {
        console.log('No token found, skipping socket initialization');
        return;
      }

      // Log user ID from token for debugging
      try {
        const base64Url = parsedProfile.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const { _id } = JSON.parse(jsonPayload);
        console.log(`Initializing socket for user ${_id}`);
      } catch (tokenError) {
        console.error('Error decoding token:', tokenError);
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
      if (data && typeof data.tokens === 'number') {
        this.notifyTokenUpdate(data.tokens);
      } else {
        console.error('Invalid token update data received:', data);
      }
    });

    this.socket.on('roll_result', (data) => {
      console.log('Roll result received:', data);
      if (data && typeof data.hasWon === 'boolean' && typeof data.winnings === 'number' && typeof data.diceSum === 'number') {
        this.notifyRollResult(data);
      } else {
        console.error('Invalid roll result data received:', data);
      }
    });

    this.socket.on('recent_rolls', (data) => {
      console.log('Recent rolls received:', data);
      if (Array.isArray(data)) {
        this.notifyRecentRolls(data);
      } else {
        console.error('Invalid recent rolls data received:', data);
      }
    });

    this.socket.on('win_streaks', (data) => {
      console.log('Win streaks received:', data);
      if (Array.isArray(data)) {
        this.notifyWinStreaks(data);
      } else {
        console.error('Invalid win streaks data received:', data);
      }
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
    console.log('Authenticating user with socket server');

    const profile = localStorage.getItem('profile');
    if (!profile) {
      console.log('No profile found in localStorage, cannot authenticate');
      return;
    }

    try {
      const parsedProfile = JSON.parse(profile);
      if (!parsedProfile.token) {
        console.log('No token found in profile, cannot authenticate');
        return;
      }

      // Extract user ID from token
      const base64Url = parsedProfile.token.split('.')[1];
      if (!base64Url) {
        console.error('Invalid token format, cannot extract user ID');
        return;
      }

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const { _id } = JSON.parse(jsonPayload);

      if (!_id) {
        console.error('No user ID found in token payload');
        return;
      }

      if (!this.socket) {
        console.error('Socket not initialized, cannot authenticate');
        return;
      }

      console.log(`Authenticating user ${_id} with socket ${this.socket.id}`);
      this.socket.emit('authenticate', _id);

      // Check connection status after a short delay
      setTimeout(() => {
        if (this.socket && this.socket.connected) {
          console.log(`Socket ${this.socket.id} is connected after authentication`);
        } else {
          console.warn(`Socket is not connected after authentication attempt`);
        }
      }, 1000);
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

  // Register a callback for roll results
  onRollResult(callback: (result: RollResult) => void) {
    this.rollResultCallbacks.push(callback);
    return () => {
      this.rollResultCallbacks = this.rollResultCallbacks.filter(cb => cb !== callback);
    };
  }

  // Register a callback for recent rolls
  onRecentRolls(callback: (rolls: RecentRoll[]) => void) {
    this.recentRollsCallbacks.push(callback);
    return () => {
      this.recentRollsCallbacks = this.recentRollsCallbacks.filter(cb => cb !== callback);
    };
  }

  // Register a callback for win streaks
  onWinStreaks(callback: (streaks: WinStreak[]) => void) {
    this.winStreaksCallbacks.push(callback);
    return () => {
      this.winStreaksCallbacks = this.winStreaksCallbacks.filter(cb => cb !== callback);
    };
  }

  // Notify all registered callbacks about token updates
  private notifyTokenUpdate(tokens: number) {
    console.log(`Notifying ${this.tokenUpdateCallbacks.length} callbacks about token update: ${tokens}`);
    this.tokenUpdateCallbacks.forEach(callback => {
      try {
        callback(tokens);
      } catch (error) {
        console.error('Error in token update callback:', error);
      }
    });
  }

  // Notify all registered callbacks about roll results
  private notifyRollResult(result: RollResult) {
    console.log(`Notifying ${this.rollResultCallbacks.length} callbacks about roll result: ${result.hasWon ? 'Win' : 'Loss'}`);
    this.rollResultCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in roll result callback:', error);
      }
    });
  }

  // Notify all registered callbacks about recent rolls
  private notifyRecentRolls(rolls: RecentRoll[]) {
    console.log(`Notifying ${this.recentRollsCallbacks.length} callbacks about recent rolls: ${rolls.length} rolls`);
    this.recentRollsCallbacks.forEach(callback => {
      try {
        callback(rolls);
      } catch (error) {
        console.error('Error in recent rolls callback:', error);
      }
    });
  }

  // Notify all registered callbacks about win streaks
  private notifyWinStreaks(streaks: WinStreak[]) {
    console.log(`Notifying ${this.winStreaksCallbacks.length} callbacks about win streaks: ${streaks.length} streaks`);
    this.winStreaksCallbacks.forEach(callback => {
      try {
        callback(streaks);
      } catch (error) {
        console.error('Error in win streaks callback:', error);
      }
    });
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
