
import { Stock } from "@/types";

// Map sectors to Indian stock symbols (would be expanded with more symbols in production)
export const sectorToStocks: Record<string, string[]> = {
  'Technology': ['TCS', 'INFY', 'WIPRO', 'HCLTECH'],
  'Pharmaceuticals': ['SUNPHARMA', 'DRREDDY', 'CIPLA', 'BIOCON'],
  'Automobiles': ['TATAMOTORS', 'MARUTI', 'MM', 'BAJAJ-AUTO'],
  'Banking': ['HDFCBANK', 'ICICIBANK', 'AXISBANK', 'KOTAKBANK'],
  'FMCG': ['ITC', 'HINDUNILVR', 'BRITANNIA', 'NESTLEIND'],
  'Energy': ['RELIANCE', 'ONGC', 'IOC', 'BPCL'],
  'Infrastructure': ['LT', 'ADANIPORTS', 'ACC', 'ULTRACEMCO'],
};

// Add the additional types needed for our recommendations
export interface StockRecommendation {
  stock: Stock;
  score: number;
  reasonings: string[];
}

export interface RecommendationParams {
  risk: 'Low' | 'Medium' | 'High';
  horizon: 'short-term' | 'medium-term' | 'long-term';
  sectors: string[];
  currentPortfolio: string[]; // Array of stock symbols the user already owns
  age?: number;
  investment?: number;
}

/**
 * Generate personalized stock recommendations based on user profile
 */
export const getPersonalizedRecommendations = (
  stocks: Stock[],
  params: RecommendationParams
): StockRecommendation[] => {
  const { risk, horizon, sectors, currentPortfolio } = params;
  
  // Filter stocks by selected sectors if specified
  let filteredStocks = stocks;
  if (sectors.length > 0) {
    filteredStocks = stocks.filter(stock => 
      sectors.includes(stock.sector)
    );
    
    // If no stocks match sectors, fall back to all stocks
    if (filteredStocks.length === 0) {
      filteredStocks = stocks;
    }
  }
  
  const recommendations: StockRecommendation[] = filteredStocks.map(stock => {
    let score = 0;
    const reasonings: string[] = [];
    
    // Score based on risk tolerance
    if (risk === "Low") {
      // Prefer large-cap stocks with low volatility
      if (stock.marketCap > 10000000000) {
        score += 2;
        reasonings.push("Large market cap suitable for low risk");
      }
      
      // Prefer stocks with low volatility
      if (Math.abs(stock.changePercent) < 1) {
        score += 2;
        reasonings.push("Low volatility matches your conservative profile");
      }
    } 
    else if (risk === "Medium") {
      // Prefer mid-cap stocks with moderate volatility
      if (stock.marketCap > 5000000000 && stock.marketCap < 10000000000) {
        score += 2;
        reasonings.push("Mid-sized company suitable for moderate risk");
      }
      
      // Moderate volatility
      if (Math.abs(stock.changePercent) >= 1 && Math.abs(stock.changePercent) < 2) {
        score += 1;
        reasonings.push("Moderate volatility aligns with your risk tolerance");
      }
    }
    else { // High risk
      // Prefer smaller-cap stocks with higher growth potential
      if (stock.marketCap < 5000000000) {
        score += 2;
        reasonings.push("Growth-oriented smaller company");
      }
      
      // Higher volatility might mean higher returns (but also higher risk)
      if (Math.abs(stock.changePercent) >= 2) {
        score += 2;
        reasonings.push("Higher volatility with growth potential");
      }
    }
    
    // Score based on investment horizon
    if (horizon === "short-term") {
      // For short-term, current momentum matters more
      if (stock.change > 0) {
        score += 1;
        reasonings.push("Positive momentum for short-term gains");
      }
    } 
    else if (horizon === "medium-term") {
      // For medium-term, sector prospects and current valuation matter
      if (["Banking", "Technology", "FMCG"].includes(stock.sector)) {
        score += 1;
        reasonings.push("Sector has good medium-term prospects");
      }
    }
    else { // long-term
      // For long-term, company fundamentals matter more
      if (stock.marketCap > 8000000000) {
        score += 1;
        reasonings.push("Strong fundamentals for long-term growth");
      }
    }
    
    // Penalize stocks already in the user's portfolio
    if (currentPortfolio.includes(stock.symbol)) {
      score -= 2;
      reasonings.push("Already in your portfolio - diversify instead");
    }
    
    return {
      stock,
      score,
      reasonings: reasonings.length > 0 ? reasonings : ["General recommendation based on market analysis"],
    };
  });
  
  // Sort by score (highest first) and return top 5
  return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
};

/**
 * Classify a stock's risk level based on volatility and market cap
 */
export const getRiskLevel = (stock: Stock): 'Low' | 'Medium' | 'High' => {
  if (stock.marketCap > 10000000000 && Math.abs(stock.changePercent) < 1) {
    return 'Low';
  } else if (stock.marketCap < 5000000000 || Math.abs(stock.changePercent) > 2) {
    return 'High';
  } else {
    return 'Medium';
  }
};

