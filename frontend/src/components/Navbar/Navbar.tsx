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
    dispatch({ type: actionType.LOGOUT });
    history("/auth");
    setUser("null");
  };

  useEffect(() => {
    if (user !== "null" && user !== null) {
      if (user.exp && user.exp * 1000 < new Date().getTime()) logout();
    }
    
    try {
      const profileStr = localStorage.getItem("profile");
      if (profileStr) {
        const profile = JSON.parse(profileStr);
        if (profile?.token) {
          setUser(jwtDecode<UserData>(profile.token));
        } else {
          setUser("null");
        }
      } else {
        setUser("null");
      }
    } catch (error) {
      console.error("Error parsing profile from localStorage:", error);
      setUser("null");
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
        {user !== "null" && user !== null ? (
          <div style={styles.profile}>
            <Avatar sx={styles.purple} alt={user.name} src={user.picture}>
              {user.name.charAt(0)}
            </Avatar>
            <Typography sx={styles.userName} variant="h6">
              {user.name}
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