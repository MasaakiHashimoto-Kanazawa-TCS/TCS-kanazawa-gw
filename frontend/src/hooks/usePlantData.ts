/**
 * 植物データ取得フック
 */

import { useState, useCallback, useEffect } from 'react';
import type { Plant } from '@/types';
import { useApiData } from './useApiData';
import { DATA_REFRESH_INTERVAL } from '@/lib/constants';
import { plantService } from '@/lib/services';

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
  console.log('usePlantData: Hook called');

  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [plants, setPlantsData] = useState<Plant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  // バックエンドAPIから植物データを取得
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        console.log('usePlantData: Loading from backend API');
        setLoading(true);
        setError(null);

        // バックエンドAPIから植物データを取得
        const plantsData = await plantService.getPlants();
        console.log('usePlantData: Using backend API plant data:', plantsData);

        setPlantsData(plantsData);

        // 初回データ取得時に最初の植物を選択
        if (plantsData.length > 0 && !selectedPlantId) {
          console.log('usePlantData: Selecting first plant:', plantsData[0].id);
          setSelectedPlantId(plantsData[0].id);
        }
      } catch (err) {
        console.error('usePlantData: Backend API fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load plant data from backend API');
      } finally {
        console.log('usePlantData: Setting loading to false');
        setLoading(false);
      }
    };

    fetchPlants();
  }, []); // 依存関係を空にして初回のみ実行

  console.log('usePlantData state:', { loading, error, plants: plants?.length, selectedPlantId });

  // 選択された植物を取得
  const selectedPlant = plants?.find(plant => plant.id === selectedPlantId) || null;

  // 植物を選択
  const selectPlant = useCallback((id: string) => {
    setSelectedPlantId(id);
  }, []);

  // データを更新
  const refreshData = useCallback(async () => {
    try {
      setIsRefetching(true);
      
      // バックエンドAPIから植物データを再取得
      const plantsData = await plantService.getPlants();
      console.log('usePlantData: Refresh using backend API data:', plantsData);
      
      setPlantsData(plantsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh plant data from backend API');
    } finally {
      setIsRefetching(false);
    }
  }, []);

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