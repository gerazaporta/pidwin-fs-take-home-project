import { Request, Response } from "express";
import gameService from "../services/game-service.js";

const getGameStatus = async (req: Request, res: Response) => {
  try {
    const currentGame = gameService.getCurrentGame();
    
    if (!currentGame) {
      return res.status(404).json({ message: "No active game" });
    }

    const timeUntilNextRoll = gameService.getTimeUntilNextRoll();
    const isWageringAllowed = gameService.isWageringAllowed();

    res.status(200).json({
      gameId: currentGame._id,
      timeUntilNextRoll,
      isWageringAllowed,
    });
  } catch (error) {
    console.error("Get game status error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export default getGameStatus;