/**
 * エラーメッセージコンポーネント
 */

import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ErrorMessageProps {
  error: string;
  title?: string;
  retry?: () => void;
  onDismiss?: () => void;
  className?: string;
  variant?: 'inline' | 'card' | 'banner';
}

export function ErrorMessage({
  error,
  title = 'エラーが発生しました',
  retry,
  onDismiss,
  className,
  variant = 'card'
}: ErrorMessageProps) {
  const baseClasses = 'text-red-800 dark:text-red-200';
  
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center space-x-2 text-sm', baseClasses, className)}>
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
        {retry && (
          <Button variant="ghost" size="sm" onClick={retry}>
            再試行
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={cn(
        'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4',
        className
      )}>
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className={cn('text-sm font-medium', baseClasses)}>{title}</h3>
            <div className={cn('mt-2 text-sm', baseClasses)}>
              <p>{error}</p>
            </div>
            {(retry || onDismiss) && (
              <div className="mt-4 flex space-x-2">
                {retry && (
                  <Button variant="outline" size="sm" onClick={retry}>
                    再試行
                  </Button>
                )}
                {onDismiss && (
                  <Button variant="ghost" size="sm" onClick={onDismiss}>
                    閉じる
                  </Button>
                )}
              </div>
            )}
          </div>
          {onDismiss && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={onDismiss}
                  className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                >
                  <span className="sr-only">閉じる</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // card variant (default)
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-6 shadow-sm',
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className={cn('text-lg font-medium', baseClasses)}>{title}</h3>
          <p className={cn('mt-2 text-sm', baseClasses)}>{error}</p>
          {retry && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={retry}>
                再試行
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * フィールドエラーメッセージ
 */
export function FieldError({ error, className }: { error: string; className?: string }) {
  return (
    <p className={cn('mt-1 text-sm text-red-600 dark:text-red-400', className)}>
      {error}
    </p>
  );
}