/**
 * キャッシュ機能付きセンサーデータサービス
 */

import type { SensorData, DataSummary, DataType, GetDataParams, GetSummaryParams } from '@/types';
import { sensorService } from './sensorService';
import { useCachedApiData } from '@/hooks/useCachedApiData';

export class CachedSensorService {
  private cacheConfig = {
    // センサーデータは5分間キャッシュ
    sensorData: {
      ttl: 5 * 60 * 1000, // 5分
      maxAge: 24 * 60 * 60 * 1000, // 24時間
      staleWhileRevalidate: true,
      backgroundRefresh: true
    },
    // サマリーデータは30分間キャッシュ
    summary: {
      ttl: 30 * 60 * 1000, // 30分
      maxAge: 24 * 60 * 60 * 1000, // 24時間
      staleWhileRevalidate: true,
      backgroundRefresh: true
    },
    // 植物データは1時間キャッシュ
    plants: {
      ttl: 60 * 60 * 1000, // 1時間
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7日間
      staleWhileRevalidate: true,
      backgroundRefresh: false
    }
  };

  /**
   * キャッシュ機能付きセンサーデータ取得
   */
  async getData(params: GetDataParams): Promise<SensorData[]> {
    const cacheKey = `sensor_data_${params.data_type}_${params.start_time}_${params.end_time}_${params.limit}`;
    
    try {
      // キャッシュから取得を試行
      const cached = this.getFromCache<SensorData[]>(cacheKey);
      if (cached) {
        console.log('Using cached sensor data');
        return cached;
      }

      // キャッシュにない場合はAPIから取得
      console.log('Fetching fresh sensor data');
      const data = await sensorService.getData(params);
      
      // キャッシュに保存
      this.saveToCache(cacheKey, data, this.cacheConfig.sensorData.ttl);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch sensor data:', error);
      throw error;
    }
  }

  /**
   * キャッシュ機能付きデータサマリー取得
   */
  async getSummary(params: GetSummaryParams): Promise<DataSummary> {
    const cacheKey = `summary_${params.data_type}_${params.period}`;
    
    try {
      // キャッシュから取得を試行
      const cached = this.getFromCache<DataSummary>(cacheKey);
      if (cached) {
        console.log('Using cached summary data');
        return cached;
      }

      // キャッシュにない場合はAPIから取得
      console.log('Fetching fresh summary data');
      const data = await sensorService.getSummary(params);
      
      // キャッシュに保存
      this.saveToCache(cacheKey, data, this.cacheConfig.summary.ttl);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch summary data:', error);
      throw error;
    }
  }

  /**
   * 時間範囲でデータを取得（キャッシュ付き）
   */
  async getDataByTimeRange(dataType: DataType, timeRange: string): Promise<SensorData[]> {
    const cacheKey = `time_range_${dataType}_${timeRange}`;
    
    try {
      // キャッシュから取得を試行
      const cached = this.getFromCache<SensorData[]>(cacheKey);
      if (cached) {
        console.log('Using cached time range data');
        return cached;
      }

      // キャッシュにない場合はAPIから取得
      console.log('Fetching fresh time range data');
      const data = await sensorService.getDataByTimeRange(dataType, timeRange);
      
      // キャッシュに保存
      this.saveToCache(cacheKey, data, this.cacheConfig.sensorData.ttl);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch time range data:', error);
      throw error;
    }
  }

  /**
   * カスタム期間でデータを取得（キャッシュ付き）
   */
  async getDataByCustomRange(dataType: DataType, startTime: string, endTime: string): Promise<SensorData[]> {
    const cacheKey = `custom_range_${dataType}_${startTime}_${endTime}`;
    
    try {
      // キャッシュから取得を試行
      const cached = this.getFromCache<SensorData[]>(cacheKey);
      if (cached) {
        console.log('Using cached custom range data');
        return cached;
      }

      // キャッシュにない場合はAPIから取得
      console.log('Fetching fresh custom range data');
      const data = await sensorService.getDataByCustomRange(dataType, startTime, endTime);
      
      // キャッシュに保存
      this.saveToCache(cacheKey, data, this.cacheConfig.sensorData.ttl);
      
      return data;
    } catch (error) {
      console.error('Failed to fetch custom range data:', error);
      throw error;
    }
  }

  /**
   * キャッシュからデータを取得
   */
  private getFromCache<T>(key: string): T | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      const now = Date.now();
      
      // TTLをチェック
      if (now - timestamp > ttl) {
        console.log(`Cache expired for key: ${key}`);
        return null;
      }
      
      console.log(`Cache hit for key: ${key}`);
      return data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      return null;
    }
  }

  /**
   * データをキャッシュに保存
   */
  private saveToCache<T>(key: string, data: T, ttl: number): void {
    try {
      if (typeof window === 'undefined') return;
      
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      console.log(`Data cached for key: ${key}`);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  }

  /**
   * キャッシュをクリア
   */
  clearCache(pattern?: string): void {
    try {
      if (typeof window === 'undefined') return;
      
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      if (pattern) {
        const filteredKeys = cacheKeys.filter(key => key.includes(pattern));
        filteredKeys.forEach(key => localStorage.removeItem(key));
        console.log(`Cleared cache for pattern: ${pattern}`);
      } else {
        cacheKeys.forEach(key => localStorage.removeItem(key));
        console.log('Cleared all cache');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * キャッシュ統計を取得
   */
  getCacheStats(): {
    totalKeys: number;
    totalSize: number;
    keys: string[];
  } {
    try {
      if (typeof window === 'undefined') {
        return { totalKeys: 0, totalSize: 0, keys: [] };
      }
      
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      let totalSize = 0;
      cacheKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      });
      
      return {
        totalKeys: cacheKeys.length,
        totalSize,
        keys: cacheKeys
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalKeys: 0, totalSize: 0, keys: [] };
    }
  }
}

// デフォルトのキャッシュ付きサービスインスタンス
export const cachedSensorService = new CachedSensorService();
