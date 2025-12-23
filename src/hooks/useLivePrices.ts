import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type PriceInfo = {
  symbol: string;
  name?: string;
  price: number;
  change?: number;
  changePercent?: number;
};

export function useLivePrices(initialSymbols: string[] = [], intervalMs = 5000) {
  const [prices, setPrices] = useState<Record<string, PriceInfo>>({});
  const symbolsRef = useRef<string[]>(initialSymbols);
  const timerRef = useRef<number | null>(null);

  const fetchPrices = useCallback(async (symbols?: string[]) => {
    const toFetchRaw = symbols || symbolsRef.current || [];
    const toFetch = toFetchRaw.map((s) => (s.includes(".NS") ? s : `${s}.NS`));
    if (toFetch.length === 0) return {} as Record<string, PriceInfo>;

    try {
      // Use Supabase Edge Function `get-stock-data` for each symbol so we match other pages
      const promises = toFetch.map((symbol) =>
        supabase.functions.invoke("get-stock-data", { body: { symbol } }).then(({ data, error }) => {
          if (error || !data?.currentPrice) return null;
          const cp = data.currentPrice;
          // compute percent change: prefer provided percent, otherwise compute from previousClose if available
          const pct = cp.regularMarketChangePercent ?? (cp.previousClose ? (cp.diff / cp.previousClose) * 100 : 0);
          return {
            symbol: cp.symbol?.replace(".NS", "") || symbol.replace(".NS", ""),
            name: cp.longName || cp.shortName || cp.symbol,
            price: cp.price || 0,
            change: cp.diff || 0,
            changePercent: typeof pct === 'number' ? pct : 0,
          } as PriceInfo;
        })
      );

      const results = await Promise.all(promises);
      const map: Record<string, PriceInfo> = {};
      results.filter(Boolean).forEach((p: any) => {
        map[p.symbol] = p;
      });

      setPrices((prev) => ({ ...prev, ...map }));
      return map;
    } catch (err) {
      console.error("useLivePrices fetch error:", err);
      return {} as Record<string, PriceInfo>;
    }
  }, []);

  const start = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => fetchPrices(), intervalMs);
  }, [fetchPrices, intervalMs]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setSymbols = useCallback((symbols: string[]) => {
    symbolsRef.current = symbols;
    fetchPrices(symbols);
  }, [fetchPrices]);

  useEffect(() => {
    // initial
    if (initialSymbols.length > 0) fetchPrices(initialSymbols);
    start();
    return () => stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { prices, fetchPrices, setSymbols, start, stop } as const;
}

export default useLivePrices;
