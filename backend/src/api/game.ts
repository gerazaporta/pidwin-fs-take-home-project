import express from "express";
import placeWager from "../controllers/place-wager.js";
import getGameStatus from "../controllers/get-game-status.js";
import getWinStreaks from "../controllers/get-win-streaks.js";
import getRecentRolls from "../controllers/get-recent-rolls.js";
import auth from "../utils/auth.js";

const router = express.Router();

router.post("/placeWager", auth, placeWager);
router.get("/status", getGameStatus);
router.get("/winStreaks", getWinStreaks);
router.get("/recentRolls", getRecentRolls);

export default router;
