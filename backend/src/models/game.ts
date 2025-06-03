import mongoose, { Schema } from "mongoose";
import { GameDocument } from "../types/index.js";

interface GameModel extends GameDocument {}

const gameSchema: Schema = new Schema({
  rollTime: { type: Date, required: true },
  dice1: { type: Number, required: true, min: 1, max: 6 },
  dice2: { type: Number, required: true, min: 1, max: 6 },
  isLucky7: { type: Boolean, required: true },
});

export default mongoose.model<GameModel>("Game", gameSchema);
