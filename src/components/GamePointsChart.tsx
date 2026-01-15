import * as React from "react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts";
import { cn } from "@/lib/utils";

interface GamePointsChartProps {
    data: { date: string; points: number }[];
    totalPoints: number;
    loading?: boolean;
    className?: string;
}

const GamePointsChart: React.FC<GamePointsChartProps> = ({
    data,
    totalPoints,
    loading,
    className,
}) => {
    const hasData = data && data.length > 0;

    const chartData = React.useMemo(() => {
        // Determine cumulative points over time
        // Data is expected to be { date: 'YYYY-MM-DD', points: number (daily total) }
        // We sort by date and compute running total
        const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

        let runningTotal = 0;
        return sorted.map((d) => {
            runningTotal += d.points;
            return {
                dateLabel: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                dailyPoints: d.points,
                cumulativePoints: runningTotal
            };
        });
    }, [data]);

    const chartConfig = {
        cumulativePoints: {
            label: "Total Points",
            color: "hsl(142.1 76.2% 36.3%)", // Brand Green
        },
    } as const;

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
                <div>
                    <CardTitle>Points Progression</CardTitle>
                    <CardDescription>
                        Cumulative points earned from games and quizzes over time.
                    </CardDescription>
                </div>
                <div className="text-xl font-bold text-learngreen-700">
                    {totalPoints} pts
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {loading ? (
                    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                        Loading points history...
                    </div>
                ) : !hasData ? (
                    <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                        No points earned yet. Play games to start your progression!
                    </div>
                ) : (
                    <ChartContainer config={chartConfig} className="w-full h-64">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
                        >
                            <defs>
                                <linearGradient id="fillPoints" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="dateLabel"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <ChartTooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) => (
                                            <span className="font-medium">{value}</span>
                                        )}
                                    />
                                }
                            />
                            <Area
                                type="monotone"
                                dataKey="cumulativePoints"
                                stroke="hsl(142.1 76.2% 36.3%)"
                                fill="url(#fillPoints)"
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 4 }}
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    );
};

export default GamePointsChart;
