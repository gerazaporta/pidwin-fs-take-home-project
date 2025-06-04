import { Request, Response } from "express";
import Wager from "../models/wager.js";
import User from "../models/user.js";

const getWinStreaks = async (req: Request, res: Response) => {
  try {
    // Find the top 10 wagers with the longest win streaks
    const topWinStreaks = await Wager.find({ winStreak: { $gt: 0 } })
      .sort({ winStreak: -1 })
      .limit(10)
      .populate('userId', 'name email') // Get user details
      .lean();

    // Format the response
    const formattedStreaks = await Promise.all(
      topWinStreaks.map(async (wager) => {
        return {
          // @ts-ignore
          username: wager.userId.name,
          winStreak: wager.winStreak,
          amount: wager.amount,
          isLucky7Wager: wager.isLucky7Wager,
        };
      })
    );

    res.status(200).json(formattedStreaks);
  } catch (error) {
    console.error("Error fetching win streaks:", error);
    res.status(500).json({ message: "Error fetching win streaks" });
  }
};

export default getWinStreaks;
