import React, { useState, useEffect } from "react";
import { AppBar, Typography, Toolbar, Avatar, Button, Snackbar, Alert } from "@mui/material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import * as actionType from "../../constants/actionTypes";
import { styles } from "./styles";
import { UserData } from "../../types/actionTypes";
import { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";
import socketService from "../../services/socketService";

const Navbar: React.FC = () => {
  const [user, setUser] = useState<UserData | "null">(() => {
    // Check if we have a profile in localStorage
    const profileStr = localStorage.getItem("profile");
    if (!profileStr) return "null";

    try {
      // Decode the JWT token
      const profile = JSON.parse(profileStr);
      if (!profile?.token) return "null";

      const decodedToken = jwtDecode<UserData>(profile.token);

      // Check if we have stored tokens in localStorage
      const storedTokens = localStorage.getItem("userTokens");
      if (storedTokens) {
        const parsedTokens = parseInt(storedTokens, 10);
        console.log(`Initial load: Using stored token count from localStorage: ${parsedTokens} instead of JWT tokens: ${decodedToken.tokens}`);
        return { ...decodedToken, tokens: parsedTokens };
      }

      return decodedToken;
    } catch (error) {
      console.error("Error parsing profile from localStorage:", error);
      return "null";
    }
  });

  // State for roll result notification
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info" | "warning"
  });

  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const location = useLocation();
  const history = useNavigate();

  const logout = () => {
    console.log('Logging out, disconnecting socket');
    // Disconnect socket before logout
    socketService.disconnect();

    // Clear stored token count
    localStorage.removeItem("userTokens");
    console.log('Cleared stored token count from localStorage');

    // Small delay to ensure socket is fully disconnected before navigating
    setTimeout(() => {
      dispatch({ type: actionType.LOGOUT });
      history("/auth");
      setUser("null");
    }, 100);
  };

  // Handle closing the notification
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Initialize socket connection and listen for token updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let connectionCheckInterval: NodeJS.Timeout | undefined;

    const initializeSocket = () => {
      // Only initialize socket if user is authenticated
      if (user && typeof user !== "string") {
        console.log('Initializing socket for authenticated user', user._id);
        // Initialize socket connection
        socketService.initialize();

        // Register callback for token updates
        const tokenUnsubscribe = socketService.onTokenUpdate((tokens) => {
          setUser(prevUser => {
            if (typeof prevUser !== "string") {
              console.log(`Updating user tokens from ${prevUser.tokens} to ${tokens}`);
              // Store the updated token count in localStorage
              localStorage.setItem("userTokens", tokens.toString());
              console.log(`Saved updated token count to localStorage: ${tokens}`);
              return { ...prevUser, tokens };
            }
            return prevUser;
          });
        });

        // Register callback for roll results
        const rollResultUnsubscribe = socketService.onRollResult((result) => {
          console.log('Roll result received in Navbar:', result);
          const message = result.hasWon 
            ? `You won ${result.winnings} tokens! Dice sum: ${result.diceSum}`
            : `You lost. Dice sum: ${result.diceSum}`;

          setNotification({
            open: true,
            message,
            severity: result.hasWon ? "success" : "error"
          });
        });

        // Combine unsubscribe functions
        unsubscribe = () => {
          tokenUnsubscribe();
          rollResultUnsubscribe();
        };

        // Set up periodic connection check
        connectionCheckInterval = setInterval(() => {
          const isConnected = socketService.isConnected();
          const socketId = socketService.getSocketId();
          const transportType = socketService.getTransportType();

          console.log(`Socket connection status: ${isConnected ? 'Connected' : 'Disconnected'}, ID: ${socketId}, Transport: ${transportType}`);

          // If not connected but user is authenticated, try to reconnect
          if (!isConnected) {
            console.log('Socket disconnected, attempting to reconnect');
            socketService.initialize();
          }
        }, 30000); // Check every 30 seconds
      } else {
        console.log('No authenticated user, disconnecting socket');
        socketService.disconnect();
      }
    };

    // Clean up previous socket connection
    if (unsubscribe) {
      unsubscribe();
    }
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval);
    }

    // Initialize socket with current user
    initializeSocket();

    // Clean up on unmount or when user changes
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
      socketService.disconnect();
    };
  }, [user]); // Re-run when user changes

  useEffect(() => {
    // Check for token expiration
    if (typeof user !== "string") {
      if (user.exp && user.exp * 1000 < new Date().getTime()) {
        console.log('Token expired, logging out');
        logout();
        return;
      }
    }

    try {
      const profileStr = localStorage.getItem("profile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile?.token) {
          // Only update user if token is different to prevent unnecessary re-renders
          const decodedToken = jwtDecode<UserData>(profile.token);

          // Log current and new token information for debugging
          if (typeof user !== "string") {
            console.log(`Current user: ${user._id}, tokens: ${user.tokens}`);
          }
          console.log(`New token user: ${decodedToken._id}, tokens: ${decodedToken.tokens}`);

          // Check if we have a stored token count in localStorage
          const storedTokens = localStorage.getItem("userTokens");

          setUser(prevUser => {
            const shouldUpdateUser = prevUser === "null" || 
                                    prevUser === null || 
                                    prevUser._id !== decodedToken._id;

            if (shouldUpdateUser) {
              console.log('User changed, will initialize socket with new user');
              // Initialize socket in the next tick to ensure user state is updated first
              setTimeout(() => {
                socketService.initialize();
              }, 0);

              // If we have stored tokens, use them instead of the tokens from JWT
              if (storedTokens) {
                const parsedTokens = parseInt(storedTokens, 10);
                console.log(`Using stored token count from localStorage: ${parsedTokens} instead of JWT tokens: ${decodedToken.tokens}`);
                return { ...decodedToken, tokens: parsedTokens };
              }

              return decodedToken;
            } else if (prevUser.tokens !== decodedToken.tokens) {
              // If we have stored tokens, prioritize them over the JWT tokens
              if (storedTokens) {
                const parsedTokens = parseInt(storedTokens, 10);
                console.log(`Using stored token count from localStorage: ${parsedTokens} instead of JWT tokens: ${decodedToken.tokens}`);
                return { ...prevUser, tokens: parsedTokens };
              }

              console.log(`Token count changed in storage: ${prevUser.tokens} -> ${decodedToken.tokens}`);
              return { ...prevUser, tokens: decodedToken.tokens };
            }

            // If we have stored tokens and they're different from current tokens, update
            if (storedTokens && typeof prevUser !== "string") {
              const parsedTokens = parseInt(storedTokens, 10);
              if (parsedTokens !== prevUser.tokens) {
                console.log(`Updating tokens from stored value: ${prevUser.tokens} -> ${parsedTokens}`);
                return { ...prevUser, tokens: parsedTokens };
              }
            }

            return prevUser;
          });
        } else {
          console.log('No token in profile, disconnecting socket');
          setUser("null");
          // Ensure socket is disconnected if no token
          socketService.disconnect();
        }
      } else {
        console.log('No profile in localStorage, disconnecting socket');
        setUser("null");
        // Ensure socket is disconnected if no profile
        socketService.disconnect();
      }
    } catch (error) {
      console.error("Error parsing profile from localStorage:", error);
      setUser("null");
      socketService.disconnect();
    }
  }, [location]);

  return (
    <AppBar sx={styles.appBar} position="static" color="inherit">
      <div style={styles.brandContainer}>
        <Typography
          component={Link}
          to="/"
          sx={styles.heading}
          variant="h5"
          align="center"
        >
          CoinToss
        </Typography>
      </div>
      <Toolbar sx={styles.toolbar}>
        {typeof user !== "string" ? (
          <div style={styles.profile}>
            <Avatar sx={styles.purple} alt={user.name} src={user.picture}>
              {user.name.charAt(0)}
            </Avatar>
            <Typography sx={styles.userName} variant="h6">
              {user.name}
            </Typography>
            <Typography sx={styles.userName} variant="h6">
              Tokens: {user.tokens}
            </Typography>
            <Button
              variant="contained"
              sx={styles.logout}
              color="secondary"
              onClick={logout}
            >
              Logout
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={() => {
                history("/password");
              }}
            >
              Set Password
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                history("/win-streaks");
              }}
            >
              Win Streaks
            </Button>
          </div>
        ) : (
          <Button
            component={Link}
            to="/auth"
            variant="contained"
            color="primary"
          >
            Login
          </Button>
        )}
      </Toolbar>

      {/* Roll result notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};

export default Navbar;
