/**
 * アラートカードコンポーネント
 */

'use client';

import type { Alert } from '@/types';
import { Card, CardContent, Button, Badge } from '@/components/ui';
import { ALERT_CONFIGS } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface AlertCardProps {
  alert: Alert;
  onAcknowledge: () => void;
  onDismiss?: () => void;
  showActions?: boolean;
  className?: string;
}

export function AlertCard({
  alert,
  onAcknowledge,
  onDismiss,
  showActions = true,
  className
}: AlertCardProps) {
  const config = ALERT_CONFIGS[alert.type];

  const getSeverityVariant = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getSeverityLabel = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return '緊急';
      case 'medium':
        return '警告';
      case 'low':
        return '注意';
      default:
        return '不明';
    }
  };

  const getBorderColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 dark:border-red-800';
      case 'medium':
        return 'border-orange-200 dark:border-orange-800';
      case 'low':
        return 'border-yellow-200 dark:border-yellow-800';
      default:
        return 'border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200',
      getBorderColor(alert.severity),
      alert.acknowledged && 'opacity-75',
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* アイコン */}
          <div className="flex-shrink-0 mt-1">
            <span className="text-2xl">{config.icon}</span>
          </div>

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            {/* ヘッダー */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Badge
                  variant={getSeverityVariant(alert.severity)}
                  size="sm"
                >
                  {getSeverityLabel(alert.severity)}
                </Badge>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {config.title}
                </h3>
                {alert.acknowledged && (
                  <Badge variant="success" size="sm">
                    確認済み
                  </Badge>
                )}
              </div>
              
              {/* タイムスタンプ */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(alert.timestamp, { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>

            {/* メッセージ */}
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              {alert.message}
            </p>

            {/* 推奨アクション */}
            {alert.recommendedAction && (
              <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                  推奨アクション
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {alert.recommendedAction}
                </p>
              </div>
            )}

            {/* アクション */}
            {showActions && (
              <div className="flex items-center space-x-2">
                {!alert.acknowledged && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onAcknowledge}
                  >
                    確認する
                  </Button>
                )}
                {onDismiss && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDismiss}
                  >
                    解除する
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * アラートリストコンポーネント
 */
export interface AlertListProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  showResolved?: boolean;
  className?: string;
}

export function AlertList({
  alerts,
  onAcknowledge,
  onDismiss,
  showResolved = false,
  className
}: AlertListProps) {
  // フィルタリング
  const filteredAlerts = alerts.filter(alert => 
    showResolved || !alert.resolved
  );

  // 重要度とタイムスタンプでソート
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    // 重要度でソート（high > medium > low）
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    
    if (severityDiff !== 0) {
      return severityDiff;
    }
    
    // タイムスタンプでソート（新しい順）
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  if (sortedAlerts.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <div className="text-gray-500 dark:text-gray-400">
          {showResolved ? 'アラートはありません' : 'アクティブなアラートはありません'}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {sortedAlerts.map((alert) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onAcknowledge={() => onAcknowledge(alert.id)}
          onDismiss={onDismiss ? () => onDismiss(alert.id) : undefined}
        />
      ))}
    </div>
  );
}

/**
 * アラートサマリーコンポーネント
 */
export interface AlertSummaryProps {
  alerts: Alert[];
  className?: string;
}

export function AlertSummary({ alerts, className }: AlertSummaryProps) {
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const stats = {
    total: activeAlerts.length,
    high: activeAlerts.filter(alert => alert.severity === 'high').length,
    medium: activeAlerts.filter(alert => alert.severity === 'medium').length,
    low: activeAlerts.filter(alert => alert.severity === 'low').length,
    unacknowledged: activeAlerts.filter(alert => !alert.acknowledged).length
  };

  if (stats.total === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4 text-center">
          <div className="text-green-600 dark:text-green-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            すべて正常です
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            アクティブなアラートはありません
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          アラートサマリー
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              アクティブ
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.unacknowledged}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              未確認
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {stats.high > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600 dark:text-red-400">緊急</span>
              <Badge variant="danger" size="sm">{stats.high}</Badge>
            </div>
          )}
          {stats.medium > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-600 dark:text-orange-400">警告</span>
              <Badge variant="warning" size="sm">{stats.medium}</Badge>
            </div>
          )}
          {stats.low > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-600 dark:text-yellow-400">注意</span>
              <Badge variant="default" size="sm">{stats.low}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}