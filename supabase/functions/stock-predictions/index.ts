import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Indian stock symbols that are commonly available
const ALLOWED_STOCKS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
  'LT.NS', 'ASIANPAINT.NS', 'AXISBANK.NS', 'MARUTI.NS', 'SUNPHARMA.NS',
  'ULTRACEMCO.NS', 'TITAN.NS', 'WIPRO.NS', 'NESTLEIND.NS', 'POWERGRID.NS'
];

interface StockData {
  date: string;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface PredictionResult {
  stockId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  predictedPrice: number;
  confidenceLevel: number;
  timeFrame: string;
  reasonings: string[];
  changePercent: number;
}

async function fetchStockData(symbol: string, days: number = 30): Promise<StockData[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const period1 = Math.floor(startDate.getTime() / 1000);
    const period2 = Math.floor(endDate.getTime() / 1000);
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/download/${symbol}?period1=${period1}&period2=${period2}&interval=1d&events=history`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
    
    const csvData = await response.text();
    const lines = csvData.split('\n').slice(1); // Skip header
    
    const stockData: StockData[] = [];
    for (const line of lines) {
      if (line.trim()) {
        const [date, , high, low, close, , volume] = line.split(',');
        stockData.push({
          date,
          close: parseFloat(close),
          high: parseFloat(high),
          low: parseFloat(low),
          volume: parseInt(volume) || 0
        });
      }
    }
    
    return stockData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return [];
  }
}

function calculateMovingAverage(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  return slice.reduce((sum, val) => sum + val, 0) / slice.length;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  
  const gains = changes.slice(-period).map(change => change > 0 ? change : 0);
  const losses = changes.slice(-period).map(change => change < 0 ? -change : 0);
  
  const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period;
  const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function generatePrediction(stockData: StockData[], symbol: string): PredictionResult {
  if (stockData.length === 0) {
    throw new Error(`No data available for ${symbol}`);
  }
  
  const prices = stockData.map(d => d.close);
  const currentPrice = prices[prices.length - 1];
  
  // Technical analysis
  const sma5 = calculateMovingAverage(prices, 5);
  const sma20 = calculateMovingAverage(prices, 20);
  const rsi = calculateRSI(prices);
  
  // Volume analysis
  const volumes = stockData.map(d => d.volume);
  const avgVolume = calculateMovingAverage(volumes, 10);
  const recentVolume = volumes[volumes.length - 1];
  
  // Price momentum
  const priceChange7d = prices.length >= 7 ? (currentPrice - prices[prices.length - 7]) / prices[prices.length - 7] : 0;
  const priceChange30d = prices.length >= 30 ? (currentPrice - prices[prices.length - 30]) / prices[prices.length - 30] : 0;
  
  // Volatility
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length);
  
  // Generate prediction based on technical indicators
  let bullishSignals = 0;
  let bearishSignals = 0;
  const reasonings: string[] = [];
  
  // Moving average signals
  if (sma5 > sma20) {
    bullishSignals++;
    reasonings.push("Short-term moving average above long-term average");
  } else {
    bearishSignals++;
    reasonings.push("Short-term moving average below long-term average");
  }
  
  // RSI signals
  if (rsi < 30) {
    bullishSignals++;
    reasonings.push("RSI indicates oversold conditions");
  } else if (rsi > 70) {
    bearishSignals++;
    reasonings.push("RSI indicates overbought conditions");
  } else {
    reasonings.push("RSI in neutral territory");
  }
  
  // Volume signals
  if (recentVolume > avgVolume * 1.2) {
    if (priceChange7d > 0) {
      bullishSignals++;
      reasonings.push("High volume supporting upward price movement");
    } else {
      bearishSignals++;
      reasonings.push("High volume supporting downward price movement");
    }
  }
  
  // Momentum signals
  if (priceChange7d > 0.02) {
    bullishSignals++;
    reasonings.push("Strong positive momentum over past week");
  } else if (priceChange7d < -0.02) {
    bearishSignals++;
    reasonings.push("Negative momentum over past week");
  }
  
  // Calculate prediction
  const trendStrength = (bullishSignals - bearishSignals) / Math.max(bullishSignals + bearishSignals, 1);
  const baseChange = trendStrength * 0.05; // Max 5% change
  const volatilityAdjustment = volatility * 2; // Adjust for volatility
  
  const predictedChange = baseChange + (Math.random() - 0.5) * volatilityAdjustment;
  const predictedPrice = currentPrice * (1 + predictedChange);
  
  // Calculate confidence
  const signalStrength = Math.abs(bullishSignals - bearishSignals);
  const dataQuality = Math.min(stockData.length / 30, 1); // More data = higher confidence
  const confidenceLevel = Math.round((signalStrength * 15 + dataQuality * 30 + 40 + Math.random() * 15));
  
  // Get stock name (simplified mapping)
  const stockNames: { [key: string]: string } = {
    'RELIANCE.NS': 'Reliance Industries Ltd.',
    'TCS.NS': 'Tata Consultancy Services',
    'INFY.NS': 'Infosys Ltd.',
    'HDFCBANK.NS': 'HDFC Bank Ltd.',
    'ICICIBANK.NS': 'ICICI Bank Ltd.',
    'HINDUNILVR.NS': 'Hindustan Unilever Ltd.',
    'SBIN.NS': 'State Bank of India',
    'BHARTIARTL.NS': 'Bharti Airtel Ltd.',
    'ITC.NS': 'ITC Ltd.',
    'KOTAKBANK.NS': 'Kotak Mahindra Bank'
  };
  
  return {
    stockId: symbol.replace('.NS', ''),
    symbol: symbol.replace('.NS', ''),
    name: stockNames[symbol] || symbol.replace('.NS', ''),
    currentPrice: Math.round(currentPrice * 100) / 100,
    predictedPrice: Math.round(predictedPrice * 100) / 100,
    confidenceLevel: Math.max(50, Math.min(95, confidenceLevel)),
    timeFrame: volatility > 0.03 ? "1 week" : volatility > 0.02 ? "2 weeks" : "1 month",
    reasonings: reasonings.slice(0, 3),
    changePercent: ((predictedPrice - currentPrice) / currentPrice) * 100
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const symbols = url.searchParams.get('symbols')?.split(',') || ALLOWED_STOCKS.slice(0, 8);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    console.log(`Generating predictions for symbols: ${symbols.join(', ')}`);
    
    const predictions: PredictionResult[] = [];
    
    for (const symbol of symbols) {
      if (!ALLOWED_STOCKS.includes(symbol)) {
        console.log(`Skipping invalid symbol: ${symbol}`);
        continue;
      }
      
      try {
        const stockData = await fetchStockData(symbol, days);
        if (stockData.length > 0) {
          const prediction = generatePrediction(stockData, symbol);
          predictions.push(prediction);
          console.log(`Generated prediction for ${symbol}: ${prediction.predictedPrice}`);
        }
      } catch (error) {
        console.error(`Error generating prediction for ${symbol}:`, error);
      }
    }
    
    return new Response(JSON.stringify({ predictions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in stock-predictions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});