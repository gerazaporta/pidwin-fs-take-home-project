import express, { Express } from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from 'dotenv';
import http from 'http';
import userRouter from "./src/api/user.js";
import gameRouter from "./src/api/game.js";
import "./src/services/game-service.js";
import socketService from "./src/services/socket-service.js";

dotenv.config();

const app: Express = express();
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));

app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'upgrade', 
    'sec-websocket-extensions', 
    'sec-websocket-key', 
    'sec-websocket-version'
  ],
  credentials: true
}));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is healthy" });
});

app.use("/api/user", userRouter);
app.use("/api/game", gameRouter);

const PORT: string | number = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize socket service
socketService.initialize(server);

mongoose
  .connect(process.env.MONGODB_URL || '')
  .then(() => {
    server.listen(PORT, () => console.log(`Server Started On Port ${PORT}`));
  })
  .catch((error) => console.log(error.message));
