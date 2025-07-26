/**
 * アラート管理フック
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Alert, AlertType, DataType, SensorData, ThresholdConfig } from '@/types';
import { generateAlerts } from '@/lib/utils/dataTransform';
import { STORAGE_KEYS } from '@/lib/constants';

export interface UseAlertsOptions {
  plantId?: string;
  thresholds?: ThresholdConfig;
  autoGenerate?: boolean;
}

export interface UseAlertsResult {
  alerts: Alert[];
  activeAlerts: Alert[];
  acknowledgedAlerts: Alert[];
  unreadCount: number;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  clearAllAlerts: () => void;
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp'>) => void;
  generateAlertsFromData: (data: SensorData[], dataType: DataType) => void;
}

/**
 * アラート管理フック
 */
export function useAlerts(options: UseAlertsOptions = {}): UseAlertsResult {
  const { plantId = 'plant-001', thresholds, autoGenerate = true } = options;
  
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // ローカルストレージからアラートを読み込み
  useEffect(() => {
    try {
      const savedAlerts = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (savedAlerts) {
        const parsedAlerts = JSON.parse(savedAlerts);
        if (Array.isArray(parsedAlerts)) {
          setAlerts(parsedAlerts);
        }
      }
    } catch (error) {
      console.error('Failed to load alerts from localStorage:', error);
    }
  }, []);

  // アラートをローカルストレージに保存
  const saveAlerts = useCallback((alertsToSave: Alert[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alertsToSave));
    } catch (error) {
      console.error('Failed to save alerts to localStorage:', error);
    }
  }, []);

  // アクティブなアラート（未解決）
  const activeAlerts = useMemo(() => {
    return alerts.filter(alert => !alert.resolved && alert.plant_id === plantId);
  }, [alerts, plantId]);

  // 確認済みアラート
  const acknowledgedAlerts = useMemo(() => {
    return alerts.filter(alert => alert.acknowledged && alert.plant_id === plantId);
  }, [alerts, plantId]);

  // 未読アラート数
  const unreadCount = useMemo(() => {
    return activeAlerts.filter(alert => !alert.acknowledged).length;
  }, [activeAlerts]);

  // アラートを確認済みにする
  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      );
      saveAlerts(updatedAlerts);
      return updatedAlerts;
    });
  }, [saveAlerts]);

  // アラートを解除する
  const dismissAlert = useCallback((id: string) => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert =>
        alert.id === id ? { ...alert, resolved: true, acknowledged: true } : alert
      );
      saveAlerts(updatedAlerts);
      return updatedAlerts;
    });
  }, [saveAlerts]);

  // 全アラートをクリア
  const clearAllAlerts = useCallback(() => {
    setAlerts(prevAlerts => {
      const updatedAlerts = prevAlerts.map(alert =>
        alert.plant_id === plantId ? { ...alert, resolved: true, acknowledged: true } : alert
      );
      saveAlerts(updatedAlerts);
      return updatedAlerts;
    });
  }, [plantId, saveAlerts]);

  // アラートを追加
  const addAlert = useCallback((alertData: Omit<Alert, 'id' | 'timestamp'>) => {
    const newAlert: Alert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    setAlerts(prevAlerts => {
      // 同じタイプの未解決アラートが既に存在する場合は追加しない
      const existingAlert = prevAlerts.find(
        alert => 
          alert.type === newAlert.type && 
          alert.plant_id === newAlert.plant_id && 
          !alert.resolved
      );

      if (existingAlert) {
        return prevAlerts;
      }

      const updatedAlerts = [...prevAlerts, newAlert];
      saveAlerts(updatedAlerts);
      return updatedAlerts;
    });
  }, [saveAlerts]);

  // センサーデータからアラートを生成
  const generateAlertsFromData = useCallback((data: SensorData[], dataType: DataType) => {
    if (!autoGenerate || !thresholds || data.length === 0) {
      return;
    }

    const newAlerts = generateAlerts(data, thresholds, dataType, plantId);
    
    newAlerts.forEach(alert => {
      addAlert({
        plant_id: alert.plant_id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        acknowledged: false,
        resolved: false,
        recommendedAction: alert.recommendedAction
      });
    });
  }, [autoGenerate, thresholds, plantId, addAlert]);

  // 古いアラートを自動的にクリーンアップ（24時間以上前の解決済みアラート）
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      setAlerts(prevAlerts => {
        const filteredAlerts = prevAlerts.filter(alert => {
          if (!alert.resolved) return true;
          return new Date(alert.timestamp) > oneDayAgo;
        });
        
        if (filteredAlerts.length !== prevAlerts.length) {
          saveAlerts(filteredAlerts);
        }
        
        return filteredAlerts;
      });
    }, 60 * 60 * 1000); // 1時間ごとにクリーンアップ

    return () => clearInterval(cleanupInterval);
  }, [saveAlerts]);

  return {
    alerts: alerts.filter(alert => alert.plant_id === plantId),
    activeAlerts,
    acknowledgedAlerts,
    unreadCount,
    acknowledgeAlert,
    dismissAlert,
    clearAllAlerts,
    addAlert,
    generateAlertsFromData
  };
}

/**
 * アラート統計情報フック
 */
export function useAlertStats(alerts: Alert[]) {
  return useMemo(() => {
    const stats = {
      total: alerts.length,
      active: 0,
      acknowledged: 0,
      resolved: 0,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0
      },
      byType: {} as Record<AlertType, number>
    };

    alerts.forEach(alert => {
      if (!alert.resolved) stats.active++;
      if (alert.acknowledged) stats.acknowledged++;
      if (alert.resolved) stats.resolved++;
      
      stats.bySeverity[alert.severity]++;
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    });

    return stats;
  }, [alerts]);
}