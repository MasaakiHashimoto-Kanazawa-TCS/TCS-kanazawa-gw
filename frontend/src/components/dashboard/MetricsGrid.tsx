/**
 * メトリクスグリッドコンポーネント
 */

import type { ThresholdConfig } from "@/types";
import { Card, CardContent, Badge } from "@/components/ui";
import { formatValue, isWithinThreshold } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface MetricsGridProps {
  metrics: {
    temperature?: number;
    pH?: number;
    [key: string]: number | undefined;
  };
  thresholds: ThresholdConfig | undefined;
  className?: string;
  showTrends?: boolean;
  previousMetrics?: {
    temperature?: number;
    pH?: number;
    [key: string]: number | undefined;
  };
}

interface MetricCardProps {
  title: string;
  value: number | undefined;
  unit: string;
  icon: string;
  threshold: { min: number; max: number } | undefined;
  trend?: "up" | "down" | "stable";
  className?: string;
}

function MetricCard({ title, value, unit, icon, threshold, trend, className }: MetricCardProps) {
  const isHealthy = value !== undefined && threshold ? isWithinThreshold(value, threshold) : null;

  const statusColor =
    isHealthy === null
      ? "text-gray-400"
      : isHealthy
        ? "text-green-600 dark:text-green-400"
        : "text-red-600 dark:text-red-400";

  const bgColor =
    isHealthy === null
      ? "bg-gray-50 dark:bg-gray-700"
      : isHealthy
        ? "bg-green-50 dark:bg-green-900/20"
        : "bg-red-50 dark:bg-red-900/20";

  const borderColor =
    isHealthy === null
      ? "border-gray-200 dark:border-gray-600"
      : isHealthy
        ? "border-green-200 dark:border-green-800"
        : "border-red-200 dark:border-red-800";

  const getTrendIcon = () => {
    if (!trend) return null;

    switch (trend) {
      case "up":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 17l9.2-9.2M17 17V7H7"
            />
          </svg>
        );
      case "down":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 7l-9.2 9.2M7 7v10h10"
            />
          </svg>
        );
      case "stable":
        return (
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={cn(bgColor, borderColor, "border", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-xl">{icon}</span>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
          </div>
          {trend && <div className="flex items-center space-x-1">{getTrendIcon()}</div>}
        </div>

        <div className="space-y-2">
          {/* 現在の値 */}
          <div className="flex items-baseline justify-between">
            <span className={cn("text-2xl font-bold", statusColor)}>
              {value !== undefined ? formatValue(value, title.toLowerCase()) : "--"}
            </span>
            <Badge
              variant={isHealthy === null ? "default" : isHealthy ? "success" : "danger"}
              size="sm"
            >
              {isHealthy === null ? "不明" : isHealthy ? "正常" : "異常"}
            </Badge>
          </div>

          {/* 閾値範囲 */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {threshold ? (
              <>
                正常範囲: {threshold.min}
                {unit} - {threshold.max}
                {unit}
              </>
            ) : (
              "閾値未設定"
            )}
          </div>

          {/* 閾値からの乖離度を視覚的に表示 */}
          {value !== undefined && threshold && (
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  isHealthy ? "bg-green-500" : "bg-red-500",
                )}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, ((value - threshold.min) / (threshold.max - threshold.min)) * 100),
                  )}%`,
                }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MetricsGrid({
  metrics,
  thresholds,
  className,
  showTrends = false,
  previousMetrics,
}: MetricsGridProps) {
  // トレンドの計算
  const getTrend = (current?: number, previous?: number): "up" | "down" | "stable" | undefined => {
    if (!showTrends || current === undefined || previous === undefined) {
      return undefined;
    }

    const diff = current - previous;
    const threshold = 0.1; // 変化の閾値

    if (Math.abs(diff) < threshold) return "stable";
    return diff > 0 ? "up" : "down";
  };

  const metricConfigs = [
    {
      key: "temperature",
      title: "温度",
      unit: "°C",
      icon: "🌡️",
      threshold: thresholds?.temperature,
    },
    {
      key: "pH",
      title: "pH",
      unit: "",
      icon: "⚗️",
      threshold: thresholds?.pH,
    },
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
      {metricConfigs.map((config) => (
        <MetricCard
          key={config.key}
          title={config.title}
          value={metrics[config.key]}
          unit={config.unit}
          icon={config.icon}
          threshold={config.threshold}
          trend={getTrend(metrics[config.key], previousMetrics?.[config.key])}
        />
      ))}
    </div>
  );
}

/**
 * サマリーメトリクスコンポーネント
 */
export interface SummaryMetricsProps {
  data: {
    temperature?: { current: number; avg: number; min: number; max: number };
    pH?: { current: number; avg: number; min: number; max: number };
  };
  thresholds: ThresholdConfig;
  className?: string;
}

export function SummaryMetrics({ data, thresholds, className }: SummaryMetricsProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(data).map(([key, values]) => {
        if (!values) return null;

        const config =
          key === "temperature"
            ? { title: "温度", unit: "°C", icon: "🌡️", threshold: thresholds.temperature }
            : { title: "pH", unit: "", icon: "⚗️", threshold: thresholds.pH };

        return (
          <Card key={key}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">{config.icon}</span>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {config.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">現在</div>
                  <div className="font-bold text-lg">{formatValue(values.current, key)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">平均</div>
                  <div className="font-medium">{formatValue(values.avg, key)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">最小</div>
                  <div className="font-medium">{formatValue(values.min, key)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">最大</div>
                  <div className="font-medium">{formatValue(values.max, key)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
