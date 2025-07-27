/**
 * チャート制御コンポーネント
 */

'use client';

import { useState } from 'react';
import { Button, Badge } from '@/components/ui';
import { CustomDateRangePicker, formatCustomTimeRange } from './CustomDateRangePicker';
import { TIME_RANGE_OPTIONS, DATA_TYPE_OPTIONS } from '@/lib/constants';
import type { TimeRange, DataType, CustomTimeRange } from '@/types';
import { cn } from '@/lib/utils';

export interface ChartControlsProps {
  selectedTimeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  customTimeRange?: CustomTimeRange;
  onCustomTimeRangeChange?: (range: CustomTimeRange) => void;
  selectedDataType?: DataType;
  onDataTypeChange?: (dataType: DataType) => void;
  showDataTypeSelector?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function ChartControls({
  selectedTimeRange,
  onTimeRangeChange,
  customTimeRange,
  onCustomTimeRangeChange,
  selectedDataType,
  onDataTypeChange,
  showDataTypeSelector = false,
  isLoading = false,
  onRefresh,
  className
}: ChartControlsProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const handleTimeRangeClick = (timeRange: TimeRange) => {
    if (timeRange === 'custom') {
      setShowCustomPicker(true);
    } else {
      onTimeRangeChange(timeRange);
    }
  };

  const handleCustomRangeApply = (range: CustomTimeRange) => {
    if (onCustomTimeRangeChange) {
      onCustomTimeRangeChange(range);
    }
    onTimeRangeChange('custom');
    setShowCustomPicker(false);
  };

  const handleCustomPickerClose = () => {
    setShowCustomPicker(false);
  };

  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0', className)}>
      {/* 時間範囲選択 */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          期間:
        </span>
        <div className="flex flex-wrap gap-1">
          {TIME_RANGE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={selectedTimeRange === option.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleTimeRangeClick(option.value)}
              disabled={isLoading}
            >
              {option.value === 'custom' && selectedTimeRange === 'custom' && customTimeRange
                ? formatCustomTimeRange(customTimeRange)
                : option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* データタイプ選択 */}
      {showDataTypeSelector && selectedDataType && onDataTypeChange && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            データ:
          </span>
          <div className="flex space-x-1">
            {DATA_TYPE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={selectedDataType === option.value ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onDataTypeChange(option.value)}
                disabled={isLoading}
                style={{
                  borderColor: selectedDataType === option.value ? option.color : undefined
                }}
              >
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: option.color }}
                />
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 更新ボタン */}
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          loading={isLoading}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>更新</span>
        </Button>
      )}

      {/* カスタム期間選択モーダル */}
      <CustomDateRangePicker
        isOpen={showCustomPicker}
        onClose={handleCustomPickerClose}
        onApply={handleCustomRangeApply}
        initialRange={customTimeRange}
      />
    </div>
  );
}
/*
*
 * チャート統計情報コンポーネント
 */
export interface ChartStatsProps {
  stats: {
    count: number;
    average: number;
    minimum: number;
    maximum: number;
  };
  dataType: DataType;
  className?: string;
}

export function ChartStats({ stats, dataType, className }: ChartStatsProps) {
  const formatValue = (value: number) => {
    switch (dataType) {
      case 'temperature':
        return `${value.toFixed(1)}°C`;
      case 'ph':
        return `pH ${value.toFixed(2)}`;
      default:
        return value.toFixed(1);
    }
  };

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {stats.count}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          データ数
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {formatValue(stats.average)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          平均値
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {formatValue(stats.minimum)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          最小値
        </div>
      </div>
      
      <div className="text-center">
        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
          {formatValue(stats.maximum)}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          最大値
        </div>
      </div>
    </div>
  );
}

/**
 * チャートレジェンドコンポーネント
 */
export interface ChartLegendProps {
  items: Array<{
    label: string;
    color: string;
    value?: string;
    active?: boolean;
  }>;
  onToggle?: (index: number) => void;
  className?: string;
}

export function ChartLegend({ items, onToggle, className }: ChartLegendProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center space-x-2 cursor-pointer transition-opacity',
            item.active === false && 'opacity-50',
            onToggle && 'hover:opacity-75'
          )}
          onClick={() => onToggle?.(index)}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {item.label}
          </span>
          {item.value && (
            <Badge variant="default" size="sm">
              {item.value}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * チャートツールバーコンポーネント
 */
export interface ChartToolbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function ChartToolbar({ title, subtitle, actions, className }: ChartToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}