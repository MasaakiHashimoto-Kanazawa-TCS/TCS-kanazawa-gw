/**
 * シンプルなテスト用ダッシュボード
 */

'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_PLANT } from '@/types';
import { sensorService } from '@/lib/services';

export function SimpleDashboard() {
  const [loading, setLoading] = useState(true);
  const [temperatureData, setTemperatureData] = useState<any[]>([]);
  const [phData, setPhData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('SimpleDashboard: Fetching data...');
        setLoading(true);
        setError(null);

        // 温度データを取得
        const tempData = await sensorService.getDataByTimeRange('temperature', '24h');
        console.log('Temperature data:', tempData);
        setTemperatureData(tempData);

        // pHデータを取得
        const phDataResult = await sensorService.getDataByTimeRange('ph', '24h');
        console.log('pH data:', phDataResult);
        setPhData(phDataResult);

        setLoading(false);
        console.log('SimpleDashboard: Data loaded successfully');
      } catch (err) {
        console.error('SimpleDashboard: Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">エラーが発生しました</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">植物監視ダッシュボード</h1>
        <p className="text-gray-600">最終更新: {new Date().toLocaleTimeString('ja-JP')}</p>
      </div>

      {/* 植物情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">植物情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">名前</p>
            <p className="font-medium">{DEFAULT_PLANT.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">種類</p>
            <p className="font-medium">{DEFAULT_PLANT.species}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">場所</p>
            <p className="font-medium">{DEFAULT_PLANT.location}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">デバイスID</p>
            <p className="font-medium">{DEFAULT_PLANT.device_id}</p>
          </div>
        </div>
      </div>

      {/* センサーデータ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 温度データ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">温度データ</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">データ数: {temperatureData.length}件</p>
            {temperatureData.length > 0 && (
              <>
                <p className="text-sm text-gray-600">
                  最新値: {temperatureData[temperatureData.length - 1]?.value}°C
                </p>
                <p className="text-sm text-gray-600">
                  最新時刻: {new Date(temperatureData[temperatureData.length - 1]?.timestamp).toLocaleString('ja-JP')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* pHデータ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">pHデータ</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">データ数: {phData.length}件</p>
            {phData.length > 0 && (
              <>
                <p className="text-sm text-gray-600">
                  最新値: {phData[phData.length - 1]?.value}
                </p>
                <p className="text-sm text-gray-600">
                  最新時刻: {new Date(phData[phData.length - 1]?.timestamp).toLocaleString('ja-JP')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* システム状態 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">システム状態</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">植物監視: 正常</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${temperatureData.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">温度センサー: {temperatureData.length > 0 ? '正常' : 'エラー'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${phData.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-600">pHセンサー: {phData.length > 0 ? '正常' : 'エラー'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}