/**
 * レスポンシブグリッドコンポーネント
 */

'use client';

import { useResponsive } from '@/hooks';
import { cn } from '@/lib/utils';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveGrid({
  children,
  columns = { sm: 1, md: 2, lg: 3, xl: 4, '2xl': 4 },
  gap = 'md',
  className
}: ResponsiveGridProps) {
  const { currentBreakpoint } = useResponsive();

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const getColumnClass = () => {
    const columnCount = columns[currentBreakpoint] || columns.lg || 3;
    return `grid-cols-${columnCount}`;
  };

  return (
    <div className={cn(
      'grid',
      getColumnClass(),
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * レスポンシブカードグリッド
 */
export interface ResponsiveCardGridProps {
  children: React.ReactNode;
  minCardWidth?: number;
  maxColumns?: number;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ResponsiveCardGrid({
  children,
  minCardWidth = 300,
  maxColumns = 4,
  gap = 'md',
  className
}: ResponsiveCardGridProps) {
  const { currentBreakpoint } = useResponsive();

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  // 画面サイズに応じた列数の自動調整
  const getAutoColumns = () => {
    switch (currentBreakpoint) {
      case 'sm':
        return 'grid-cols-1';
      case 'md':
        return 'grid-cols-1 md:grid-cols-2';
      case 'lg':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 'xl':
      case '2xl':
        return `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${Math.min(maxColumns, 4)}`;
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <div className={cn(
      'grid',
      getAutoColumns(),
      gapClasses[gap],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * レスポンシブフレックスレイアウト
 */
export interface ResponsiveFlexProps {
  children: React.ReactNode;
  direction?: {
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
    xl?: 'row' | 'col';
    '2xl'?: 'row' | 'col';
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  className?: string;
}

export function ResponsiveFlex({
  children,
  direction = { sm: 'col', md: 'row' },
  gap = 'md',
  align = 'start',
  justify = 'start',
  className
}: ResponsiveFlexProps) {
  const { currentBreakpoint } = useResponsive();

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8'
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  const getDirectionClass = () => {
    const dir = direction[currentBreakpoint] || direction.md || 'row';
    return dir === 'col' ? 'flex-col' : 'flex-row';
  };

  return (
    <div className={cn(
      'flex',
      getDirectionClass(),
      gapClasses[gap],
      alignClasses[align],
      justifyClasses[justify],
      className
    )}>
      {children}
    </div>
  );
}

/**
 * レスポンシブコンテナ
 */
export interface ResponsiveContainerProps {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: {
    sm?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    md?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    lg?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    xl?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
    '2xl'?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  };
  className?: string;
}

export function ResponsiveContainer({
  children,
  maxWidth = 'full',
  padding = { sm: 'md', md: 'lg', lg: 'xl' },
  className
}: ResponsiveContainerProps) {
  const { currentBreakpoint } = useResponsive();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const getPaddingClass = () => {
    const paddingSize = padding[currentBreakpoint] || padding.md || 'md';
    return paddingClasses[paddingSize];
  };

  return (
    <div className={cn(
      'mx-auto',
      maxWidthClasses[maxWidth],
      getPaddingClass(),
      className
    )}>
      {children}
    </div>
  );
}