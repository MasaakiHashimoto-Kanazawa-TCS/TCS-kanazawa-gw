/**
 * 植物カードコンポーネント
 */

import { useMemo } from "react";
import type { Plant, SensorData } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { formatValue, formatDate, isWithinThreshold } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface PlantCardProps {
  plant: Plant;
  temperatureData?: SensorData;
  phData?: SensorData;
  onSelect?: (plantId: string) => void;
  className?: string;
  showDetails?: boolean;
}

export function PlantCard({
  plant,
  temperatureData,
  phData,
  onSelect,
  className,
  showDetails = true,
}: PlantCardProps) {
  // 健康状態の評価
  const healthStatus = useMemo(() => {
    const issues: string[] = [];
    let status: "healthy" | "warning" | "critical" = "healthy";

    // 温度チェック
    if (temperatureData && plant.thresholds?.temperature) {
      const tempThreshold = plant.thresholds.temperature;
      if (!isWithinThreshold(temperatureData.value, tempThreshold)) {
        if (temperatureData.value < tempThreshold.min) {
          issues.push("温度が低すぎます");
          status = "warning";
        } else if (temperatureData.value > tempThreshold.max) {
          issues.push("温度が高すぎます");
          status = "critical";
        }
      }
    }

    // pHチェック
    if (phData && plant.thresholds?.pH) {
      const phThreshold = plant.thresholds.pH;
      if (!isWithinThreshold(phData.value, phThreshold)) {
        if (phData.value < phThreshold.min) {
          issues.push("pHが低すぎます（酸性）");
          status = status === "critical" ? "critical" : "warning";
        } else if (phData.value > phThreshold.max) {
          issues.push("pHが高すぎます（アルカリ性）");
          status = status === "critical" ? "critical" : "warning";
        }
      }
    }

    return { status, issues };
  }, [plant.thresholds, temperatureData, phData]);

  // ステータスバッジの設定
  const statusBadge = useMemo(() => {
    switch (healthStatus.status) {
      case "healthy":
        return { variant: "success" as const, text: "正常", icon: "✅" };
      case "warning":
        return { variant: "warning" as const, text: "注意", icon: "⚠️" };
      case "critical":
        return { variant: "danger" as const, text: "危険", icon: "🚨" };
      default:
        return { variant: "default" as const, text: "不明", icon: "❓" };
    }
  }, [healthStatus.status]);

  const handleClick = () => {
    onSelect?.(plant.id);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        onSelect && "cursor-pointer hover:border-green-300",
        className,
      )}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              <span className="text-2xl">🌱</span>
              <span>{plant.name}</span>
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plant.species}</p>
          </div>
          <Badge variant={statusBadge.variant} size="sm">
            <span className="mr-1">{statusBadge.icon}</span>
            {statusBadge.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* 基本情報 */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">場所:</span>
              <span className="ml-2 font-medium">{plant.location}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">デバイス:</span>
              <span className="ml-2 font-medium">{plant.device_id}</span>
            </div>
          </div>

          {/* センサーデータ */}
          {showDetails && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                現在の環境データ
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 温度 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🌡️</span>
                      <span className="text-sm font-medium">温度</span>
                    </div>
                    {temperatureData && (
                      <span
                        className={cn(
                          "text-sm font-bold",
                          plant.thresholds?.temperature &&
                            isWithinThreshold(temperatureData.value, plant.thresholds.temperature)
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {formatValue(temperatureData.value, "temperature")}
                      </span>
                    )}
                  </div>
                  {temperatureData && plant.thresholds?.temperature && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      範囲: {plant.thresholds.temperature.min}°C -{" "}
                      {plant.thresholds.temperature.max}°C
                    </div>
                  )}
                  {!temperatureData && <div className="mt-1 text-xs text-gray-400">データなし</div>}
                </div>

                {/* pH */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">⚗️</span>
                      <span className="text-sm font-medium">pH</span>
                    </div>
                    {phData && (
                      <span
                        className={cn(
                          "text-sm font-bold",
                          plant.thresholds?.pH &&
                            isWithinThreshold(phData.value, plant.thresholds.pH)
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400",
                        )}
                      >
                        {formatValue(phData.value, "pH")}
                      </span>
                    )}
                  </div>
                  {phData && plant.thresholds?.pH && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      範囲: pH {plant.thresholds.pH.min} - {plant.thresholds.pH.max}
                    </div>
                  )}
                  {!phData && <div className="mt-1 text-xs text-gray-400">データなし</div>}
                </div>
              </div>
            </div>
          )}

          {/* 問題がある場合の警告 */}
          {healthStatus.issues.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <h5 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                注意が必要な項目:
              </h5>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {healthStatus.issues.map((issue, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 最終更新時刻 */}
          {(temperatureData || phData) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              最終更新:{" "}
              {formatDate(
                temperatureData?.timestamp || phData?.timestamp || new Date().toISOString(),
                { hour: "2-digit", minute: "2-digit" },
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * コンパクトな植物カード（リスト表示用）
 */
export function CompactPlantCard({
  plant,
  temperatureData,
  phData,
  onSelect,
  className,
}: PlantCardProps) {
  const healthStatus = useMemo(() => {
    let status: "healthy" | "warning" | "critical" = "healthy";

    if (
      temperatureData &&
      plant.thresholds?.temperature &&
      !isWithinThreshold(temperatureData.value, plant.thresholds.temperature)
    ) {
      status = temperatureData.value > plant.thresholds.temperature.max ? "critical" : "warning";
    }

    if (phData && plant.thresholds?.pH && !isWithinThreshold(phData.value, plant.thresholds.pH)) {
      status = status === "critical" ? "critical" : "warning";
    }

    return status;
  }, [plant.thresholds, temperatureData, phData]);

  const statusColor = {
    healthy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  }[healthStatus];

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200",
        onSelect && "cursor-pointer hover:border-green-300",
        className,
      )}
      onClick={() => onSelect?.(plant.id)}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">🌱</span>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white">{plant.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{plant.location}</p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {temperatureData && (
          <div className="text-right">
            <div className="text-sm font-medium">
              {formatValue(temperatureData.value, "temperature")}
            </div>
            <div className="text-xs text-gray-500">温度</div>
          </div>
        )}
        {phData && (
          <div className="text-right">
            <div className="text-sm font-medium">{formatValue(phData.value, "pH")}</div>
            <div className="text-xs text-gray-500">pH</div>
          </div>
        )}
        <div className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor)}>
          {healthStatus === "healthy" ? "正常" : healthStatus === "warning" ? "注意" : "危険"}
        </div>
      </div>
    </div>
  );
}
