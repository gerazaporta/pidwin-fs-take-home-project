import { Request, Response } from "express";
import { AuthRequest, WagerRequest } from "../types/index.js";
import gameService from "../services/game-service.js";

const placeWager = async (req: AuthRequest, res: Response) => {
  const { amount, isLucky7Wager }: WagerRequest = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid wager amount" });
    }

    // Place the wager
    const result = await gameService.placeWager(userId, amount, isLucky7Wager);

    if (result.success) {
      return res.status(200).json({ message: result.message, wager: result.wager });
    } else {
      return res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error("Place wager error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export default placeWager;