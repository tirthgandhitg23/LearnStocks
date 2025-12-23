
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

// Sample data for the chart
const data = [
  { date: "Mon", value: 10000 },
  { date: "Tue", value: 10200 },
  { date: "Wed", value: 10150 },
  { date: "Thu", value: 10450 },
  { date: "Fri", value: 10300 },
  { date: "Sat", value: 10800 },
  { date: "Sun", value: 11000 },
];

interface PortfolioChartProps {
  title: string;
  description?: string;
  value: number;
  change: number;
  changePercent: number;
  data?: { date: string; value: number }[];
  className?: string;
  height?: number;
}

export function PortfolioChart({
  title,
  description,
  value,
  change,
  changePercent,
  data: chartData = data,
  className,
  height = 200,
}: PortfolioChartProps) {
  const isPositive = change >= 0;
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className="text-2xl font-bold">₹{value.toFixed(2)}</div>
        <div className={cn("flex items-center", isPositive ? "text-green-600" : "text-red-600")}>
          <span>{isPositive ? "+" : ""}{change.toFixed(2)}</span>
          <span className="text-xs ml-1">({isPositive ? "+" : ""}{changePercent.toFixed(2)}%)</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={isPositive ? "#4CAF50" : "#EF4444"}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={isPositive ? "#4CAF50" : "#EF4444"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis hide={true} domain={["dataMin - 100", "dataMax + 100"]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Date
                            </span>
                            <span className="font-bold text-xs">
                              {payload[0].payload.date}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">
                              Value
                            </span>
                            <span className="font-bold text-xs">
                              ₹{payload[0].value}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={isPositive ? "#4CAF50" : "#EF4444"}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
