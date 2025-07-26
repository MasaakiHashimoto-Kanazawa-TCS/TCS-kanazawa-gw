/**
 * APIエンドポイント定義
 */

export const API_ENDPOINTS = {
  // 現在のバックエンドAPI（HTML形式）
  ROOT: '/',
  
  // 将来実装予定のJSON API
  DATA: '/api/v1/data',
  LATEST: '/api/v1/data/latest',
  SUMMARY: '/api/v1/data/summary',
  PLANTS: '/api/v1/plants',
  ALERTS: '/api/v1/alerts',
  
  // WebSocket（将来実装予定）
  WEBSOCKET: '/ws/data'
} as const;

/**
 * エンドポイントのパラメータ化
 */
export const buildEndpoint = {
  /**
   * 植物詳細エンドポイント
   */
  plant: (id: string) => `${API_ENDPOINTS.PLANTS}/${id}`,
  
  /**
   * 植物のセンサーデータエンドポイント
   */
  plantData: (id: string) => `${API_ENDPOINTS.PLANTS}/${id}/data`,
  
  /**
   * アラート詳細エンドポイント
   */
  alert: (id: string) => `${API_ENDPOINTS.ALERTS}/${id}`
};