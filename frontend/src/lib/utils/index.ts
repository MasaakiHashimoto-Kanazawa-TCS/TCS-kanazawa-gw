/**
 * 基本的なユーティリティ関数
 */

/**
 * クラス名を結合する
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 日付をフォーマットする
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Tokyo'
  };

  return dateObj.toLocaleDateString('ja-JP', { ...defaultOptions, ...options });
}

/**
 * 数値をフォーマットする
 */
export function formatNumber(value: number, decimals: number = 1): string {
  return value.toFixed(decimals);
}

/**
 * 温度をフォーマットする
 */
export function formatTemperature(value: number): string {
  return `${formatNumber(value, 1)}°C`;
}

/**
 * pHをフォーマットする
 */
export function formatPH(value: number): string {
  return `pH ${formatNumber(value, 2)}`;
}

/**
 * データタイプに応じた値のフォーマット
 */
export function formatValue(value: number, dataType: string): string {
  switch (dataType) {
    case 'temperature':
      return formatTemperature(value);
    case 'pH':
      return formatPH(value);
    default:
      return formatNumber(value);
  }
}

/**
 * データタイプの表示名を取得
 */
export function getDataTypeLabel(dataType: string): string {
  const labels: Record<string, string> = {
    temperature: '温度',
    pH: 'pH'
  };
  return labels[dataType] || dataType;
}

/**
 * 時間範囲の表示名を取得
 */
export function getTimeRangeLabel(timeRange: string): string {
  const labels: Record<string, string> = {
    '24h': '過去24時間',
    '7d': '過去7日間',
    '30d': '過去30日間'
  };
  return labels[timeRange] || timeRange;
}

/**
 * エラーメッセージを取得
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '不明なエラーが発生しました';
}

/**
 * 遅延実行（デバウンス）
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 値が閾値範囲内かチェック
 */
export function isWithinThreshold(
  value: number,
  threshold: { min: number; max: number }
): boolean {
  return value >= threshold.min && value <= threshold.max;
}

/**
 * 閾値違反の種類を取得
 */
export function getThresholdViolationType(
  value: number,
  threshold: { min: number; max: number }
): 'high' | 'low' | null {
  if (value > threshold.max) return 'high';
  if (value < threshold.min) return 'low';
  return null;
}