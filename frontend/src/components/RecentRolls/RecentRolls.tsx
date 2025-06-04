import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import socketService from '../../services/socketService';
import { getRecentRolls } from '../../api';
import { jwtDecode } from 'jwt-decode';
import { UserData } from '../../types/actionTypes';

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

const RecentRolls: React.FC = () => {
  const [recentRolls, setRecentRolls] = useState<RecentRoll[]>([]);

  useEffect(() => {
    // Get user ID from localStorage
    const getUserId = (): string | null => {
      const profileStr = localStorage.getItem('profile');
      if (!profileStr) return null;

      try {
        const profile = JSON.parse(profileStr);
        if (!profile?.token) return null;

        const decodedToken = jwtDecode<UserData>(profile.token);
        return decodedToken._id;
      } catch (error) {
        console.error('Error getting user ID:', error);
        return null;
      }
    };

    const userId = getUserId();
    if (!userId) {
      console.error('No user ID found, cannot fetch recent rolls');
      return;
    }

    // Fetch initial recent rolls
    const fetchRecentRolls = async () => {
      try {
        const response = await getRecentRolls(userId);
        setRecentRolls(response.data);
      } catch (error) {
        console.error('Error fetching recent rolls:', error);
      }
    };

    fetchRecentRolls();

    // Register for real-time updates
    const unsubscribe = socketService.onRecentRolls((rolls) => {
      console.log('Recent rolls update received:', rolls);
      // Filter rolls to only show this user's rolls
      const userRolls = rolls.filter(roll => {
        // This assumes the socket is sending all rolls, which may need to be updated
        // in the backend to only send user-specific rolls
        return true; // For now, accept all rolls from socket as we'll update the backend later
      });
      setRecentRolls(userRolls);
    });

    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Define styles for different roll outcomes
  const getRowStyle = (roll: RecentRoll) => {
    if (roll.hasWon && roll.isLucky7Wager && roll.isLucky7) {
      // Lucky 7 win - gold background
      return { backgroundColor: '#FFD700', fontWeight: 'bold' };
    } else if (roll.hasWon) {
      // Regular win - green background
      return { backgroundColor: '#90EE90' };
    } else {
      // Loss - light red background
      return { backgroundColor: '#FFCCCB' };
    }
  };

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>
        Your Last 5 Rolls
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Dice 1</TableCell>
              <TableCell>Dice 2</TableCell>
              <TableCell>Sum</TableCell>
              <TableCell>Wager Amount</TableCell>
              <TableCell>Wager Type</TableCell>
              <TableCell>Result</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recentRolls.length > 0 ? (
              recentRolls.map((roll) => (
                <TableRow key={roll.id} style={getRowStyle(roll)}>
                  <TableCell>{roll.dice1}</TableCell>
                  <TableCell>{roll.dice2}</TableCell>
                  <TableCell>{roll.diceSum}</TableCell>
                  <TableCell>{roll.amount}</TableCell>
                  <TableCell>{roll.isLucky7Wager ? 'Lucky 7' : 'Not Lucky 7'}</TableCell>
                  <TableCell>{roll.hasWon ? 'Win' : 'Loss'}</TableCell>
                  <TableCell>{new Date(roll.rollTime).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No recent rolls
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RecentRolls;
