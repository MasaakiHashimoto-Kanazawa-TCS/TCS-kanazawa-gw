/**
 * 時系列チャートコンポーネント
 */

'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import type { SensorData, DataType, TimeRange, ThresholdConfig } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { transformToChartData } from '@/lib/utils/dataTransform';
import { formatValue, getDataTypeLabel } from '@/lib/utils';
import { CHART_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface TimeSeriesChartProps {
  data: SensorData[];
  dataType: DataType;
  timeRange: TimeRange;
  height?: number;
  showThresholds?: boolean;
  thresholds?: ThresholdConfig;
  className?: string;
  title?: string;
}

export function TimeSeriesChart({
  data,
  dataType,
  timeRange,
  height = 300,
  showThresholds = false,
  thresholds,
  className,
  title
}: TimeSeriesChartProps) {
  // チャート用データの変換
  const chartData = useMemo(() => {
    return transformToChartData(data);
  }, [data]);

  // データタイプに応じた設定
  const config = useMemo(() => {
    switch (dataType) {
      case 'temperature':
        return {
          color: CHART_COLORS.temperature,
          unit: '°C',
          label: '温度',
          domain: ['dataMin - 2', 'dataMax + 2']
        };
      case 'pH':
        return {
          color: CHART_COLORS.pH,
          unit: '',
          label: 'pH',
          domain: [0, 14]
        };
      default:
        return {
          color: CHART_COLORS.primary,
          unit: '',
          label: getDataTypeLabel(dataType),
          domain: ['auto', 'auto']
        };
    }
  }, [dataType]);

  // 閾値線の設定
  const thresholdLines = useMemo(() => {
    if (!showThresholds || !thresholds || !thresholds[dataType]) {
      return null;
    }

    const threshold = thresholds[dataType];
    return (
      <>
        <ReferenceLine
          y={threshold.min}
          stroke="#f59e0b"
          strokeDasharray="5 5"
          label={{ value: `最小: ${threshold.min}${config.unit}`, position: 'topLeft' }}
        />
        <ReferenceLine
          y={threshold.max}
          stroke="#f59e0b"
          strokeDasharray="5 5"
          label={{ value: `最大: ${threshold.max}${config.unit}`, position: 'topLeft' }}
        />
      </>
    );
  }, [showThresholds, thresholds, dataType, config.unit]);

  // カスタムツールチップ
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            {new Date(label).toLocaleString('ja-JP')}
          </p>
          <p className="text-sm font-medium" style={{ color: data.color }}>
            {config.label}: {formatValue(data.value, dataType)}
          </p>
        </div>
      );
    }
    return null;
  };

  // X軸のフォーマット
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    
    switch (timeRange) {
      case '24h':
        return date.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '7d':
        return date.toLocaleDateString('ja-JP', { 
          month: 'short', 
          day: 'numeric' 
        });
      case '30d':
      case '150d':
        return date.toLocaleDateString('ja-JP', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'custom':
        // カスタム期間の場合、データの範囲に応じてフォーマットを決定
        if (chartData.length > 0) {
          const firstDate = new Date(chartData[0].timestamp);
          const lastDate = new Date(chartData[chartData.length - 1].timestamp);
          const diffDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 1) {
            return date.toLocaleTimeString('ja-JP', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          } else if (diffDays <= 30) {
            return date.toLocaleDateString('ja-JP', { 
              month: 'short', 
              day: 'numeric' 
            });
          } else {
            return date.toLocaleDateString('ja-JP', { 
              year: '2-digit',
              month: 'short', 
              day: 'numeric' 
            });
          }
        }
        return date.toLocaleDateString('ja-JP', { 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    }
  };

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title || `${config.label}の推移`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center justify-center text-gray-500 dark:text-gray-400"
            style={{ height }}
          >
            データがありません
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title || `${config.label}の推移`}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {chartData.length}件のデータポイント
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="opacity-30"
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={config.domain}
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}${config.unit}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {thresholdLines}
            <Line
              type="monotone"
              dataKey="value"
              stroke={config.color}
              strokeWidth={2}
              dot={{ fill: config.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: config.color, strokeWidth: 2 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * リアルタイムチャートコンポーネント
 */
export interface RealtimeChartProps {
  dataType: DataType;
  updateInterval?: number;
  maxDataPoints?: number;
  height?: number;
  showThresholds?: boolean;
  thresholds?: ThresholdConfig;
  className?: string;
}

export function RealtimeChart({
  dataType,
  updateInterval = 5000,
  maxDataPoints = 50,
  height = 200,
  showThresholds = false,
  thresholds,
  className
}: RealtimeChartProps) {
  // リアルタイムデータの取得は親コンポーネントで行い、
  // propsとして渡すことを想定
  // ここでは基本的な構造のみ実装
  
  return (
    <div className={cn('relative', className)}>
      <div className="absolute top-2 right-2 z-10">
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1 shadow-sm border">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            リアルタイム
          </span>
        </div>
      </div>
      
      {/* 実際のチャートは親コンポーネントから渡されたデータで表示 */}
      <TimeSeriesChart
        data={[]} // 親から渡される
        dataType={dataType}
        timeRange="24h"
        height={height}
        showThresholds={showThresholds}
        thresholds={thresholds}
        title={`${getDataTypeLabel(dataType)} (リアルタイム)`}
      />
    </div>
  );
}

/**
 * 比較チャートコンポーネント（複数データタイプ）
 */
export interface ComparisonChartProps {
  temperatureData: SensorData[];
  phData: SensorData[];
  timeRange: TimeRange;
  height?: number;
  className?: string;
}

export function ComparisonChart({
  temperatureData,
  phData,
  timeRange,
  height = 300,
  className
}: ComparisonChartProps) {
  // 両方のデータを統合してチャート用に変換
  const chartData = useMemo(() => {
    const tempData = transformToChartData(temperatureData);
    const phDataTransformed = transformToChartData(phData);
    
    // タイムスタンプでマージ
    const merged = new Map();
    
    tempData.forEach(item => {
      merged.set(item.timestamp, { 
        timestamp: item.timestamp, 
        temperature: item.value,
        formattedTime: item.formattedTime
      });
    });
    
    phDataTransformed.forEach(item => {
      const existing = merged.get(item.timestamp) || { timestamp: item.timestamp };
      merged.set(item.timestamp, { 
        ...existing, 
        pH: item.value,
        formattedTime: item.formattedTime
      });
    });
    
    return Array.from(merged.values()).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [temperatureData, phData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {new Date(label).toLocaleString('ja-JP')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
              {entry.dataKey === 'temperature' ? '温度' : 'pH'}: {' '}
              {entry.dataKey === 'temperature' 
                ? formatValue(entry.value, 'temperature')
                : formatValue(entry.value, 'pH')
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    
    switch (timeRange) {
      case '24h':
        return date.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      case '7d':
      case '30d':
      case '150d':
        return date.toLocaleDateString('ja-JP', { 
          month: 'short', 
          day: 'numeric' 
        });
      case 'custom':
        // カスタム期間の場合、データの範囲に応じてフォーマットを決定
        if (chartData.length > 0) {
          const firstDate = new Date(chartData[0].timestamp);
          const lastDate = new Date(chartData[chartData.length - 1].timestamp);
          const diffDays = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 1) {
            return date.toLocaleTimeString('ja-JP', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
          } else {
            return date.toLocaleDateString('ja-JP', { 
              month: 'short', 
              day: 'numeric' 
            });
          }
        }
        return date.toLocaleDateString('ja-JP', { 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>温度とpHの比較</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              yAxisId="temperature"
              orientation="left"
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}°C`}
            />
            <YAxis
              yAxisId="pH"
              orientation="right"
              domain={[0, 14]}
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `pH ${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="temperature"
              stroke={CHART_COLORS.temperature}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.temperature, strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
            <Line
              yAxisId="pH"
              type="monotone"
              dataKey="pH"
              stroke={CHART_COLORS.pH}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.pH, strokeWidth: 2, r: 3 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}