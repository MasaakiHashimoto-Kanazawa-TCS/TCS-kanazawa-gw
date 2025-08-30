/**
 * アプリケーション定数
 */

// API設定
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_TIMEOUT = 10000; // 10秒

// アプリケーション設定
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Plant Monitor';
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';
export const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
export const IS_DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';

// デバッグ用ログ
console.log('Constants loaded:', {
  NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT,
  IS_DEVELOPMENT,
  IS_DEBUG
});

// データ更新間隔（ミリ秒）
export const DATA_REFRESH_INTERVAL = 30000; // 30秒
export const REALTIME_UPDATE_INTERVAL = 5000; // 5秒

// チャート設定
export const CHART_COLORS = {
  temperature: '#ef4444', // red-500
  ph: '#8b5cf6', // violet-500
  primary: '#3b82f6', // blue-500
  secondary: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  success: '#10b981', // emerald-500
  info: '#3b82f6' // blue-500
} as const;

// 時間範囲オプション
export const TIME_RANGE_OPTIONS = [
  { value: '24h' as const, label: '過去24時間', days: 1 },
  { value: '7d' as const, label: '過去7日間', days: 7 },
  { value: '30d' as const, label: '過去30日間', days: 30 },
  { value: '150d' as const, label: '過去150日間', days: 150 },
  { value: 'custom' as const, label: 'カスタム期間', days: 0 }
];

// データタイプオプション
export const DATA_TYPE_OPTIONS = [
  { value: 'temperature' as const, label: '温度', unit: '°C', color: CHART_COLORS.temperature },
  { value: 'ph' as const, label: 'pH', unit: '', color: CHART_COLORS.ph }
];

// アラート設定
export const ALERT_SEVERITY_COLORS = {
  low: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  medium: 'bg-orange-100 text-orange-800 border-orange-200',
  high: 'bg-red-100 text-red-800 border-red-200'
} as const;

// レスポンシブブレークポイント
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

// ローカルストレージキー
export const STORAGE_KEYS = {
  THEME: 'plant-monitor-theme',
  SETTINGS: 'plant-monitor-settings',
  ALERTS: 'plant-monitor-alerts'
} as const;

// デフォルト設定
export const DEFAULT_SETTINGS = {
  theme: 'light' as const,
  autoRefresh: true,
  refreshInterval: DATA_REFRESH_INTERVAL,
  showAlerts: true,
  defaultTimeRange: '24h' as const,
  defaultDataType: 'temperature' as const
} as const;

// システム設定（実際のDynamoDBデータ構造に合わせて）
export const SYSTEM_CONFIG = {
  DEFAULT_DEVICE_ID: 'sensor_001',
  DEFAULT_LOCATION: '温室A',
  SUPPORTED_DATA_TYPES: ['temperature', 'ph'] as const
} as const;