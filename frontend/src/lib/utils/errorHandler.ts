/**
 * エラーハンドリングユーティリティ
 */

import { ApiError } from '@/lib/api/client';

/**
 * エラーメッセージの日本語化
 */
const ERROR_MESSAGES: Record<string, string> = {
  // ネットワークエラー
  'NETWORK_ERROR': 'ネットワークエラーが発生しました',
  'TIMEOUT': 'リクエストがタイムアウトしました',
  'CONNECTION_FAILED': 'サーバーに接続できませんでした',
  
  // HTTPエラー
  'HTTP_400': '不正なリクエストです',
  'HTTP_401': '認証が必要です',
  'HTTP_403': 'アクセスが拒否されました',
  'HTTP_404': 'データが見つかりません',
  'HTTP_500': 'サーバーエラーが発生しました',
  'HTTP_502': 'サーバーが利用できません',
  'HTTP_503': 'サービスが一時的に利用できません',
  
  // アプリケーションエラー
  'INVALID_PARAMETER': 'パラメータが正しくありません',
  'DATA_NOT_FOUND': 'データが見つかりません',
  'DATABASE_ERROR': 'データベースエラーが発生しました',
  'INTERNAL_ERROR': '内部エラーが発生しました',
  
  // デフォルト
  'UNKNOWN_ERROR': '不明なエラーが発生しました'
};

/**
 * エラーを日本語メッセージに変換
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] || error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * エラーの重要度を判定
 */
export function getErrorSeverity(error: unknown): 'low' | 'medium' | 'high' {
  if (error instanceof ApiError) {
    if (error.status >= 500) return 'high';
    if (error.status >= 400) return 'medium';
    return 'low';
  }
  
  return 'medium';
}

/**
 * エラーが再試行可能かどうか判定
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    // ネットワークエラーやサーバーエラーは再試行可能
    return error.status === 0 || error.status >= 500 || error.code === 'TIMEOUT';
  }
  
  return false;
}

/**
 * エラーログ出力
 */
export function logError(error: unknown, context?: string): void {
  const message = getErrorMessage(error);
  const severity = getErrorSeverity(error);
  
  const logData = {
    message,
    severity,
    context,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error
  };
  
  if (severity === 'high') {
    console.error('[ERROR]', logData);
  } else if (severity === 'medium') {
    console.warn('[WARN]', logData);
  } else {
    console.info('[INFO]', logData);
  }
}

/**
 * エラー通知用のデータを生成
 */
export function createErrorNotification(error: unknown) {
  return {
    id: `error-${Date.now()}`,
    type: 'error' as const,
    title: 'エラーが発生しました',
    message: getErrorMessage(error),
    severity: getErrorSeverity(error),
    timestamp: new Date().toISOString(),
    retryable: isRetryableError(error)
  };
}