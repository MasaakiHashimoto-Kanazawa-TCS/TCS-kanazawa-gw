/**
 * レスポンシブチャートコンポーネント
 */

'use client';

import { useMemo } from 'react';
import { TimeSeriesChart, ComparisonChart } from './TimeSeriesChart';
import { useResponsive } from '@/hooks';
import type { SensorData, DataType, TimeRange, ThresholdConfig } from '@/types';

export interface ResponsiveTimeSeriesChartProps {
  data: SensorData[];
  dataType: DataType;
  timeRange: TimeRange;
  showThresholds?: boolean;
  thresholds?: ThresholdConfig;
  className?: string;
  title?: string;
}

export function ResponsiveTimeSeriesChart(props: ResponsiveTimeSeriesChartProps) {
  const { isMobile, isTablet, currentBreakpoint } = useResponsive();

  // 画面サイズに応じた高さの調整
  const chartHeight = useMemo(() => {
    switch (currentBreakpoint) {
      case 'sm':
        return 250; // モバイル
      case 'md':
        return 300; // タブレット縦
      case 'lg':
        return 350; // タブレット横・小さなデスクトップ
      case 'xl':
      case '2xl':
        return 400; // デスクトップ
      default:
        return 300;
    }
  }, [currentBreakpoint]);

  return (
    <TimeSeriesChart
      {...props}
      height={chartHeight}
    />
  );
}

export interface ResponsiveComparisonChartProps {
  temperatureData: SensorData[];
  phData: SensorData[];
  timeRange: TimeRange;
  className?: string;
}

export function ResponsiveComparisonChart(props: ResponsiveComparisonChartProps) {
  const { currentBreakpoint } = useResponsive();

  // 画面サイズに応じた高さの調整
  const chartHeight = useMemo(() => {
    switch (currentBreakpoint) {
      case 'sm':
        return 300; // モバイル - 比較チャートは少し高く
      case 'md':
        return 350; // タブレット縦
      case 'lg':
        return 400; // タブレット横・小さなデスクトップ
      case 'xl':
      case '2xl':
        return 450; // デスクトップ
      default:
        return 350;
    }
  }, [currentBreakpoint]);

  return (
    <ComparisonChart
      {...props}
      height={chartHeight}
    />
  );
}