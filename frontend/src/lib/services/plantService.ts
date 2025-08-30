/**
 * 植物データサービス
 */

import type { Plant, CreatePlantRequest, UpdatePlantRequest } from '@/types';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, buildEndpoint } from '@/lib/api/endpoints';
import { DEFAULT_PLANT } from '@/types';
import { IS_DEVELOPMENT } from '@/lib/constants';

export class PlantService {
  /**
   * 植物一覧を取得
   */
  async getPlants(): Promise<Plant[]> {
    try {
      console.log('PlantService.getPlants: Starting, IS_DEVELOPMENT:', IS_DEVELOPMENT);

      // 開発中は単一植物のモックデータを使用
      if (IS_DEVELOPMENT) {
        console.log('PlantService.getPlants: Using mock data, DEFAULT_PLANT:', DEFAULT_PLANT);
        // 常に同じ構造のオブジェクトを返すように、スプレッド演算子で新しいオブジェクトを作成
        return [{
          ...DEFAULT_PLANT,
          thresholds: {
            temperature: { ...DEFAULT_PLANT.thresholds.temperature },
            pH: { ...DEFAULT_PLANT.thresholds.pH }
          }
        }];
      }

      // 将来のJSON API実装
      console.log('PlantService.getPlants: Calling API');
      const response = await apiClient.get<Plant[]>(API_ENDPOINTS.PLANTS);
      console.log('PlantService.getPlants: API response:', response);
      return response;
    } catch (error) {
      console.warn('Failed to fetch plants, using mock data:', error);
      return [DEFAULT_PLANT];
    }
  }

  /**
   * 特定の植物を取得
   */
  async getPlant(id: string): Promise<Plant> {
    try {
      // 開発中はデフォルト植物を返す
      if (IS_DEVELOPMENT) {
        return { 
          ...DEFAULT_PLANT, 
          id,
          thresholds: {
            temperature: { ...DEFAULT_PLANT.thresholds.temperature },
            pH: { ...DEFAULT_PLANT.thresholds.pH }
          }
        };
      }

      // 将来のJSON API実装
      const response = await apiClient.get<Plant>(buildEndpoint.plant(id));
      return response;
    } catch (error) {
      console.warn('Failed to fetch plant, using mock data:', error);
      return { ...DEFAULT_PLANT, id };
    }
  }

  /**
   * 植物を追加（将来実装）
   */
  async addPlant(plant: CreatePlantRequest): Promise<Plant> {
    try {
      // 開発中は新しいIDでモックデータを返す
      if (IS_DEVELOPMENT) {
        const newPlant: Plant = {
          ...plant,
          id: `plant-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return newPlant;
      }

      // 将来のJSON API実装
      const response = await apiClient.post<Plant>(API_ENDPOINTS.PLANTS, plant);
      return response;
    } catch (error) {
      console.error('Failed to add plant:', error);
      throw error;
    }
  }

  /**
   * 植物を更新（将来実装）
   */
  async updatePlant(id: string, updates: UpdatePlantRequest): Promise<Plant> {
    try {
      // 開発中は更新されたモックデータを返す
      if (IS_DEVELOPMENT) {
        const currentPlant = await this.getPlant(id);
        const updatedPlant: Plant = {
          ...currentPlant,
          ...updates,
          // thresholdsが部分的に更新される場合は、既存の値とマージ
          thresholds: updates.thresholds
            ? {
              temperature: updates.thresholds.temperature || currentPlant.thresholds.temperature,
              pH: updates.thresholds.pH || currentPlant.thresholds.pH,
            }
            : currentPlant.thresholds,
          updated_at: new Date().toISOString()
        };
        return updatedPlant;
      }

      // 将来のJSON API実装
      const response = await apiClient.put<Plant>(buildEndpoint.plant(id), updates);
      return response;
    } catch (error) {
      console.error('Failed to update plant:', error);
      throw error;
    }
  }

  /**
   * 植物を削除（将来実装）
   */
  async deletePlant(id: string): Promise<void> {
    try {
      // 開発中は何もしない
      if (IS_DEVELOPMENT) {
        console.log(`Mock: Deleting plant ${id}`);
        return;
      }

      // 将来のJSON API実装
      await apiClient.delete<void>(buildEndpoint.plant(id));
    } catch (error) {
      console.error('Failed to delete plant:', error);
      throw error;
    }
  }

  /**
   * 植物の健康状態を評価
   */
  evaluateHealthStatus(plant: Plant, latestData: { temperature?: number; pH?: number }): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
  } {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    // 温度チェック
    if (latestData.temperature !== undefined) {
      const tempThreshold = plant.thresholds.temperature;
      if (latestData.temperature < tempThreshold.min) {
        issues.push('温度が低すぎます');
        status = 'warning';
      } else if (latestData.temperature > tempThreshold.max) {
        issues.push('温度が高すぎます');
        status = 'critical';
      }
    }

    // pHチェック
    if (latestData.pH !== undefined) {
      const phThreshold = plant.thresholds.pH;
      if (latestData.pH < phThreshold.min) {
        issues.push('pHが低すぎます（酸性）');
        status = status === 'critical' ? 'critical' : 'warning';
      } else if (latestData.pH > phThreshold.max) {
        issues.push('pHが高すぎます（アルカリ性）');
        status = status === 'critical' ? 'critical' : 'warning';
      }
    }

    return { status, issues };
  }
}

// デフォルトのサービスインスタンス
export const plantService = new PlantService();