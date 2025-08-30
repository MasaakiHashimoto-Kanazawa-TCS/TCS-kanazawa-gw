/**
 * APIクライアント
 */

import type { ApiResponse, RequestOptions } from '@/types';
import { API_BASE_URL, API_TIMEOUT } from '@/lib/constants';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // 末尾のスラッシュを削除
    this.timeout = timeout;
  }

  /**
   * HTTP GETリクエスト
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>(url, { method: 'GET' });
  }

  /**
   * HTTP POSTリクエスト
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, {
      method: 'POST',
      body: data
    });
  }

  /**
   * HTTP PUTリクエスト
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, {
      method: 'PUT',
      body: data
    });
  }

  /**
   * HTTP DELETEリクエスト
   */
  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>(url, { method: 'DELETE' });
  }

  /**
   * 基本的なHTTPリクエスト処理
   */
  private async request<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // レスポンスがJSONかどうかチェック
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // 新しいAPIの場合、直接データを返す
        if (Array.isArray(data) || typeof data === 'object') {
          return data as T;
        }
        
        // 古いAPIレスポンス形式の場合
        if (data.status === 'error') {
          throw new ApiError(
            response.status,
            data.error?.code || 'UNKNOWN_ERROR',
            data.error?.message || 'Unknown error occurred',
            data.error?.details
          );
        }

        return (data.data || data) as T;
      } else {
        // HTMLレスポンスの場合（現在のバックエンドAPI）
        const text = await response.text();
        return text as unknown as T;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError(408, 'TIMEOUT', 'Request timeout');
        }
        throw new ApiError(0, 'NETWORK_ERROR', error.message);
      }

      throw new ApiError(0, 'UNKNOWN_ERROR', 'Unknown error occurred');
    }
  }

  /**
   * エラーレスポンスの処理
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = { message: await response.text() };
      }
    } catch {
      errorData = { message: `HTTP ${response.status} ${response.statusText}` };
    }

    throw new ApiError(
      response.status,
      errorData.error?.code || `HTTP_${response.status}`,
      errorData.error?.message || errorData.message || `HTTP ${response.status} ${response.statusText}`,
      errorData.error?.details
    );
  }

  /**
   * URLを構築
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    if (!params) return url;

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${url}?${queryString}` : url;
  }
}

// デフォルトのAPIクライアントインスタンス
export const apiClient = new ApiClient();