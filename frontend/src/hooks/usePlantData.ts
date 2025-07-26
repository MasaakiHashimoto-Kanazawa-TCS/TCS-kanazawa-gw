/**
 * 植物データ取得フック
 */

import { useState, useCallback } from 'react';
import type { Plant } from '@/types';
import { plantService } from '@/lib/services';
import { useApiData } from './useApiData';
import { DATA_REFRESH_INTERVAL } from '@/lib/constants';

export interface UsePlantDataResult {
  plants: Plant[];
  selectedPlant: Plant | null;
  loading: boolean;
  error: string | null;
  selectPlant: (id: string) => void;
  refreshData: () => Promise<void>;
  isRefetching: boolean;
}

/**
 * 植物データ取得フック
 */
export function usePlantData(): UsePlantDataResult {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);

  // 植物一覧の取得
  const {
    data: plants,
    loading,
    error,
    refetch,
    isRefetching
  } = useApiData(
    () => plantService.getPlants(),
    {
      refetchInterval: DATA_REFRESH_INTERVAL,
      onSuccess: (data) => {
        // 初回データ取得時に最初の植物を選択
        if (data.length > 0 && !selectedPlantId) {
          setSelectedPlantId(data[0].id);
        }
      }
    }
  );

  // 選択された植物を取得
  const selectedPlant = plants?.find(plant => plant.id === selectedPlantId) || null;

  // 植物を選択
  const selectPlant = useCallback((id: string) => {
    setSelectedPlantId(id);
  }, []);

  // データを更新
  const refreshData = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    plants: plants || [],
    selectedPlant,
    loading,
    error,
    selectPlant,
    refreshData,
    isRefetching
  };
}

/**
 * 特定の植物データ取得フック
 */
export function usePlant(plantId: string) {
  return useApiData(
    () => plantService.getPlant(plantId),
    {
      enabled: !!plantId,
      refetchInterval: DATA_REFRESH_INTERVAL
    }
  );
}