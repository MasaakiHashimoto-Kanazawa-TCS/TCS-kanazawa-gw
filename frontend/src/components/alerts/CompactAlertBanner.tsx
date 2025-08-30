/**
 * コンパクトアラートバナーコンポーネント
 */

'use client';

import { useState } from 'react';
import type { Alert } from '@/types';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface CompactAlertBannerProps {
  alerts: Alert[];
  onAcknowledge?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

const severityStyles = {
  low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  medium: 'bg-orange-50 border-orange-200 text-orange-800',
  high: 'bg-red-50 border-red-200 text-red-800'
};

const severityIcons = {
  low: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  medium: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  high: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

export function CompactAlertBanner({
  alerts,
  onAcknowledge,
  onDismiss,
  className
}: CompactAlertBannerProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  if (alerts.length === 0) {
    return null;
  }

  // 最も重要度の高いアラートを表示
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });

  const primaryAlert = sortedAlerts[0];
  const remainingCount = alerts.length - 1;

  return (
    <div className={cn('space-y-2', className)}>
      {/* メインアラート */}
      <div className={cn(
        'border rounded-lg p-4',
        severityStyles[primaryAlert.severity]
      )}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {severityIcons[primaryAlert.severity]}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {primaryAlert.message}
              </h4>
              <div className="flex items-center space-x-2">
                {remainingCount > 0 && (
                  <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                    +{remainingCount}件
                  </span>
                )}
                <button
                  onClick={() => setExpandedAlert(
                    expandedAlert === primaryAlert.id ? null : primaryAlert.id
                  )}
                  className="text-xs hover:underline"
                >
                  {expandedAlert === primaryAlert.id ? '閉じる' : '詳細'}
                </button>
              </div>
            </div>

            {/* 展開された詳細 */}
            {expandedAlert === primaryAlert.id && (
              <div className="mt-3 space-y-2">
                <p className="text-sm opacity-90">
                  発生時刻: {new Date(primaryAlert.timestamp).toLocaleString('ja-JP')}
                </p>
                {primaryAlert.recommendedAction && (
                  <p className="text-sm opacity-90">
                    推奨アクション: {primaryAlert.recommendedAction}
                  </p>
                )}
                <div className="flex space-x-2">
                  {onAcknowledge && !primaryAlert.acknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onAcknowledge(primaryAlert.id)}
                      className="text-xs"
                    >
                      確認済み
                    </Button>
                  )}
                  {onDismiss && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDismiss(primaryAlert.id)}
                      className="text-xs"
                    >
                      解除
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 追加のアラート（簡略表示） */}
      {remainingCount > 0 && expandedAlert === primaryAlert.id && (
        <div className="space-y-1">
          {sortedAlerts.slice(1, 4).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'border rounded p-2 text-sm',
                severityStyles[alert.severity]
              )}
            >
              <div className="flex items-center justify-between">
                <span className="truncate">{alert.message}</span>
                <div className="flex space-x-1">
                  {onAcknowledge && !alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="text-xs hover:underline"
                    >
                      確認
                    </button>
                  )}
                  {onDismiss && (
                    <button
                      onClick={() => onDismiss(alert.id)}
                      className="text-xs hover:underline"
                    >
                      解除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {remainingCount > 3 && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500">
                他に{remainingCount - 3}件のアラートがあります
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}