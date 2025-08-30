/**
 * 植物データ取得フック
 */

import { useState, useCallback, useEffect } from 'react';
import type { Plant } from '@/types';
import { DEFAULT_PLANT } from '@/types';
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
  console.log('usePlantData: Hook called');

  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null);
  const [plants, setPlantsData] = useState<Plant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);

  // 直接植物データを取得
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        console.log('usePlantData: Direct fetch starting');
        setLoading(true);
        setError(null);

        // 一時的に直接DEFAULT_PLANTを使用
        const plantsData = [DEFAULT_PLANT];
        console.log('usePlantData: Using DEFAULT_PLANT directly:', plantsData);

        setPlantsData(plantsData);

        // 初回データ取得時に最初の植物を選択
        if (plantsData.length > 0 && !selectedPlantId) {
          console.log('usePlantData: Selecting first plant:', plantsData[0].id);
          setSelectedPlantId(plantsData[0].id);
        }
      } catch (err) {
        console.error('usePlantData: Direct fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch plants');
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
      
      // 初回データ取得と同じロジックを使用
      const plantsData = [DEFAULT_PLANT];
      console.log('usePlantData: Refresh using DEFAULT_PLANT:', plantsData);
      
      setPlantsData(plantsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh plants');
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