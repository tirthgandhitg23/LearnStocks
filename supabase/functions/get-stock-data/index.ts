// This file is an Edge Function meant to run on Deno (Supabase functions).
// The repository's TypeScript tooling (tsc / TS Server) runs in the Node project
// context and doesn't understand Deno-specific imports like `https://deno.land/...`
// or the `npm:` specifier. That can show spurious errors in your editor.
//
// To avoid editor/type-check noise for this Deno-targeted file we disable
// TS checking here (it's still runnable by the Supabase/Deno runtime):
// @ts-nocheck
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import yahooFinance from "npm:yahoo-finance2";

// Add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { symbol, days } = await req.json();

    if (!symbol) {
      return new Response(
        JSON.stringify({ error: "Stock symbol is required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // ✅ Fetch current quote
    const quote = await (yahooFinance as any).quote(symbol);

    // Include additional fields so clients can compute % change and show names
    const currentPrice = {
      price: quote.regularMarketPrice,
      diff: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      previousClose: quote.regularMarketPreviousClose,
      shortName: quote.shortName,
      longName: quote.longName,
      symbol: quote.symbol,
    };

    let historicalData: { date: string; close: number }[] = [];

    // ✅ Fetch historical data if days is provided
    if (days) {
      const result = await (yahooFinance as any).historical(symbol, {
        period1: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000),
        period2: new Date(),
        interval: "1d",
      });

      historicalData = result.map((item: any) => ({
        date: item.date,
        close: item.close,
      }));
    }

    const data = {
      symbol,
      currentPrice,
      historicalData,
    };

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
