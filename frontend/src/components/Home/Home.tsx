import React from "react";
import { Container, Grow, Paper, Typography } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import { UserData } from "../../types/actionTypes";

const Home: React.FC = () => {
  let user: UserData | null = null;
  
  try {
    const profileStr = localStorage.getItem("profile");
    if (profileStr) {
      const profile = JSON.parse(profileStr);
      if (profile?.token) {
        user = jwtDecode<UserData>(profile.token);
      }
    }
  } catch (error) {
    console.error("Error parsing profile from localStorage:", error);
    user = null;
  }

  return (
    <Grow in>
      <Container component="main" maxWidth="sm">
        <Paper elevation={3}>
          {user !== null ? (
            <Typography variant="h4" align="center" color="primary">
              {`Welcome ${user.name}`}
            </Typography>
          ) : (
            <Typography variant="h4" align="center" color="primary">
              Login to Play
            </Typography>
          )}
        </Paper>
      </Container>
    </Grow>
  );
};

export default Home;