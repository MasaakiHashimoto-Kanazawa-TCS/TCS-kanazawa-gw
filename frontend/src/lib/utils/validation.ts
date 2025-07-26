/**
 * データバリデーションユーティリティ
 */

import type { SensorData, DataType, Plant, ThresholdConfig } from '@/types';

/**
 * センサーデータのバリデーション
 */
export function validateSensorData(data: any): data is SensorData {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.timestamp === 'string' &&
    typeof data.value === 'number' &&
    typeof data.device_id === 'string' &&
    typeof data.location === 'string' &&
    !isNaN(new Date(data.timestamp).getTime()) &&
    isFinite(data.value)
  );
}

/**
 * センサーデータ配列のバリデーション
 */
export function validateSensorDataArray(data: any[]): SensorData[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(validateSensorData);
}

/**
 * データタイプのバリデーション
 */
export function validateDataType(dataType: any): dataType is DataType {
  return typeof dataType === 'string' && ['temperature', 'ph'].includes(dataType);
}

/**
 * 閾値設定のバリデーション
 */
export function validateThresholdConfig(config: any): config is ThresholdConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const requiredKeys = ['temperature', 'ph'];
  
  for (const key of requiredKeys) {
    const threshold = config[key];
    if (
      typeof threshold !== 'object' ||
      threshold === null ||
      typeof threshold.min !== 'number' ||
      typeof threshold.max !== 'number' ||
      threshold.min >= threshold.max ||
      !isFinite(threshold.min) ||
      !isFinite(threshold.max)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * 植物データのバリデーション
 */
export function validatePlant(data: any): data is Plant {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    typeof data.species === 'string' &&
    typeof data.location === 'string' &&
    typeof data.device_id === 'string' &&
    typeof data.created_at === 'string' &&
    typeof data.updated_at === 'string' &&
    validateThresholdConfig(data.thresholds) &&
    !isNaN(new Date(data.created_at).getTime()) &&
    !isNaN(new Date(data.updated_at).getTime())
  );
}

/**
 * 数値範囲のバリデーション
 */
export function validateNumberRange(
  value: number,
  min: number = -Infinity,
  max: number = Infinity
): boolean {
  return (
    typeof value === 'number' &&
    isFinite(value) &&
    value >= min &&
    value <= max
  );
}

/**
 * 温度値のバリデーション
 */
export function validateTemperature(value: number): boolean {
  return validateNumberRange(value, -50, 100); // -50°C to 100°C
}

/**
 * pH値のバリデーション
 */
export function validatePH(value: number): boolean {
  return validateNumberRange(value, 0, 14); // pH 0-14
}

/**
 * データタイプに応じた値のバリデーション
 */
export function validateValueForDataType(value: number, dataType: DataType): boolean {
  switch (dataType) {
    case 'temperature':
      return validateTemperature(value);
    case 'ph':
      return validatePH(value);
    default:
      return isFinite(value);
  }
}

/**
 * タイムスタンプのバリデーション
 */
export function validateTimestamp(timestamp: string): boolean {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.getTime() > 0;
}

/**
 * 時間範囲のバリデーション
 */
export function validateTimeRange(timeRange: string): boolean {
  return ['24h', '7d', '30d'].includes(timeRange);
}

/**
 * APIレスポンスの基本構造をバリデーション
 */
export function validateApiResponse(response: any): boolean {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof response.status === 'string' &&
    ['success', 'error'].includes(response.status)
  );
}