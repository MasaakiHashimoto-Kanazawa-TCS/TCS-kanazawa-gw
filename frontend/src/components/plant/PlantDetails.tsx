/**
 * 植物詳細情報コンポーネント
 */

'use client';

import { useState } from 'react';
import type { Plant, SensorData, ThresholdConfig } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Modal } from '@/components/ui';
import { formatDate, formatValue } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface PlantDetailsProps {
  plant: Plant;
  temperatureData?: SensorData;
  phData?: SensorData;
  className?: string;
}

export function PlantDetails({
  plant,
  temperatureData,
  phData,
  className
}: PlantDetailsProps) {
  const [showThresholdModal, setShowThresholdModal] = useState(false);

  return (
    <div className={cn('space-y-6', className)}>
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span className="text-2xl">🌱</span>
            <span>植物基本情報</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  植物名
                </label>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plant.name}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  学名・品種
                </label>
                <p className="text-gray-900 dark:text-white">
                  {plant.species}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  設置場所
                </label>
                <p className="text-gray-900 dark:text-white">
                  {plant.location}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  デバイスID
                </label>
                <p className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {plant.device_id}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  登録日
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(plant.created_at, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  最終更新
                </label>
                <p className="text-gray-900 dark:text-white">
                  {formatDate(plant.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 現在の環境データ */}
      <Card>
        <CardHeader>
          <CardTitle>現在の環境データ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 温度 */}
            <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-red-100 dark:border-red-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🌡️</span>
                  <h3 className="font-medium text-gray-900 dark:text-white">温度</h3>
                </div>
                <Badge variant="default" size="sm">
                  リアルタイム
                </Badge>
              </div>
              
              {temperatureData ? (
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {formatValue(temperatureData.value, 'temperature')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    正常範囲: {plant.thresholds.temperature.min}°C - {plant.thresholds.temperature.max}°C
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    更新: {formatDate(temperatureData.timestamp, { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  データなし
                </div>
              )}
            </div>

            {/* pH */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">⚗️</span>
                  <h3 className="font-medium text-gray-900 dark:text-white">pH</h3>
                </div>
                <Badge variant="default" size="sm">
                  リアルタイム
                </Badge>
              </div>
              
              {phData ? (
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {formatValue(phData.value, 'pH')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    正常範囲: pH {plant.thresholds.pH.min} - {plant.thresholds.pH.max}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    更新: {formatDate(phData.timestamp, { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  データなし
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 閾値設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>閾値設定</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThresholdModal(true)}
            >
              詳細表示
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThresholdDisplay thresholds={plant.thresholds} />
        </CardContent>
      </Card>

      {/* 閾値詳細モーダル */}
      <Modal
        isOpen={showThresholdModal}
        onClose={() => setShowThresholdModal(false)}
        title="閾値設定詳細"
        size="md"
      >
        <div className="space-y-6">
          <ThresholdDisplay thresholds={plant.thresholds} detailed />
          
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
              閾値について
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              これらの値は植物の健康な成長に必要な環境条件の範囲です。
              値がこの範囲を外れるとアラートが生成されます。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/**
 * 閾値表示コンポーネント
 */
interface ThresholdDisplayProps {
  thresholds: ThresholdConfig;
  detailed?: boolean;
}

function ThresholdDisplay({ thresholds, detailed = false }: ThresholdDisplayProps) {
  const thresholdItems = [
    {
      key: 'temperature',
      label: '温度',
      icon: '🌡️',
      unit: '°C',
      threshold: thresholds.temperature,
      color: 'text-red-600 dark:text-red-400'
    },
    {
      key: 'pH',
      label: 'pH',
      icon: '⚗️',
      unit: '',
      threshold: thresholds.pH,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="space-y-4">
      {thresholdItems.map((item) => (
        <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-xl">{item.icon}</span>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {item.label}
              </h4>
              {detailed && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {item.key === 'temperature' 
                    ? '植物の適正温度範囲' 
                    : '土壌の適正pH範囲'
                  }
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn('font-semibold', item.color)}>
              {item.threshold.min}{item.unit} - {item.threshold.max}{item.unit}
            </div>
            {detailed && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                範囲: {item.threshold.max - item.threshold.min}{item.unit}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * 植物ステータスサマリー
 */
export interface PlantStatusSummaryProps {
  plant: Plant;
  temperatureData?: SensorData;
  phData?: SensorData;
  className?: string;
}

export function PlantStatusSummary({
  plant,
  temperatureData,
  phData,
  className
}: PlantStatusSummaryProps) {
  // 健康状態の評価
  const getHealthStatus = () => {
    let issues = 0;
    let criticalIssues = 0;

    if (temperatureData) {
      const temp = temperatureData.value;
      const threshold = plant.thresholds.temperature;
      if (temp < threshold.min || temp > threshold.max) {
        issues++;
        if (temp < threshold.min - 2 || temp > threshold.max + 2) {
          criticalIssues++;
        }
      }
    }

    if (phData) {
      const pH = phData.value;
      const threshold = plant.thresholds.pH;
      if (pH < threshold.min || pH > threshold.max) {
        issues++;
        if (pH < threshold.min - 0.5 || pH > threshold.max + 0.5) {
          criticalIssues++;
        }
      }
    }

    if (criticalIssues > 0) return { status: 'critical', label: '危険', color: 'text-red-600' };
    if (issues > 0) return { status: 'warning', label: '注意', color: 'text-yellow-600' };
    return { status: 'healthy', label: '正常', color: 'text-green-600' };
  };

  const healthStatus = getHealthStatus();

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🌱</span>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {plant.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {plant.location}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={cn('font-semibold', healthStatus.color)}>
              {healthStatus.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {temperatureData && phData ? '全センサー正常' : 'データ不足'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}