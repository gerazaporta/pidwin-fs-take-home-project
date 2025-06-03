import Game from "../models/game.js";
import Wager from "../models/wager.js";
import User from "../models/user.js";
import socketService from "./socket-service.js";

class GameService {
  private currentGame: any = null;
  private nextRollTimeout: NodeJS.Timeout | null = null;
  private readonly ROLL_INTERVAL = 15000; // 15 seconds
  private readonly WAGER_CUTOFF = 5000; // 5 seconds before roll

  constructor() {
    this.startGameCycle();
  }

  // Start the game cycle
  async startGameCycle() {
    // Clear any existing timeout
    if (this.nextRollTimeout) {
      clearTimeout(this.nextRollTimeout);
    }

    // Create a new game
    await this.createNewGame();

    // Schedule the next roll
    this.nextRollTimeout = setTimeout(() => {
      this.resolveGame();
    }, this.ROLL_INTERVAL);
  }

  // Create a new game
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

  // Resolve the current game
  async resolveGame() {
    if (!this.currentGame) {
      await this.startGameCycle();
      return;
    }

    const gameId = this.currentGame._id;

    // Find all wagers for this game
    const wagers = await Wager.find({ gameId });

    // Process each wager
    for (const wager of wagers) {
      await this.resolveWager(wager);
    }

    // Start a new game cycle
    await this.startGameCycle();
  }

  // Resolve a single wager
  async resolveWager(wager: any) {
    const user = await User.findById(wager.userId);
    if (!user) return;

    const game = await Game.findById(wager.gameId);
    if (!game) return;

    // Determine if the wager won
    const hasWon = wager.isLucky7Wager === game.isLucky7;

    // Calculate winnings
    let winnings = 0;
    if (hasWon) {
      if (game.isLucky7) {
        // 7x for lucky 7 win
        winnings = wager.amount * 7;
      } else {
        // 1x for non-lucky 7 win
        winnings = wager.amount;
      }
    }

    // Update user tokens
    user.tokens += winnings;
    await user.save();

    // Emit token update event
    socketService.updateUserTokens(user._id.toString(), user.tokens);

    // Update wager with result
    wager.hasWon = hasWon;

    // Update win streak
    if (hasWon) {
      wager.winStreak = 1;
    } else {
      wager.winStreak = 0;
    }

    await wager.save();
  }

  // Place a wager
  async placeWager(userId: string, amount: number, isLucky7Wager: boolean) {
    // Check if there's a current game
    if (!this.currentGame) {
      return { success: false, message: "No active game available" };
    }

    // Check if we're past the cutoff time for wagering
    const timeUntilRoll = this.currentGame.rollTime.getTime() - Date.now();
    if (timeUntilRoll < this.WAGER_CUTOFF) {
      return { success: false, message: "Too late to place a wager for this roll" };
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Check if user has enough tokens
    if (user.tokens < amount) {
      return { success: false, message: "Not enough tokens" };
    }

    // Deduct tokens from user
    user.tokens -= amount;
    await user.save();

    // Emit token update event
    socketService.updateUserTokens(user._id.toString(), user.tokens);

    // Create the wager
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

  // Get the current game
  getCurrentGame() {
    return this.currentGame;
  }

  // Get time until next roll
  getTimeUntilNextRoll() {
    if (!this.currentGame) return 0;
    return Math.max(0, this.currentGame.rollTime.getTime() - Date.now());
  }

  // Check if wagering is allowed
  isWageringAllowed() {
    return this.getTimeUntilNextRoll() > this.WAGER_CUTOFF;
  }
}

// Create a singleton instance
const gameService = new GameService();

export default gameService;
