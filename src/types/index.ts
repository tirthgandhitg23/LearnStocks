export type UserProfile = {
  id: string;
  name: string;
  age: number;
  experience: 'Beginner' | 'Intermediate' | 'Advanced';
  riskTolerance: 'Low' | 'Medium' | 'High';
  investmentGoals: ('Wealth Building' | 'Retirement' | 'Short Term Gains' | 'Learning' | 'Other')[];
  points: number;
  lastLoginDate: string;
  portfolioValue: number;
  investmentHorizon?: 'short-term' | 'medium-term' | 'long-term';
  sectorPreferences?: string[];
  email?: string;
}

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
}

export type Portfolio = {
  userId: string;
  cash: number;
  holdings: PortfolioHolding[];
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
}

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
}

export type Quiz = {
  id: string;
  title: string;
  description: string;
  points: number;
  questions: QuizQuestion[];
}

export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
  explanation: string;
  // Difficulty helps drive adaptive quiz flow. Values used in question pools: "Easy", "Medium", "Difficult"
  difficulty?: "Easy" | "Medium" | "Difficult";
}

export type Prediction = {
  stockId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  predictedPrice: number;
  confidenceLevel: number;
  timeFrame: string;
  reasonings: string[];
}

export type StockSuggestion = {
  stockId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  reason: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  potentialGain: number;
  score?: number;
  reasonings?: string[];
}
