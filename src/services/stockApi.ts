/**
 * Stock API service — routes all stock data through the Python FastAPI backend
 * which uses yfinance internally (handles Yahoo auth/cookies automatically).
 *
 * In development, Vite proxies `/py-api` → `http://localhost:8000`.
 * In production, set VITE_PY_API_BASE_URL to the deployed API URL.
 */

const getBaseUrl = (): string => {
  const env = (import.meta as any).env;
  return (env?.VITE_PY_API_BASE_URL || env?.VITE_API_BASE_URL || "/py-api").replace(/\/$/, "");
};

// ---------- Types ----------

export interface StockCurrentPrice {
  price: number;
  previousClose: number | null;
  diff: number;
  regularMarketChangePercent: number;
  shortName: string;
  longName: string;
  symbol: string;
}

export interface StockHistoricalPoint {
  date: string;
  close: number;
}

export interface StockQuoteResponse {
  symbol: string;
  currentPrice: StockCurrentPrice;
  historicalData: StockHistoricalPoint[];
}

export interface SearchQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  quoteType: "EQUITY" | "ETF" | "MUTUALFUND" | "INDEX" | "CURRENCY" | "FUTURE";
  exchange: string;
}

export interface SearchResponse {
  quotes: SearchQuote[];
  error?: string;
}

// ---------- API calls ----------

/**
 * Fetch a single stock quote (and optional history).
 * Drop-in replacement for `supabase.functions.invoke("get-stock-data", { body: { symbol, days } })`.
 */
export async function fetchStockData(
  symbol: string,
  days: number = 0,
): Promise<{ data: StockQuoteResponse | null; error: string | null }> {
  try {
    const base = getBaseUrl();
    const url = `${base}/stock/quote/${encodeURIComponent(symbol)}?days=${days}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text();
      return { data: null, error: text || `HTTP ${resp.status}` };
    }
    const data: StockQuoteResponse = await resp.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message || String(err) };
  }
}

/**
 * Batch-fetch quotes for multiple symbols in one request.
 * Returns a map: { "RELIANCE.NS": StockQuoteResponse, ... }
 */
export async function fetchStockBatch(
  symbols: string[],
): Promise<Record<string, StockQuoteResponse>> {
  if (!symbols.length) return {};
  try {
    const base = getBaseUrl();
    const resp = await fetch(`${base}/stock/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbols }),
    });
    if (!resp.ok) return {};
    return await resp.json();
  } catch {
    return {};
  }
}

/**
 * Search for stocks/assets.
 * Drop-in replacement for `supabase.functions.invoke("search-assets", { body: { query } })`.
 */
export async function searchAssets(query: string): Promise<SearchResponse> {
  if (!query?.trim()) return { quotes: [] };
  try {
    const base = getBaseUrl();
    const resp = await fetch(
      `${base}/stock/search?q=${encodeURIComponent(query.trim())}`,
    );
    if (!resp.ok) {
      const status = resp.status;
      if (status === 429) {
        return { quotes: [], error: "Rate limited. Try again in a moment." };
      }
      return { quotes: [], error: `HTTP ${status}` };
    }
    return await resp.json();
  } catch (err: any) {
    return { quotes: [], error: err?.message || String(err) };
  }
}
