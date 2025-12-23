import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface StockPriceCardProps {
  stock: StockPrice;
  onClick?: () => void;
}

const StockPriceCard = ({ stock, onClick }: StockPriceCardProps) => {
  const isPositive = stock.change >= 0;
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        onClick && "hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{stock.symbol}</CardTitle>
            <p className="text-sm text-gray-600 truncate">{stock.name}</p>
          </div>
          <Badge variant={isPositive ? "default" : "destructive"} className="ml-2">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-2xl font-bold">₹{stock.price.toFixed(2)}</div>
            <div className={cn(
              "text-sm font-medium",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? "+" : ""}₹{stock.change.toFixed(2)}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Live Price
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockPriceCard;