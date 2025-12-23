import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import NavigationBar from "@/components/NavigationBar";
import { supabase } from "../lib/supabaseClient.ts";
import { ArrowUp, ArrowDown } from "lucide-react";

const stocks = [
  "ETERNAL.NS","RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
  "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS",
  "LT.NS", "BAJFINANCE.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS",
  "WIPRO.NS", "ADANIENT.NS", "ULTRACEMCO.NS", "NESTLEIND.NS", "ONGC.NS"
];

// Define a type for our stock data
type StockData = {
  price: number;
  diff: number;
};

const Predictions = () => {
  const navigate = useNavigate();
  const [stockData, setStockData] = useState<Record<string, StockData>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchAllPrices = async () => {
      setLoading(true);
      const promises = stocks.map((symbol) =>
        supabase.functions
          .invoke("get-stock-data", {
            body: { symbol },
          })
          .then(({ data, error }) => {
            if (error) {
              console.error(`Error for ${symbol}:`, error);
              return null;
            }
            return { [symbol]: data.currentPrice };
          })
      );

      const results = await Promise.all(promises);
      const mergedData = results
        .filter(Boolean)
        .reduce((acc, current) => ({ ...acc, ...current }), {});

      setStockData(mergedData);
      setLoading(false);
    };

    fetchAllPrices();
    const interval = setInterval(fetchAllPrices, 300000); // Refresh every 5 mins
    return () => clearInterval(interval);
  }, []);

  const handleStockClick = (symbol: string) => {
    navigate(`/predictions/${symbol}`);
  };

  const filteredStocks = stocks.filter((stock) =>
    stock.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <main className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            AI Stock <span className="text-learngreen-600">Predictions</span>
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Track real-time prices and use AI to predict future trends.
          </p>
        </div>

        <div className="mb-8 max-w-md mx-auto">
          <Input
            type="text"
            placeholder="Search for a stock symbol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="loader border-t-4 border-learngreen-600 rounded-full w-12 h-12 animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredStocks.map((symbol) => {
              const data = stockData[symbol];
              const price = data?.price ?? 0;
              const diff = data?.diff ?? 0;
              const isPositive = diff >= 0;

              return (
                <Card
                  key={symbol}
                  onClick={() => handleStockClick(symbol)}
                  className="cursor-pointer hover:border-learngreen-500 hover:shadow-lg transition-all"
                >
                  <CardHeader className="p-4">
                    <CardTitle>{symbol}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{price.toFixed(2)}
                    </p>
                    <div
                      className={`mt-1 font-semibold flex items-center text-sm ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? (
                        <ArrowUp className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDown className="h-4 w-4 mr-1" />
                      )}
                      <span>{diff.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Predictions;