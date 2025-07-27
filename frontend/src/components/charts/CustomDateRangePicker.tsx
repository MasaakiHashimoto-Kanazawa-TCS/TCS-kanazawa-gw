/**
 * カスタム期間選択コンポーネント
 */

'use client';

import { useState, useEffect } from 'react';
import { Button, Modal, Card, CardContent } from '@/components/ui';
import type { CustomTimeRange } from '@/types';
import { cn } from '@/lib/utils';

export interface CustomDateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (range: CustomTimeRange) => void;
  initialRange?: CustomTimeRange;
  className?: string;
}

export function CustomDateRangePicker({
  isOpen,
  onClose,
  onApply,
  initialRange,
  className
}: CustomDateRangePickerProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 初期値の設定
  useEffect(() => {
    if (initialRange) {
      setStartDate(initialRange.startDate.split('T')[0]);
      setEndDate(initialRange.endDate.split('T')[0]);
    } else {
      // デフォルトは過去30日間
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
    }
  }, [initialRange, isOpen]);

  // バリデーション
  const validateDates = (start: string, end: string): string | null => {
    if (!start || !end) {
      return '開始日と終了日を選択してください';
    }

    const startDateTime = new Date(start);
    const endDateTime = new Date(end);
    const now = new Date();

    if (startDateTime > endDateTime) {
      return '開始日は終了日より前である必要があります';
    }

    if (endDateTime > now) {
      return '終了日は現在の日付より後にはできません';
    }

    const diffDays = Math.ceil((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      return '期間は365日以内で選択してください';
    }

    if (diffDays < 1) {
      return '期間は最低1日以上選択してください';
    }

    return null;
  };

  const handleApply = () => {
    const validationError = validateDates(startDate, endDate);
    if (validationError) {
      setError(validationError);
      return;
    }

    const range: CustomTimeRange = {
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate + 'T23:59:59').toISOString()
    };

    onApply(range);
    onClose();
    setError(null);
  };

  const handleQuickSelect = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
    setError(null);
  };

  const getDaysDifference = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="カスタム期間選択"
      size="md"
      className={className}
    >
      <div className="space-y-6">
        {/* クイック選択 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            クイック選択
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '過去7日間', days: 7 },
              { label: '過去14日間', days: 14 },
              { label: '過去30日間', days: 30 },
              { label: '過去60日間', days: 60 },
              { label: '過去90日間', days: 90 },
              { label: '過去180日間', days: 180 }
            ].map((option) => (
              <Button
                key={option.days}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(option.days)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 日付選択 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            期間を指定
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                終了日
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                min={startDate}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
        </div>

        {/* 期間情報 */}
        {startDate && endDate && !error && (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                選択期間: {getDaysDifference()}日間
                <br />
                {new Date(startDate).toLocaleDateString('ja-JP')} 〜 {new Date(endDate).toLocaleDateString('ja-JP')}
              </div>
            </CardContent>
          </Card>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={handleApply}>
            適用
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * 期間表示用のヘルパー関数
 */
export function formatCustomTimeRange(range: CustomTimeRange): string {
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  return `${start.toLocaleDateString('ja-JP')} 〜 ${end.toLocaleDateString('ja-JP')} (${days}日間)`;
}

/**
 * カスタム期間が有効かチェック
 */
export function isValidCustomTimeRange(range: CustomTimeRange): boolean {
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const now = new Date();
  
  return (
    start <= end &&
    end <= now &&
    (end.getTime() - start.getTime()) >= (24 * 60 * 60 * 1000) && // 最低1日
    (end.getTime() - start.getTime()) <= (365 * 24 * 60 * 60 * 1000) // 最大365日
  );
}