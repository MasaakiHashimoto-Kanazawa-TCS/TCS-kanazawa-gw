/**
 * センサーデータ関連の型定義
 */

// 現在サポートされているデータタイプ（将来の拡張を考慮）
export type DataType = 'temperature' | 'ph';

// 将来的な拡張のためのコメント
// export type DataType = 'temperature' | 'ph' | 'humidity' | 'pressure' | 'soil_moisture' | 'light';

export interface SensorData {
  timestamp: string; // ISO 8601形式
  value: number;
  device_id: string;
  location: string;
}

export interface DataSummary {
  average: number;
  minimum: number;
  maximum: number;
  count: number;
  period: string;
}

export interface GetDataParams {
  data_type: DataType;
  start_time?: string;
  end_time?: string;
  limit?: number;
}

export interface GetSummaryParams {
  data_type: DataType;
  period?: 'hour' | 'day' | 'week' | 'month';
  start_time?: string;
  end_time?: string;
}

export type TimeRange = '24h' | '7d' | '30d';

export interface TimeRangeOption {
  value: TimeRange;
  label: string;
  days: number;
}