/**
 * 植物関連の型定義
 */

export interface Plant {
  id: string;
  name: string;
  species: string;
  location: string;
  device_id: string;
  created_at: string;
  updated_at: string;
  thresholds: ThresholdConfig;
}

export interface ThresholdConfig {
  temperature: { min: number; max: number };
  ph: { min: number; max: number };
  // 将来的な拡張のための予約フィールド
  [key: string]: { min: number; max: number };
}

export interface CreatePlantRequest {
  name: string;
  species: string;
  location: string;
  device_id: string;
  thresholds: ThresholdConfig;
}

export interface UpdatePlantRequest {
  name?: string;
  species?: string;
  location?: string;
  thresholds?: Partial<ThresholdConfig>;
}

// デモ用のデフォルト植物データ（実際のシステム構成に合わせて調整）
export const DEFAULT_PLANT: Plant = {
  id: 'plant-001',
  name: 'バジル',
  species: 'Ocimum basilicum',
  location: '温室A',
  device_id: 'sensor_001', // 実際のシステムでは設定ファイルから取得
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  thresholds: {
    temperature: { min: 18, max: 28 },
    ph: { min: 6.0, max: 7.5 }
  }
};

// デフォルト閾値設定
export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  temperature: { min: 18, max: 28 },
  ph: { min: 6.0, max: 7.5 }
};