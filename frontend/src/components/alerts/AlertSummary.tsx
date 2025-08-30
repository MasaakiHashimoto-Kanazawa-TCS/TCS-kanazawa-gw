/**
 * アラートサマリーコンポーネント
 */

'use client';

import type { Alert } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface AlertSummaryProps {
  alerts: Alert[];
  className?: string;
}

export function AlertSummary({ alerts, className }: AlertSummaryProps) {
  // 重要度別の統計
  const severityStats = {
    high: alerts.filter(alert => alert.severity === 'high' && !alert.resolved).length,
    medium: alerts.filter(alert => alert.severity === 'medium' && !alert.resolved).length,
    low: alerts.filter(alert => alert.severity === 'low' && !alert.resolved).length
  };

  const totalActive = severityStats.high + severityStats.medium + severityStats.low;

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {/* 総合サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">アクティブアラート</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalActive}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            未解決のアラート
          </p>
        </CardContent>
      </Card>

      {/* 重要度別サマリー */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">重要度別</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">緊急</span>
            </div>
            <span className="font-medium">{severityStats.high}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm">警告</span>
            </div>
            <span className="font-medium">{severityStats.medium}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">注意</span>
            </div>
            <span className="font-medium">{severityStats.low}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}