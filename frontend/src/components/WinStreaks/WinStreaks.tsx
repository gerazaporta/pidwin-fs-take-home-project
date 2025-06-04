import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Container, Grow, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getWinStreaks } from '../../api';
import socketService from '../../services/socketService';

interface WinStreak {
  username: string;
  winStreak: number;
  amount: number;
  isLucky7Wager: boolean;
}

const WinStreaks: React.FC = () => {
  const [winStreaks, setWinStreaks] = useState<WinStreak[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWinStreaks = async () => {
      try {
        setLoading(true);
        const response = await getWinStreaks();
        setWinStreaks(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching win streaks:', error);
        setError('Failed to load win streaks. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchWinStreaks();

    // Register for real-time updates via socket
    const unsubscribe = socketService.onWinStreaks((streaks) => {
      console.log('Win streaks update received via socket:', streaks);
      setWinStreaks(streaks);
    });

    // Clean up on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Define styles for different wager types
  const getRowStyle = (streak: WinStreak) => {
    if (streak.isLucky7Wager) {
      // Lucky 7 wager - gold background
      return { backgroundColor: '#FFD700', fontWeight: 'bold' };
    } else {
      // Regular wager - light blue background
      return { backgroundColor: '#ADD8E6' };
    }
  };

  return (
    <Grow in>
      <Container component="main" maxWidth="md">
        <Box mt={4}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
            <Typography variant="h4" align="center" gutterBottom>
              Top 10 Longest Win Streaks
            </Typography>
            <Box width={100}></Box> {/* Empty box for balance */}
          </Box>
          {loading ? (
            <Typography align="center">Loading win streaks...</Typography>
          ) : error ? (
            <Typography color="error" align="center">{error}</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Rank</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Win Streak</TableCell>
                    <TableCell>Wager Amount</TableCell>
                    <TableCell>Wager Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {winStreaks.length > 0 ? (
                    winStreaks.map((streak, index) => (
                      <TableRow key={index} style={getRowStyle(streak)}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{streak.username}</TableCell>
                        <TableCell>{streak.winStreak}</TableCell>
                        <TableCell>{streak.amount}</TableCell>
                        <TableCell>{streak.isLucky7Wager ? 'Lucky 7' : 'Not Lucky 7'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No win streaks found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Container>
    </Grow>
  );
};

export default WinStreaks;
