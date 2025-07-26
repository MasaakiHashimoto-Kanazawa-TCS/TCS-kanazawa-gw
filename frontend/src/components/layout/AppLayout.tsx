/**
 * アプリケーションレイアウトコンポーネント
 */

'use client';

import { Header } from './Header';
import { Navigation } from './Navigation';
import { cn } from '@/lib/utils';

export interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  headerActions?: React.ReactNode;
  showNavigation?: boolean;
  className?: string;
}

export function AppLayout({
  children,
  title,
  headerActions,
  showNavigation = true,
  className
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <Header title={title} actions={headerActions} />
      
      {/* ナビゲーション */}
      {showNavigation && <Navigation />}
      
      {/* メインコンテンツ */}
      <main className={cn('flex-1', className)}>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * シンプルなページレイアウト（ナビゲーションなし）
 */
export function SimpleLayout({
  children,
  title,
  headerActions,
  className
}: Omit<AppLayoutProps, 'showNavigation'>) {
  return (
    <AppLayout
      title={title}
      headerActions={headerActions}
      showNavigation={false}
      className={className}
    >
      {children}
    </AppLayout>
  );
}

/**
 * フルスクリーンレイアウト（ヘッダーとナビゲーションなし）
 */
export function FullscreenLayout({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      {children}
    </div>
  );
}