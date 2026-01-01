export type UserProfile = {
  id: string;
  name: string;
  age: number;
  experience: "Beginner" | "Intermediate" | "Advanced";
  riskTolerance: "Low" | "Medium" | "High";
  investmentGoals: (
    | "Wealth Building"
    | "Retirement"
    | "Short Term Gains"
    | "Learning"
    | "Other"
  )[];
  points: number;
  lastLoginDate: string;
  portfolioValue: number;
  investmentHorizon?: "short-term" | "medium-term" | "long-term";
  sectorPreferences?: string[];
  email?: string;
};

export type Stock = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  sector: string;
  logo?: string;
};

export type Portfolio = {
  userId: string;
  cash: number;
  holdings: PortfolioHolding[];
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
};

export type PortfolioHolding = {
  stockId: string;
  symbol: string;
  name: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  change: number;
  changePercent: number;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  points: number;
  questions: QuizQuestion[];
};

export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
  // Difficulty helps drive adaptive quiz flow. Values used in question pools: "Easy", "Medium", "Difficult"
  difficulty?: "Easy" | "Medium" | "Difficult";
};

export type Prediction = {
  stockId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  predictedPrice: number;
  confidenceLevel: number;
  timeFrame: string;
  reasonings: string[];
};

export type StockSuggestion = {
  stockId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  reason: string;
  riskLevel: "Low" | "Medium" | "High";
  potentialGain: number;
  score?: number;
  reasonings?: string[];
};

// Progression & analytics domain types

export type GameType = "quiz" | "market_challenge";

export type GameOutcome = "win" | "loss" | "completed";

// Difficulty is stored in the database as lower-case values
// and mapped from the QuizQuestion.difficulty field.
export type DifficultyLevel = "easy" | "medium" | "hard";

export type KnowledgeSource = "quiz" | "challenge" | "mixed";

// Mirrors the user_game_activity table shape used for progression tracking.
export interface UserGameActivity {
  id: string;
  user_id: string;
  game_type: GameType;
  game_id: string;
  difficulty_level: DifficultyLevel;
  score: number; // normalized 0–100 per game
  outcome: GameOutcome;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Mirrors the user_knowledge_progress snapshot table.
export interface UserKnowledgeProgress {
  id: string;
  user_id: string;
  knowledge_score: number; // overall market knowledge 0–100
  calculated_from: KnowledgeSource;
  snapshot_date: string; // YYYY-MM-DD
  created_at: string;
}

export type KnowledgeTrend = "improving" | "stagnant" | "declining";

// Joined view used by the frontend graph: one row per game completion
// with the corresponding knowledge snapshot applied after that game.
export interface KnowledgeProgressPoint extends UserKnowledgeProgress {
  gameType: GameType;
  gameId: string;
  activityScore: number;
  outcome: GameOutcome;
  activityMetadata: Record<string, unknown> | null;
}
