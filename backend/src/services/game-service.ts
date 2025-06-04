import Game from "../models/game.js";
import Wager from "../models/wager.js";
import User from "../models/user.js";
import socketService from "./socket-service.js";
import mongoose from "mongoose";

class GameService {
  private currentGame: any = null;
  private nextRollTimeout: NodeJS.Timeout | null = null;
  private readonly ROLL_INTERVAL = 15000; // 15 seconds
  private readonly WAGER_CUTOFF = 5000; // 5 seconds before roll

  constructor() {
    this.startGameCycle();
  }

  async startGameCycle() {
    if (this.nextRollTimeout) {
      clearTimeout(this.nextRollTimeout);
    }

    await this.createNewGame();

    this.nextRollTimeout = setTimeout(() => {
      this.resolveGame();
    }, this.ROLL_INTERVAL);
  }

  async createNewGame() {
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const sum = dice1 + dice2;
    const isLucky7 = sum === 7;

    this.currentGame = await Game.create({
      rollTime: new Date(Date.now() + this.ROLL_INTERVAL),
      dice1,
      dice2,
      isLucky7,
    });

    return this.currentGame;
  }

  async resolveGame() {
    if (!this.currentGame) {
      await this.startGameCycle();
      return;
    }

    const gameId = this.currentGame._id;
    const wagers = await Wager.find({ gameId });

    for (const wager of wagers) {
      await this.resolveWager(wager);
    }

    await this.broadcastRecentRolls();
    await this.broadcastWinStreaks();
    await this.startGameCycle();
  }

  async broadcastRecentRolls() {
    try {
      const usersWithWagers = await Wager.distinct('userId');

      for (const userId of usersWithWagers) {
        await this.sendUserRecentRolls(userId.toString());
      }
    } catch (error) {
      console.error("Error broadcasting recent rolls:", error);
    }
  }

  async sendUserRecentRolls(userId: string) {
    try {
      const userWagers = await Wager.find({ 
        userId: new mongoose.Types.ObjectId(userId) 
      })
        .sort({ _id: -1 })
        .limit(5)
        .lean();

      if (userWagers.length === 0) {
        return;
      }

      const gameIds = userWagers.map(wager => wager.gameId);
      const games = await Game.find({ 
        _id: { $in: gameIds } 
      }).lean();

      const gamesMap = new Map(
        games.map(game => [game._id.toString(), game])
      );

      const formattedRolls = userWagers.map((wager) => {
        const game = gamesMap.get(wager.gameId.toString());
        if (!game) return null;

        const diceSum = game.dice1 + game.dice2;
        return {
          id: game._id,
          dice1: game.dice1,
          dice2: game.dice2,
          diceSum,
          isLucky7: game.isLucky7,
          rollTime: game.rollTime,
          amount: wager.amount,
          hasWon: wager.hasWon,
          isLucky7Wager: wager.isLucky7Wager
        };
      }).filter(roll => roll !== null);

      socketService.sendUserRecentRolls(userId, formattedRolls);
    } catch (error) {
      console.error(`Error sending recent rolls to user ${userId}:`, error);
    }
  }

  async broadcastWinStreaks() {
    try {
      const topWinStreaks = await Wager.find({ winStreak: { $gt: 0 } })
        .sort({ winStreak: -1 })
        .limit(10)
        .populate('userId', 'name email')
        .lean();

      const formattedStreaks = topWinStreaks.map((wager) => {
        return {
          // @ts-ignore
          username: wager.userId.name,
          winStreak: wager.winStreak,
          amount: wager.amount,
          isLucky7Wager: wager.isLucky7Wager,
        };
      });

      socketService.broadcastWinStreaks(formattedStreaks);
    } catch (error) {
      console.error("Error broadcasting win streaks:", error);
    }
  }

  async resolveWager(wager: any) {
    const user = await User.findById(wager.userId);
    if (!user) return;

    const game = await Game.findById(wager.gameId);
    if (!game) return;

    const hasWon = wager.isLucky7Wager === game.isLucky7;

    let winnings = 0;
    if (hasWon) {
      if (wager.isLucky7) {
        winnings = wager.amount * 7;
      } else {
        winnings = wager.amount;
      }
    }

    user.tokens += winnings;
    await user.save();

    socketService.updateUserTokens(user._id.toString(), user.tokens);
    socketService.notifyRollResult(user._id.toString(), hasWon, winnings, game.dice1 + game.dice2);

    wager.hasWon = hasWon;

    if (hasWon) {
      const previousWagers = await Wager.find({ 
        userId: wager.userId,
        _id: { $ne: wager._id },
        hasWon: true
      })
      .sort({ _id: -1 })
      .limit(1);

      if (previousWagers.length > 0 && previousWagers[0].winStreak > 0) {
        wager.winStreak = previousWagers[0].winStreak + 1;
      } else {
        wager.winStreak = 1;
      }
    } else {
      wager.winStreak = 0;
    }

    await wager.save();
    await this.sendUserRecentRolls(user._id.toString());
  }

  async placeWager(userId: string, amount: number, isLucky7Wager: boolean) {
    if (!this.currentGame) {
      return { success: false, message: "No active game available" };
    }

    const timeUntilRoll = this.currentGame.rollTime.getTime() - Date.now();
    if (timeUntilRoll < this.WAGER_CUTOFF) {
      return { success: false, message: "Too late to place a wager for this roll" };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.tokens < amount) {
      return { success: false, message: "Not enough tokens" };
    }

    user.tokens -= amount;
    await user.save();

    socketService.updateUserTokens(user._id.toString(), user.tokens);

    const wager = await Wager.create({
      userId,
      gameId: this.currentGame._id,
      amount,
      isLucky7Wager,
      hasWon: null,
      winStreak: 0,
    });

    return { 
      success: true, 
      message: `Wager placed successfully! ${amount} tokens on ${isLucky7Wager ? "Lucky 7" : "Not Lucky 7"}`,
      wager
    };
  }

  getCurrentGame() {
    return this.currentGame;
  }

  getTimeUntilNextRoll() {
    if (!this.currentGame) return 0;
    return Math.max(0, this.currentGame.rollTime.getTime() - Date.now());
  }

  isWageringAllowed() {
    return this.getTimeUntilNextRoll() > this.WAGER_CUTOFF;
  }
}

// Create a singleton instance
const gameService = new GameService();

export default gameService;
