/**
 * バッジコンポーネント
 */

import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
};

const badgeSizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm'
};

export function Badge({ 
  className, 
  variant = 'default', 
  size = 'sm', 
  children, 
  ...props 
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * ドットバッジ（通知用）
 */
export interface DotBadgeProps {
  count?: number;
  showZero?: boolean;
  max?: number;
  className?: string;
  children: React.ReactNode;
}

export function DotBadge({ 
  count = 0, 
  showZero = false, 
  max = 99, 
  className, 
  children 
}: DotBadgeProps) {
  const shouldShow = count > 0 || (count === 0 && showZero);
  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <div className={cn('relative inline-flex', className)}>
      {children}
      {shouldShow && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
          {displayCount}
        </span>
      )}
    </div>
  );
}