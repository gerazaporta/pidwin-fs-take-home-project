import mongoose, { Schema } from "mongoose";
import { WagerDocument } from "../types/index.js";

interface WagerModel extends WagerDocument {}

const wagerSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
  amount: { type: Number, required: true, min: 1 },
  isLucky7Wager: { type: Boolean, required: true },
  hasWon: { type: Boolean, default: null },
  winStreak: { type: Number, default: 0 },
});

export default mongoose.model<WagerModel>("Wager", wagerSchema);
