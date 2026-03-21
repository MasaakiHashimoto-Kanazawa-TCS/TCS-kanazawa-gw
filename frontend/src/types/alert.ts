/**
 * アラート関連の型定義
 */

export interface Alert {
  id: string;
  plant_id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  recommendedAction?: string;
}

export type AlertType = "temperature_high" | "temperature_low" | "pH_high" | "pH_low";

// 将来的な拡張のためのコメント
// export type AlertType =
//   | 'temperature_high' | 'temperature_low'
//   | 'pH_high' | 'pH_low'
//   | 'humidity_high' | 'humidity_low'
//   | 'soil_moisture_low'
//   | 'light_low';

export type AlertSeverity = "low" | "medium" | "high";

export interface AlertConfig {
  type: AlertType;
  title: string;
  color: string;
  icon: string;
  defaultMessage: string;
  recommendedAction: string;
}

// アラート設定のマッピング
export const ALERT_CONFIGS: Record<AlertType, AlertConfig> = {
  temperature_high: {
    type: "temperature_high",
    title: "温度が高すぎます",
    color: "red",
    icon: "🌡️",
    defaultMessage: "温度が設定された上限を超えています",
    recommendedAction: "換気を行うか、日陰に移動してください",
  },
  temperature_low: {
    type: "temperature_low",
    title: "温度が低すぎます",
    color: "blue",
    icon: "🧊",
    defaultMessage: "温度が設定された下限を下回っています",
    recommendedAction: "暖房を使用するか、暖かい場所に移動してください",
  },
  pH_high: {
    type: "pH_high",
    title: "pHが高すぎます",
    color: "purple",
    icon: "⚗️",
    defaultMessage: "pHが設定された上限を超えています",
    recommendedAction: "pH調整剤を使用して酸性にしてください",
  },
  pH_low: {
    type: "pH_low",
    title: "pHが低すぎます",
    color: "orange",
    icon: "🧪",
    defaultMessage: "pHが設定された下限を下回っています",
    recommendedAction: "pH調整剤を使用してアルカリ性にしてください",
  },
};
