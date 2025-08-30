/**
 * アラート一覧コンポーネント
 */

'use client';

import type { Alert } from '@/types';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface AlertListProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  showResolved?: boolean;
  className?: string;
}

const severityStyles = {
  low: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  medium: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/20',
  high: 'border-l-red-500 bg-red-50 dark:bg-red-900/20'
};

const severityBadges = {
  low: 'warning',
  medium: 'warning',
  high: 'danger'
} as const;

const severityLabels = {
  low: '注意',
  medium: '警告',
  high: '緊急'
};

const typeLabels = {
  temperature_high: '温度高',
  temperature_low: '温度低',
  ph_high: 'pH高',
  ph_low: 'pH低'
} as const;

export function AlertList({
  alerts,
  onAcknowledge,
  onDismiss,
  showResolved = false,
  className
}: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">アラートはありません</p>
            <p className="text-sm">
              {showResolved ? 'アラートが登録されていません' : 'すべてのアラートが解決済みです'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {alerts.map((alert) => (
        <Card
          key={alert.id}
          className={cn(
            'border-l-4',
            severityStyles[alert.severity],
            alert.resolved && 'opacity-60'
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* ヘッダー */}
                <div className="flex items-center space-x-3 mb-2">
                  <Badge variant={severityBadges[alert.severity]} size="sm">
                    {severityLabels[alert.severity]}
                  </Badge>
                  <Badge variant="default" size="sm">
                    {typeLabels[alert.type as keyof typeof typeLabels] || alert.type}
                  </Badge>
                  {alert.acknowledged && (
                    <Badge variant="success" size="sm">
                      確認済み
                    </Badge>
                  )}
                  {alert.resolved && (
                    <Badge variant="default" size="sm">
                      解決済み
                    </Badge>
                  )}
                </div>

                {/* メッセージ */}
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {alert.message}
                </h3>

                {/* 推奨アクション */}
                {alert.recommendedAction && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    推奨アクション: {alert.recommendedAction}
                  </p>
                )}

                {/* タイムスタンプ */}
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {new Date(alert.timestamp).toLocaleString('ja-JP')}
                </p>
              </div>

              {/* アクションボタン */}
              {!alert.resolved && (
                <div className="flex items-center space-x-2 ml-4">
                  {onAcknowledge && !alert.acknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      確認
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDismiss(alert.id)}
                    >
                      解除
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}