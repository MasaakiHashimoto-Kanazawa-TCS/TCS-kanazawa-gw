/**
 * モバイル用ダッシュボードコンポーネント
 */

'use client';

import { useState } from 'react';
import type { Plant, SensorData } from '@/types';
import { usePlantData, useSensorData, useAlerts } from '@/hooks';
import { MobileCard, MobileGrid } from './MobileLayout';
import { CompactAlertBanner } from '@/components/alerts';
import { Button, Badge, LoadingSpinner, ErrorMessage } from '@/components/ui';
import { formatValue, formatDate, isWithinThreshold } from '@/lib/utils';
import { DATA_TYPE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface MobileDashboardProps {
  className?: string;
}

export function MobileDashboard({ className }: MobileDashboardProps) {
  const [selectedDataType, setSelectedDataType] = useState<'temperature' | 'ph'>('temperature');

  // データ取得
  const { selectedPlant, loading: plantLoading } = usePlantData();
  
  const {
    latest: latestTemperature,
    loading: tempLoading
  } = useSensorData({
    dataType: 'temperature',
    autoRefresh: true,
    realtime: true
  });

  const {
    latest: latestPH,
    loading: phLoading
  } = useSensorData({
    dataType: 'ph',
    autoRefresh: true,
    realtime: true
  });

  const { activeAlerts, acknowledgeAlert, dismissAlert } = useAlerts({
    plantId: selectedPlant?.id,
    thresholds: selectedPlant?.thresholds,
    autoGenerate: true
  });

  if (plantLoading || !selectedPlant) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" message="読み込み中..." />
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* アラート */}
      {activeAlerts.length > 0 && (
        <CompactAlertBanner
          alerts={activeAlerts}
          onAcknowledge={acknowledgeAlert}
          onDismiss={dismissAlert}
        />
      )}

      {/* 植物ステータス */}
      <MobileCard
        title={selectedPlant.name}
        subtitle={selectedPlant.location}
        actions={
          <Badge variant="success" size="sm">
            監視中
          </Badge>
        }
      >
        <MobileGrid columns={2} gap="sm">
          <MobileMetricCard
            title="温度"
            icon="🌡️"
            value={latestTemperature?.value}
            unit="°C"
            threshold={selectedPlant.thresholds.temperature}
            loading={tempLoading}
            timestamp={latestTemperature?.timestamp}
          />
          <MobileMetricCard
            title="pH"
            icon="⚗️"
            value={latestPH?.value}
            unit=""
            threshold={selectedPlant.thresholds.ph}
            loading={phLoading}
            timestamp={latestPH?.timestamp}
          />
        </MobileGrid>
      </MobileCard>

      {/* データタイプ選択 */}
      <MobileCard title="データ表示">
        <div className="flex space-x-2">
          {DATA_TYPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={selectedDataType === option.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedDataType(option.value)}
              className="flex-1"
            >
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: option.color }}
              />
              {option.label}
            </Button>
          ))}
        </div>
      </MobileCard>

      {/* クイックアクション */}
      <MobileCard title="クイックアクション">
        <MobileGrid columns={2} gap="sm">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/history'}
            className="flex flex-col items-center py-4 h-auto"
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs">履歴表示</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/plant'}
            className="flex flex-col items-center py-4 h-auto"
          >
            <svg className="w-6 h-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">詳細情報</span>
          </Button>
        </MobileGrid>
      </MobileCard>

      {/* システム情報 */}
      <MobileCard title="システム状態">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">植物監視</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-600">正常</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">温度センサー</span>
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                latestTemperature ? 'bg-green-500' : 'bg-red-500'
              )}></div>
              <span className={cn(
                'text-sm font-medium',
                latestTemperature ? 'text-green-600' : 'text-red-600'
              )}>
                {latestTemperature ? '正常' : 'エラー'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">pHセンサー</span>
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                latestPH ? 'bg-green-500' : 'bg-red-500'
              )}></div>
              <span className={cn(
                'text-sm font-medium',
                latestPH ? 'text-green-600' : 'text-red-600'
              )}>
                {latestPH ? '正常' : 'エラー'}
              </span>
            </div>
          </div>
        </div>
      </MobileCard>
    </div>
  );
}

/**
 * モバイル用メトリクスカード
 */
interface MobileMetricCardProps {
  title: string;
  icon: string;
  value?: number;
  unit: string;
  threshold: { min: number; max: number };
  loading?: boolean;
  timestamp?: string;
}

function MobileMetricCard({
  title,
  icon,
  value,
  unit,
  threshold,
  loading,
  timestamp
}: MobileMetricCardProps) {
  const isHealthy = value !== undefined ? isWithinThreshold(value, threshold) : null;
  
  return (
    <div className={cn(
      'p-3 rounded-lg border',
      isHealthy === null
        ? 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600'
        : isHealthy
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </span>
        </div>
        {loading && (
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        )}
      </div>
      
      <div className="space-y-1">
        <div className={cn(
          'text-xl font-bold',
          isHealthy === null
            ? 'text-gray-400'
            : isHealthy
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
        )}>
          {value !== undefined ? formatValue(value, title.toLowerCase()) : '--'}
        </div>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          範囲: {threshold.min}{unit} - {threshold.max}{unit}
        </div>
        
        {timestamp && (
          <div className="text-xs text-gray-400">
            {formatDate(timestamp, { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}