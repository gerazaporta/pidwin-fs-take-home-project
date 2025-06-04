import React, {ChangeEvent, useState} from "react";
import { Container, Grow, Paper, Typography, TextField, Button, Checkbox, FormControlLabel, Box } from "@mui/material";
import { jwtDecode } from "jwt-decode";
import {PlaceWagerFormData, UserData} from "../../types/actionTypes";
import {useDispatch} from "react-redux";
import {ThunkDispatch} from "redux-thunk";
import {AnyAction} from "redux";
import {placeWager} from "../../actions/game";
import RecentRolls from "../RecentRolls/RecentRolls";

const Home: React.FC = () => {
  const [wagerAmount, setWagerAmount] = useState<string>("");
  const [isLucky7, setIsLucky7] = useState<boolean>(false);
  const [placeWagerFormData, setPlaceWagerFormData] = useState<PlaceWagerFormData>({
    amount: 0,
    isLucky7Wager: false
  })

  const [message, setMessage] = useState<string>("");

  const dispatch = useDispatch<ThunkDispatch<any, any, AnyAction>>();
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

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPlaceWagerFormData({...placeWagerFormData, amount: parseInt(e.target.value)});
  }

  const handleIsLucky7Change = (e: ChangeEvent<HTMLInputElement>): void => {
    setPlaceWagerFormData({...placeWagerFormData, isLucky7Wager: e.target.checked});
  }

  const handleWagerSubmit = () => {
    dispatch(placeWager(placeWagerFormData))
    setMessage(`Wager of ${wagerAmount} tokens on ${isLucky7 ? "Lucky 7" : "Not Lucky 7"} submitted!`);
  }

  return (
    <Grow in>
      <Container component="main" maxWidth="sm">
        <Paper elevation={3}>
          {user !== null ? (
            <Box p={3}>
              <Typography variant="h4" align="center" color="primary" gutterBottom>
                {`Welcome ${user.name}`}
              </Typography>
              <Typography variant="h6" align="center" gutterBottom>
                Lucky-7 Dice Game
              </Typography>
              <Box mt={2} mb={2}>
                <TextField
                  fullWidth
                  label="Wager Amount"
                  variant="outlined"
                  type="number"
                  value={placeWagerFormData.amount}
                  onChange={handleAmountChange}
                  InputProps={{ inputProps: { min: 1, max: user.tokens } }}
                />
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={placeWagerFormData.isLucky7Wager}
                    onChange={handleIsLucky7Change}
                    color="primary"
                  />
                }
                label="Wager on Lucky-7"
              />
              <Box mt={2}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleWagerSubmit}
                  disabled={!placeWagerFormData.amount || placeWagerFormData.amount <= 0 || placeWagerFormData.amount > user.tokens}
                >
                  Place Wager
                </Button>
              </Box>
              {message && (
                <Box mt={2}>
                  <Typography variant="body1" align="center" color="secondary">
                    {message}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <Box p={3}>
              <Typography variant="h4" align="center" color="primary">
                Login to Play
              </Typography>
            </Box>
          )}
        </Paper>
        {user !== null && <RecentRolls />}
      </Container>
    </Grow>
  );
};

export default Home;
