import express from "express";
import placeWager from "../controllers/place-wager.js";
import getGameStatus from "../controllers/get-game-status.js";
import auth from "../utils/auth.js";

const router = express.Router();

router.post("/placeWager", auth, placeWager);
router.get("/status", getGameStatus);

export default router;