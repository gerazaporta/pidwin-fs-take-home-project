import { Request, Response } from "express";
import Game from "../models/game.js";
import Wager from "../models/wager.js";
import mongoose from "mongoose";

const getRecentRolls = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const userWagers = await Wager.find({ 
      userId: new mongoose.Types.ObjectId(userId as string) 
    })
      .sort({ _id: -1 })
      .limit(5)
      .lean();

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

    res.status(200).json(formattedRolls);
  } catch (error) {
    console.error("Error fetching recent rolls:", error);
    res.status(500).json({ message: "Error fetching recent rolls" });
  }
};

export default getRecentRolls;
