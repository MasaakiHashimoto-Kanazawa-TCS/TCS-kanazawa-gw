/**
 * 最適化されたアプリレイアウトコンポーネント
 */

'use client';

import React, { useEffect } from 'react';
import { usePagePreload } from '@/hooks/usePagePreload';
import { AppLayout } from './AppLayout';

export interface OptimizedAppLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function OptimizedAppLayout({ 
  children, 
  title, 
  className 
}: OptimizedAppLayoutProps) {
  // ページプリロード機能
  const { preloadPages, isPreloading } = usePagePreload({
    enabled: true,
    config: {
      preloadOnMount: true,
      preloadDelay: 2000, // 2秒後にプリロード開始
      maxPreloadConcurrency: 2,
      preloadTimeout: 15000,
      cacheDuration: 30 * 60 * 1000 // 30分間キャッシュ
    },
    preloadPaths: ['/history', '/plant', '/alerts'],
    onPreloadStart: (path) => {
      console.log(`Starting preload for ${path}`);
    },
    onPreloadComplete: (path) => {
      console.log(`Preload completed for ${path}`);
    },
    onPreloadError: (path, error) => {
      console.error(`Preload failed for ${path}:`, error);
    }
  });

  // 初回マウント時にプリロードを実行
  useEffect(() => {
    // 少し遅延させてメインコンテンツの読み込みを優先
    const timeout = setTimeout(() => {
      preloadPages(['/history', '/plant', '/alerts']);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [preloadPages]);

  return (
    <AppLayout title={title} className={className}>
      {children}
      {/* プリロード状態の表示（開発時のみ） */}
      {process.env.NODE_ENV === 'development' && isPreloading && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-3 py-1 rounded text-sm">
          ページをプリロード中...
        </div>
      )}
    </AppLayout>
  );
}
