import { mockStocks } from "@/data/mockStocks";

// Full objects used by both Trading Simulator and Market Challenges
export const predictionStocks = mockStocks;

// Just the symbols (e.g., for APIs, Edge Functions, and filtering)
export const predictionSymbols = mockStocks.map((s) => s.symbol);

export default predictionSymbols;
