/**
 * アラートバナーコンポーネント
 */

'use client';

import { useState } from 'react';
import type { Alert } from '@/types';
import { Button, Badge } from '@/components/ui';
import { ALERT_CONFIGS } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
  onAcknowledge: (alertId: string) => void;
  maxVisible?: number;
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

export function AlertBanner({
  alerts,
  onDismiss,
  onAcknowledge,
  maxVisible = 3,
  className,
  showActions = true,
  compact = false
}: AlertBannerProps) {
  const [collapsed, setCollapsed] = useState(false);

  // アクティブなアラートのみ表示
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const visibleAlerts = collapsed ? [] : activeAlerts.slice(0, maxVisible);
  const hiddenCount = Math.max(0, activeAlerts.length - maxVisible);

  if (activeAlerts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
      case 'medium':
        return 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800';
      case 'low':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getSeverityTextColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-800 dark:text-red-200';
      case 'medium':
        return 'text-orange-800 dark:text-orange-200';
      case 'low':
        return 'text-yellow-800 dark:text-yellow-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {/* 折りたたみヘッダー */}
      {activeAlerts.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              アクティブなアラート
            </h3>
            <Badge variant="danger" size="sm">
              {activeAlerts.length}件
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '表示' : '非表示'}
          </Button>
        </div>
      )}

      {/* アラート一覧 */}
      {visibleAlerts.map((alert) => {
        const config = ALERT_CONFIGS[alert.type];
        const severityColor = getSeverityColor(alert.severity);
        const textColor = getSeverityTextColor(alert.severity);

        return (
          <div
            key={alert.id}
            className={cn(
              'border rounded-lg p-4 transition-all duration-200',
              severityColor
            )}
          >
            <div className="flex items-start space-x-3">
              {/* アイコン */}
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-lg">{config.icon}</span>
              </div>

              {/* コンテンツ */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* タイトルと重要度 */}
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge
                        variant={alert.severity === 'high' ? 'danger' : 
                                alert.severity === 'medium' ? 'warning' : 'default'}
                        size="sm"
                      >
                        {alert.severity === 'high' ? '緊急' : 
                         alert.severity === 'medium' ? '警告' : '注意'}
                      </Badge>
                      <h4 className={cn('text-sm font-medium', textColor)}>
                        {config.title}
                      </h4>
                    </div>

                    {/* メッセージ */}
                    <p className={cn('text-sm', textColor)}>
                      {alert.message}
                    </p>

                    {/* 推奨アクション */}
                    {alert.recommendedAction && !compact && (
                      <div className="mt-2">
                        <p className={cn('text-sm font-medium', textColor)}>
                          推奨アクション:
                        </p>
                        <p className={cn('text-sm', textColor)}>
                          {alert.recommendedAction}
                        </p>
                      </div>
                    )}

                    {/* タイムスタンプ */}
                    {!compact && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(alert.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* アクション */}
                  {showActions && (
                    <div className="flex-shrink-0 ml-4">
                      <div className="flex space-x-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onAcknowledge(alert.id)}
                          >
                            確認
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDismiss(alert.id)}
                        >
                          解除
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* 隠れているアラートの表示 */}
      {hiddenCount > 0 && !collapsed && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(false)}
          >
            他に{hiddenCount}件のアラートがあります
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * コンパクトアラートバナー
 */
export function CompactAlertBanner({
  alerts,
  onDismiss,
  onAcknowledge,
  className
}: Omit<AlertBannerProps, 'compact' | 'maxVisible'>) {
  return (
    <AlertBanner
      alerts={alerts}
      onDismiss={onDismiss}
      onAcknowledge={onAcknowledge}
      maxVisible={1}
      compact={true}
      className={className}
    />
  );
}