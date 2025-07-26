/**
 * アラート管理ページ
 */

'use client';

import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout';
import { AlertList, AlertSummary } from '@/components/alerts';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { ChartToolbar } from '@/components/charts';
import { useAlerts, useAlertStats } from '@/hooks';
import { DEFAULT_PLANT } from '@/types';
import type { Alert, AlertType, AlertSeverity } from '@/types';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function AlertsPage() {
  const [showResolved, setShowResolved] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'all'>('all');
  const [filterType, setFilterType] = useState<AlertType | 'all'>('all');

  // アラートデータの取得
  const {
    alerts,
    activeAlerts,
    acknowledgedAlerts,
    unreadCount,
    acknowledgeAlert,
    dismissAlert,
    clearAllAlerts
  } = useAlerts({
    plantId: DEFAULT_PLANT.id,
    thresholds: DEFAULT_PLANT.thresholds,
    autoGenerate: true
  });

  // アラート統計
  const alertStats = useAlertStats(alerts);

  // フィルタリングされたアラート
  const filteredAlerts = useMemo(() => {
    let filtered = showResolved ? alerts : activeAlerts;

    // 重要度でフィルタ
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === filterSeverity);
    }

    // タイプでフィルタ
    if (filterType !== 'all') {
      filtered = filtered.filter(alert => alert.type === filterType);
    }

    return filtered;
  }, [alerts, activeAlerts, showResolved, filterSeverity, filterType]);

  // 一括操作
  const handleAcknowledgeAll = () => {
    const unacknowledgedAlerts = filteredAlerts.filter(alert => !alert.acknowledged);
    unacknowledgedAlerts.forEach(alert => acknowledgeAlert(alert.id));
  };

  const handleClearAll = () => {
    if (confirm('すべてのアラートを解除しますか？')) {
      clearAllAlerts();
    }
  };

  return (
    <ErrorBoundary>
      <AppLayout title="アラート管理">
        <div className="space-y-6">
          {/* ページヘッダー */}
          <ChartToolbar
            title="アラート管理"
            subtitle="植物監視システムのアラートを管理します"
            actions={
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Badge variant="danger" size="sm">
                    {unreadCount}件未確認
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcknowledgeAll}
                  disabled={filteredAlerts.filter(a => !a.acknowledged).length === 0}
                >
                  すべて確認
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={activeAlerts.length === 0}
                >
                  すべて解除
                </Button>
              </div>
            }
          />

          {/* アラートサマリー */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AlertSummary alerts={alerts} />
            
            {/* 統計情報 */}
            <Card>
              <CardHeader>
                <CardTitle>統計情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>総アラート数:</span>
                  <span className="font-medium">{alertStats.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>アクティブ:</span>
                  <span className="font-medium">{alertStats.active}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>確認済み:</span>
                  <span className="font-medium">{alertStats.acknowledged}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>解決済み:</span>
                  <span className="font-medium">{alertStats.resolved}</span>
                </div>
              </CardContent>
            </Card>

            {/* タイプ別統計 */}
            <Card>
              <CardHeader>
                <CardTitle>タイプ別</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(alertStats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span>
                      {type === 'temperature_high' ? '温度高' :
                       type === 'temperature_low' ? '温度低' :
                       type === 'ph_high' ? 'pH高' :
                       type === 'ph_low' ? 'pH低' : type}:
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* フィルター */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  {/* 表示切り替え */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={!showResolved ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowResolved(false)}
                    >
                      アクティブ ({activeAlerts.length})
                    </Button>
                    <Button
                      variant={showResolved ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setShowResolved(true)}
                    >
                      すべて ({alerts.length})
                    </Button>
                  </div>

                  {/* 重要度フィルター */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">重要度:</span>
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value as AlertSeverity | 'all')}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                      <option value="all">すべて</option>
                      <option value="high">緊急</option>
                      <option value="medium">警告</option>
                      <option value="low">注意</option>
                    </select>
                  </div>

                  {/* タイプフィルター */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">タイプ:</span>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as AlertType | 'all')}
                      className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                    >
                      <option value="all">すべて</option>
                      <option value="temperature_high">温度高</option>
                      <option value="temperature_low">温度低</option>
                      <option value="ph_high">pH高</option>
                      <option value="ph_low">pH低</option>
                    </select>
                  </div>
                </div>

                {/* 結果数 */}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredAlerts.length}件のアラート
                </div>
              </div>
            </CardContent>
          </Card>

          {/* アラート一覧 */}
          <AlertList
            alerts={filteredAlerts}
            onAcknowledge={acknowledgeAlert}
            onDismiss={dismissAlert}
            showResolved={showResolved}
          />

          {/* アラート設定（将来実装） */}
          <Card>
            <CardHeader>
              <CardTitle>アラート設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      自動アラート生成
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      閾値を超えた際に自動的にアラートを生成します
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    有効
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      メール通知
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      重要なアラートをメールで通知します
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    設定
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      アラート履歴の保持期間
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      解決済みアラートの保持期間を設定します
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    30日
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ErrorBoundary>
  );
}