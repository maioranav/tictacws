import dotenv from "dotenv";
import { ApiConfig } from "../types/main.type";

// Environment constraints
dotenv.config();

export const apiConfig: ApiConfig = {
   name: "TicTacToc in WebSocket",
   port: Number(process.env.PORT) || 3000,
   controllers: []
};
