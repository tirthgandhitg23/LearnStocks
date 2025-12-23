
import { Card, CardContent } from "@/components/ui/card";
import { Stock } from "@/types";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StockCardProps {
  stock: Stock;
  onSelect?: (stock: Stock) => void;
  className?: string;
}

const StockCard = ({ stock, onSelect, className }: StockCardProps) => {
  const isPositiveChange = stock.change >= 0;
  
  return (
    <Card 
      className={cn("cursor-pointer hover:shadow-md transition-shadow", className)}
      onClick={() => onSelect && onSelect(stock)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center">
              <div className="font-semibold">{stock.symbol}</div>
              <div className="text-xs bg-gray-100 text-gray-600 rounded px-1 ml-2">
                {stock.sector}
              </div>
            </div>
            <div className="text-sm text-gray-600 truncate max-w-[200px]">{stock.name}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold">₹{stock.price.toFixed(2)}</div>
            <div 
              className={cn(
                "flex items-center text-sm", 
                isPositiveChange ? "text-green-600" : "text-red-600"
              )}
            >
              {isPositiveChange ? (
                <ArrowUp className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDown className="h-3 w-3 mr-1" />
              )}
              <span>
                {isPositiveChange ? "+" : ""}
                {stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-500">
          <div>Vol: {(stock.volume / 1000000).toFixed(2)}M</div>
          <div>MCap: {(stock.marketCap / 10000000).toFixed(2)}Cr</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockCard;
