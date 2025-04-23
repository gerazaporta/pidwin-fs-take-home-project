import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest, UserJwtPayload } from "../types/index.js";

const auth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "No authentication token, access denied" });
    }

    const isCustomAuth = token.length < 500;

    let decodedData;

    if (token && isCustomAuth) {
      decodedData = jwt.verify(token, "test") as UserJwtPayload;
      req.userId = decodedData?._id;
    } else {
      decodedData = jwt.decode(token) as { sub?: string };
      req.userId = decodedData?.sub;
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

export default auth;