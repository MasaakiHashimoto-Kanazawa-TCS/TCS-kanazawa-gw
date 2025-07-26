/**
 * テーマ管理フック
 */

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

export type Theme = 'light' | 'dark';

export interface UseThemeResult {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

/**
 * テーマ管理フック
 */
export function useTheme(): UseThemeResult {
  const [theme, setThemeState] = useState<Theme>('light');

  // 初期テーマの設定
  useEffect(() => {
    try {
      // ローカルストレージから読み込み
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as Theme;
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        setThemeState(savedTheme);
        return;
      }

      // システム設定を確認
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeState('dark');
      }
    } catch (error) {
      console.error('Failed to load theme from localStorage:', error);
    }
  }, []);

  // テーマをHTMLクラスに適用
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // テーマを設定
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
    }
  }, []);

  // テーマを切り替え
  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark: theme === 'dark'
  };
}