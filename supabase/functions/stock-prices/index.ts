import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_STOCKS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
  'LT.NS', 'ASIANPAINT.NS', 'AXISBANK.NS', 'MARUTI.NS', 'SUNPHARMA.NS'
];

interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${symbol}`);
    }
    
    const data = await response.json();
    const result = data.chart.result[0];
    
    if (!result) {
      throw new Error(`No data found for ${symbol}`);
    }
    
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;
    
    // Stock name mapping
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
      'KOTAKBANK.NS': 'Kotak Mahindra Bank',
      'LT.NS': 'Larsen & Toubro Ltd.',
      'ASIANPAINT.NS': 'Asian Paints Ltd.',
      'AXISBANK.NS': 'Axis Bank Ltd.',
      'MARUTI.NS': 'Maruti Suzuki India Ltd.',
      'SUNPHARMA.NS': 'Sun Pharmaceutical Industries'
    };
    
    return {
      symbol: symbol.replace('.NS', ''),
      name: stockNames[symbol] || symbol.replace('.NS', ''),
      price: currentPrice,
      change: change,
      changePercent: changePercent
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const symbols = url.searchParams.get('symbols')?.split(',') || ALLOWED_STOCKS.slice(0, 10);
    
    console.log(`Fetching prices for symbols: ${symbols.join(', ')}`);
    
    const pricePromises = symbols
      .filter(symbol => ALLOWED_STOCKS.includes(symbol))
      .map(symbol => fetchStockPrice(symbol));
    
    const prices = await Promise.all(pricePromises);
    const validPrices = prices.filter((price): price is StockPrice => price !== null);
    
    return new Response(JSON.stringify({ prices: validPrices }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in stock-prices function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});