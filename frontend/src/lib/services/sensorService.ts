/**
 * センサーデータサービス
 */

import type { SensorData, DataSummary, DataType, GetDataParams, GetSummaryParams } from '@/types';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { transformSensorData, generateMockSensorData } from '@/lib/utils/dataTransform';
import { IS_DEVELOPMENT } from '@/lib/constants';

export class SensorService {
  /**
   * センサーデータを取得
   */
  async getData(params: GetDataParams): Promise<SensorData[]> {
    try {
      // 現在のバックエンドAPIはHTML形式なので、開発中はモックデータを使用
      if (IS_DEVELOPMENT) {
        return this.getMockData(params.data_type, params.limit || 100);
      }

      // 将来のJSON API実装
      const response = await apiClient.get<{ data: any[] }>(API_ENDPOINTS.DATA, params);
      return transformSensorData(response.data);
    } catch (error) {
      console.warn('Failed to fetch real data, using mock data:', error);
      return this.getMockData(params.data_type, params.limit || 100);
    }
  }

  /**
   * 最新のセンサーデータを取得
   */
  async getLatestData(dataType: DataType): Promise<SensorData | null> {
    try {
      // 開発中はモックデータを使用
      if (IS_DEVELOPMENT) {
        const mockData = this.getMockData(dataType, 1);
        return mockData[0] || null;
      }

      // 将来のJSON API実装
      const response = await apiClient.get<SensorData>(API_ENDPOINTS.LATEST, {
        data_type: dataType
      });
      return response;
    } catch (error) {
      console.warn('Failed to fetch latest data, using mock data:', error);
      const mockData = this.getMockData(dataType, 1);
      return mockData[0] || null;
    }
  }

  /**
   * データサマリーを取得
   */
  async getSummary(params: GetSummaryParams): Promise<DataSummary> {
    try {
      // 開発中はモックデータから計算
      if (IS_DEVELOPMENT) {
        const mockData = this.getMockData(params.data_type, 100);
        return this.calculateSummary(mockData, params.period || 'day');
      }

      // 将来のJSON API実装
      const response = await apiClient.get<DataSummary>(API_ENDPOINTS.SUMMARY, params);
      return response;
    } catch (error) {
      console.warn('Failed to fetch summary, using mock data:', error);
      const mockData = this.getMockData(params.data_type, 100);
      return this.calculateSummary(mockData, params.period || 'day');
    }
  }

  /**
   * 時間範囲でデータを取得
   */
  async getDataByTimeRange(dataType: DataType, timeRange: string): Promise<SensorData[]> {
    const now = new Date();
    let startTime: Date;
    let limit: number;

    switch (timeRange) {
      case '24h':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        limit = 144; // 10分間隔
        break;
      case '7d':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        limit = 168; // 1時間間隔
        break;
      case '30d':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        limit = 720; // 1時間間隔
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        limit = 144;
    }

    return this.getData({
      data_type: dataType,
      start_time: startTime.toISOString(),
      end_time: now.toISOString(),
      limit
    });
  }

  /**
   * リアルタイムデータ更新の購読（将来実装）
   */
  subscribeToUpdates(
    dataType: DataType,
    callback: (data: SensorData) => void
  ): () => void {
    // WebSocket実装予定
    console.log(`Subscribing to ${dataType} updates`);
    
    // 現在は定期的なポーリングで代用
    const interval = setInterval(async () => {
      try {
        const latestData = await this.getLatestData(dataType);
        if (latestData) {
          callback(latestData);
        }
      } catch (error) {
        console.error('Failed to fetch real-time data:', error);
      }
    }, 5000); // 5秒間隔

    // 購読解除関数を返す
    return () => {
      clearInterval(interval);
    };
  }

  /**
   * モックデータを生成（開発・テスト用）
   */
  private getMockData(dataType: DataType, count: number): SensorData[] {
    const timeRangeHours = count <= 50 ? 24 : count <= 200 ? 168 : 720; // 24h, 7d, 30d
    return generateMockSensorData(dataType, count, timeRangeHours);
  }

  /**
   * データサマリーを計算
   */
  private calculateSummary(data: SensorData[], period: string): DataSummary {
    if (data.length === 0) {
      return {
        average: 0,
        minimum: 0,
        maximum: 0,
        count: 0,
        period
      };
    }

    const values = data.map(item => item.value);
    
    return {
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
      minimum: Math.min(...values),
      maximum: Math.max(...values),
      count: values.length,
      period
    };
  }
}

// デフォルトのサービスインスタンス
export const sensorService = new SensorService();