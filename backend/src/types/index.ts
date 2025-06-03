import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Document } from 'mongoose';

export interface UserDocument {
  _id: string;
  name: string;
  email: string;
  password: string;
  id?: string;
  tokens: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export interface PasswordChangeRequest {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface UserJwtPayload extends JwtPayload {
  _id: string;
  name: string;
  email: string;
  password: string;
  tokens: number;
}

export interface AuthRequest extends Request {
  userId?: string;
}

export interface GameDocument extends Document {
  _id: string;
  rollTime: Date;
  dice1: number;
  dice2: number;
  isLucky7: boolean;
}

export interface WagerDocument extends Document {
  _id: string;
  userId: string;
  gameId: string;
  amount: number;
  isLucky7Wager: boolean;
  hasWon: boolean;
  winStreak: number;
}

export interface WagerRequest {
  amount: number;
  isLucky7Wager: boolean;
}
