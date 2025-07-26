/**
 * データ変換ユーティリティ
 */

import type { SensorData, DataType, Alert, AlertType, ThresholdConfig } from '@/types';
import { ALERT_CONFIGS } from '@/types';
import { isWithinThreshold, getThresholdViolationType } from './index';

/**
 * APIレスポンスからセンサーデータに変換
 */
export function transformSensorData(rawData: any[]): SensorData[] {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.map(item => ({
    timestamp: item.timestamp || new Date().toISOString(),
    value: parseFloat(item.value) || 0,
    device_id: item.device_id || '',
    location: item.location || ''
  }));
}

/**
 * センサーデータからチャート用データに変換
 */
export function transformToChartData(data: SensorData[]) {
  return data.map(item => ({
    timestamp: item.timestamp,
    value: item.value,
    formattedTime: new Date(item.timestamp).toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    formattedDate: new Date(item.timestamp).toLocaleDateString('ja-JP')
  }));
}

/**
 * 時間範囲に基づいてデータをフィルタリング
 */
export function filterDataByTimeRange(data: SensorData[], timeRange: string): SensorData[] {
  const now = new Date();
  let startTime: Date;

  switch (timeRange) {
    case '24h':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      return data;
  }

  return data.filter(item => new Date(item.timestamp) >= startTime);
}

/**
 * センサーデータからアラートを生成
 */
export function generateAlerts(
  data: SensorData[],
  thresholds: ThresholdConfig,
  dataType: DataType,
  plantId: string = 'plant-001'
): Alert[] {
  const alerts: Alert[] = [];
  
  // 最新のデータポイントのみをチェック
  const latestData = data[data.length - 1];
  if (!latestData) return alerts;

  const threshold = thresholds[dataType];
  if (!threshold) return alerts;

  const violationType = getThresholdViolationType(latestData.value, threshold);
  if (!violationType) return alerts;

  const alertType: AlertType = `${dataType}_${violationType}` as AlertType;
  const config = ALERT_CONFIGS[alertType];
  
  if (config) {
    alerts.push({
      id: `alert-${Date.now()}`,
      plant_id: plantId,
      type: alertType,
      severity: violationType === 'high' ? 'high' : 'medium',
      message: config.defaultMessage,
      timestamp: latestData.timestamp,
      acknowledged: false,
      resolved: false,
      recommendedAction: config.recommendedAction
    });
  }

  return alerts;
}

/**
 * データの統計情報を計算
 */
export function calculateDataStats(data: SensorData[]) {
  if (data.length === 0) {
    return {
      average: 0,
      minimum: 0,
      maximum: 0,
      count: 0
    };
  }

  const values = data.map(item => item.value);
  
  return {
    average: values.reduce((sum, val) => sum + val, 0) / values.length,
    minimum: Math.min(...values),
    maximum: Math.max(...values),
    count: values.length
  };
}

/**
 * データを時間間隔でグループ化
 */
export function groupDataByInterval(
  data: SensorData[],
  intervalMinutes: number = 60
): SensorData[] {
  if (data.length === 0) return [];

  const grouped: { [key: string]: SensorData[] } = {};
  
  data.forEach(item => {
    const date = new Date(item.timestamp);
    const intervalStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      Math.floor(date.getHours() * 60 / intervalMinutes) * intervalMinutes / 60
    );
    
    const key = intervalStart.toISOString();
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  // 各グループの平均値を計算
  return Object.entries(grouped).map(([timestamp, items]) => ({
    timestamp,
    value: items.reduce((sum, item) => sum + item.value, 0) / items.length,
    device_id: items[0].device_id,
    location: items[0].location
  })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * モックデータ生成（開発・テスト用）
 */
export function generateMockSensorData(
  dataType: DataType,
  count: number = 100,
  timeRangeHours: number = 24
): SensorData[] {
  const data: SensorData[] = [];
  const now = new Date();
  const interval = (timeRangeHours * 60 * 60 * 1000) / count; // ミリ秒

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now.getTime() - (count - i - 1) * interval);
    
    let value: number;
    switch (dataType) {
      case 'temperature':
        // 18-28度の範囲で変動
        value = 23 + Math.sin(i * 0.1) * 3 + (Math.random() - 0.5) * 2;
        break;
      case 'ph':
        // 6.0-7.5の範囲で変動
        value = 6.75 + Math.sin(i * 0.05) * 0.5 + (Math.random() - 0.5) * 0.3;
        break;
      default:
        value = Math.random() * 100;
    }

    data.push({
      timestamp: timestamp.toISOString(),
      value: Math.round(value * 100) / 100, // 小数点2桁まで
      device_id: 'sensor_001',
      location: '温室A'
    });
  }

  return data;
}