/**
 * ヘッダーコンポーネント
 */

'use client';

import { useTheme } from '@/hooks';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  title?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function Header({ title = APP_NAME, actions, className }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={cn(
      'bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700',
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴとタイトル */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🌱</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>
          </div>

          {/* アクションとテーマ切り替え */}
          <div className="flex items-center space-x-4">
            {actions}
            
            {/* テーマ切り替えボタン */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="テーマを切り替え"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}