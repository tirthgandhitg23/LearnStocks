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
import type { KnowledgeProgressPoint, KnowledgeTrend } from "@/types";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface KnowledgeProgressChartProps {
  data: KnowledgeProgressPoint[];
  trend: KnowledgeTrend | null;
  loading?: boolean;
  className?: string;
}

const trendLabelMap: Record<KnowledgeTrend, string> = {
  improving: "Improving",
  stagnant: "Stable",
  declining: "Declining",
};

const trendColorMap: Record<KnowledgeTrend, string> = {
  improving: "text-emerald-600",
  stagnant: "text-gray-600",
  declining: "text-red-600",
};

const MarketKnowledgeProgressChart: React.FC<KnowledgeProgressChartProps> = ({
  data,
  trend,
  loading,
  className,
}) => {
  const hasData = data && data.length > 0;

  const chartData = React.useMemo(
    () =>
      (data || []).map((point, index) => {
        const date = new Date(point.snapshot_date);
        const label = isNaN(date.getTime())
          ? point.snapshot_date
          : date.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });

        const gameLabel =
          point.gameType === "quiz"
            ? `Quiz: ${
                (point.activityMetadata?.title as string) || point.gameId
              }`
            : `Challenge: ${
                (point.activityMetadata?.symbol as string) || point.gameId
              }`;

        return {
          index,
          dateLabel: label,
          knowledgeScore: point.knowledge_score,
          gameLabel,
          rawScore: point.activityScore,
          outcome: point.outcome,
        };
      }),
    [data]
  );

  const chartConfig = {
    knowledgeScore: {
      label: "Knowledge Score",
      color: "hsl(142.1 76.2% 36.3%)",
    },
  } as const;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>Market Knowledge Progression</CardTitle>
          <CardDescription>
            Tracks how your overall market understanding evolves after each
            game.
          </CardDescription>
        </div>
        {trend && (
          <div
            className={cn(
              "text-sm font-medium px-2 py-1 rounded-full border bg-white",
              trendColorMap[trend]
            )}
          >
            {trendLabelMap[trend]}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            Loading progression...
          </div>
        ) : !hasData ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No progression data yet. Complete a quiz or market challenge to get
            started.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-64">
            <LineChart
              data={chartData}
              margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      if (!payload?.length) return null;
                      const p = payload[0].payload as any;
                      return (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{p.dateLabel}</span>
                          <span className="text-xs text-muted-foreground">
                            {p.gameLabel}
                          </span>
                        </div>
                      );
                    }}
                    formatter={(value, _name, item) => {
                      const p = item?.payload as any;
                      const outcomeLabel =
                        p.outcome === "win"
                          ? "Improved"
                          : p.outcome === "loss"
                          ? "Declined"
                          : "Completed";

                      return (
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-xs text-muted-foreground">
                            {outcomeLabel}
                          </span>
                          <span className="font-mono font-medium">
                            {Number(value).toFixed(1)} / 100
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Game score: {Number(p.rawScore).toFixed(1)} / 100
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="knowledgeScore"
                stroke="hsl(142.1 76.2% 36.3%)"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketKnowledgeProgressChart;
