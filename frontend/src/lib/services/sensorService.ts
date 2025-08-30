/**
 * センサーデータサービス
 */

import type { SensorData, DataSummary, DataType, GetDataParams, GetSummaryParams } from '@/types';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { transformSensorData, transformDynamoDBData, generateMockSensorData } from '@/lib/utils/dataTransform';
import { IS_DEVELOPMENT } from '@/lib/constants';

export class SensorService {
  /**
   * センサーデータを取得
   */
  async getData(params: GetDataParams): Promise<SensorData[]> {
    try {
      console.log('SensorService.getData called with:', params);
      console.log('IS_DEVELOPMENT:', IS_DEVELOPMENT);
      
      // 現在のバックエンドAPIはHTML形式なので、開発中はモックデータを使用
      if (IS_DEVELOPMENT) {
        console.log('Using mock data (development mode)');
        return this.getMockData(params.data_type, params.limit || 100);
      }

      console.log('Calling API endpoint:', API_ENDPOINTS.DATA);
      // 将来のJSON API実装（DynamoDBデータ構造に対応）
      const response = await apiClient.get<any[]>(API_ENDPOINTS.DATA, params);
      console.log('API response:', response);
      
      const transformedData = transformDynamoDBData(response);
      console.log('Transformed data:', transformedData);
      
      return transformedData;
    } catch (error) {
      console.error('Failed to fetch real data, using mock data:', error);
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
      console.log('SensorService.getSummary called with:', params);
      
      // 開発中はモックデータから計算
      if (IS_DEVELOPMENT) {
        console.log('Using mock data for summary (development mode)');
        const mockData = this.getMockData(params.data_type, 100);
        return this.calculateSummary(mockData, params.period || 'day');
      }

      // 実際のAPIを呼び出す際は、広い期間を指定
      const apiParams = {
        ...params,
        period: 'year' // 1年間のデータでサマリーを計算
      };
      
      console.log('Calling summary API with params:', apiParams);
      const response = await apiClient.get<DataSummary>(API_ENDPOINTS.SUMMARY, apiParams);
      console.log('Summary API response:', response);
      
      return response;
    } catch (error) {
      console.error('Failed to fetch summary, using mock data:', error);
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
      case '150d':
        startTime = new Date(now.getTime() - 150 * 24 * 60 * 60 * 1000);
        limit = 3600; // 1時間間隔
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
   * カスタム期間でデータを取得
   */
  async getDataByCustomRange(dataType: DataType, startTime: string, endTime: string): Promise<SensorData[]> {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // 期間に応じてデータポイント数を調整
    let limit: number;
    if (diffDays <= 1) {
      limit = 144; // 10分間隔
    } else if (diffDays <= 7) {
      limit = 168; // 1時間間隔
    } else if (diffDays <= 30) {
      limit = 720; // 1時間間隔
    } else {
      limit = Math.min(diffDays * 24, 3600); // 最大3600ポイント
    }

    return this.getData({
      data_type: dataType,
      start_time: startTime,
      end_time: endTime,
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