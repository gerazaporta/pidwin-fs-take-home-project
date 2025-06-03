import React, { useState, useEffect } from "react";
import { AppBar, Typography, Toolbar, Avatar, Button } from "@mui/material";
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
  const [user, setUser] = useState<UserData | "null">(
    localStorage.getItem("profile")
      ? jwtDecode<UserData>(JSON.parse(localStorage.getItem("profile") || "{}").token)
      : "null"
  );

  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
  const location = useLocation();
  const history = useNavigate();

  const logout = () => {
    console.log('Logging out, disconnecting socket');
    // Disconnect socket before logout
    socketService.disconnect();

    // Small delay to ensure socket is fully disconnected before navigating
    setTimeout(() => {
      dispatch({ type: actionType.LOGOUT });
      history("/auth");
      setUser("null");
    }, 100);
  };

  // Initialize socket connection and listen for token updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let connectionCheckInterval: NodeJS.Timeout | undefined;

    const initializeSocket = () => {
      // Only initialize socket if user is authenticated
      if (user !== "null" && typeof user !== "string") {
        console.log('Initializing socket for authenticated user');
        // Initialize socket connection
        socketService.initialize();

        // Register callback for token updates
        unsubscribe = socketService.onTokenUpdate((tokens) => {
          // Update user with new token count without triggering a full re-render
          setUser(prevUser => {
            if (prevUser !== "null" && typeof prevUser !== "string") {
              return { ...prevUser, tokens };
            }
            return prevUser;
          });
        });

        // Set up periodic connection check
        connectionCheckInterval = setInterval(() => {
          const isConnected = socketService.isConnected();
          const socketId = socketService.getSocketId();
          const transportType = socketService.getTransportType();

          console.log(`Socket connection status: ${isConnected ? 'Connected' : 'Disconnected'}, ID: ${socketId}, Transport: ${transportType}`);

          // If not connected but user is authenticated, try to reconnect
          if (!isConnected && user) {
            console.log('Socket disconnected but user is authenticated, reinitializing');
            socketService.initialize();
          }
        }, 30000); // Check every 30 seconds
      } else {
        console.log('User not authenticated, ensuring socket is disconnected');
        socketService.disconnect();
      }
    };

    // Initialize socket when component mounts
    initializeSocket();

    // Clean up on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (connectionCheckInterval) {
        clearInterval(connectionCheckInterval);
      }
      console.log('Component unmounting, disconnecting socket');
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    // Check for token expiration
    if (user !== "null" && typeof user !== "string") {
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
          setUser(prevUser => {
            if (prevUser === "null" || prevUser === null || prevUser._id !== decodedToken._id) {
              console.log('User changed, initializing socket');
              // Initialize socket for the new user
              setTimeout(() => {
                socketService.initialize();
              }, 0);
              return decodedToken;
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
      // Ensure socket is disconnected on error
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
        {user !== "null" && typeof user !== "string" ? (
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
    </AppBar>
  );
};

export default Navbar;
