import mongoose, { Schema } from "mongoose";
import { UserDocument } from "../types/index.js";

interface UserModel extends UserDocument {}

const userSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  id: { type: String },
  tokens: { type: Number, default: 0 },
});

export default mongoose.model<UserModel>("User", userSchema);
