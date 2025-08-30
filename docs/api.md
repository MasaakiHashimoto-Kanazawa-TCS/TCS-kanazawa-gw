# API仕様書

## 概要

Plant Monitor Backend APIは、植物監視システムのデータ取得とグラフ生成を提供するRESTful APIです。

## ベースURL

- **開発環境**: `http://localhost:8000`
- **本番環境**: `https://api.plant-monitor.example.com`

## 認証

現在のバージョンでは認証は実装されていません。将来のバージョンでAPI キーまたはJWT認証を実装予定です。

## エンドポイント

### 1. ホームページ / データ可視化

#### `GET /`

植物監視データの可視化ページを表示します。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| `data_type` | string | No | "temperature" | データの種類 |
| `days` | integer | No | 7 | 表示する日数 |

**data_type の有効な値:**
- `temperature` - 温度
- `pH` - 水素イオン指数
- `humidity` - 湿度

**レスポンス:**
- **Content-Type**: `text/html`
- **Status Code**: 200 OK

**例:**

```bash
# 温度データを7日間表示
GET /?data_type=temperature&days=7

# 湿度データを14日間表示
GET /?data_type=humidity&days=14
```

**レスポンス例:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Plant Monitor</title>
</head>
<body>
    <div id="plot">
        <!-- Plotlyグラフが挿入される -->
    </div>
</body>
</html>
```

### 2. API エンドポイント (将来実装予定)

#### `GET /api/v1/data`

センサーデータをJSON形式で取得します。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| `data_type` | string | Yes | - | データの種類 |
| `start_time` | string | No | 7日前 | 開始時刻 (ISO 8601) |
| `end_time` | string | No | 現在時刻 | 終了時刻 (ISO 8601) |
| `limit` | integer | No | 1000 | 最大取得件数 |

**レスポンス:**
```json
{
  "status": "success",
  "data": [
    {
      "timestamp": "2025-01-26T10:30:00Z",
      "value": 23.5,
      "device_id": "sensor_001",
      "location": "greenhouse_a"
    }
  ],
  "meta": {
    "total_count": 1,
    "data_type": "temperature",
    "start_time": "2025-01-19T10:30:00Z",
    "end_time": "2025-01-26T10:30:00Z"
  }
}
```

#### `GET /api/v1/data/latest`

最新のセンサーデータを取得します。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| `data_type` | string | Yes | - | データの種類 |

**レスポンス:**
```json
{
  "status": "success",
  "data": {
    "timestamp": "2025-01-26T10:30:00Z",
    "value": 23.5,
    "device_id": "sensor_001",
    "location": "greenhouse_a"
  }
}
```

#### `GET /api/v1/data/summary`

指定期間のデータサマリーを取得します。

**パラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|---|------|-----------|------|
| `data_type` | string | Yes | - | データの種類 |
| `period` | string | No | "day" | 集計期間 (hour/day/week/month) |
| `start_time` | string | No | 7日前 | 開始時刻 (ISO 8601) |
| `end_time` | string | No | 現在時刻 | 終了時刻 (ISO 8601) |

**レスポンス:**
```json
{
  "status": "success",
  "data": {
    "average": 23.2,
    "minimum": 18.5,
    "maximum": 28.1,
    "count": 2016,
    "period": "day"
  },
  "meta": {
    "data_type": "temperature",
    "start_time": "2025-01-19T10:30:00Z",
    "end_time": "2025-01-26T10:30:00Z"
  }
}
```

## エラーレスポンス

### エラー形式

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid data_type parameter",
    "details": "data_type must be one of: temperature, pH"
  },
  "timestamp": "2025-01-26T10:30:00Z"
}
```

### エラーコード

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| `INVALID_PARAMETER` | 400 | 無効なパラメータ |
| `DATA_NOT_FOUND` | 404 | データが見つからない |
| `DATABASE_ERROR` | 500 | データベースエラー |
| `INTERNAL_ERROR` | 500 | 内部サーバーエラー |

## データ型

### SensorData

```typescript
interface SensorData {
  timestamp: string;      // ISO 8601形式
  value: number;          // センサー値
  device_id: string;      // デバイスID
  location: string;       // 設置場所
}
```

### DataSummary

```typescript
interface DataSummary {
  average: number;        // 平均値
  minimum: number;        // 最小値
  maximum: number;        // 最大値
  count: number;          // データ件数
  period: string;         // 集計期間
}
```

### ApiResponse

```typescript
interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  meta?: {
    [key: string]: any;
  };
  timestamp?: string;
}
```

## レート制限

現在のバージョンではレート制限は実装されていません。将来のバージョンで実装予定です。

**予定仕様:**
- **制限**: 1000リクエスト/時間
- **ヘッダー**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## CORS

開発環境では全てのオリジンからのアクセスを許可しています。本番環境では適切なCORS設定を行います。

## WebSocket API (将来実装予定)

リアルタイムデータ更新のためのWebSocket APIを実装予定です。

### 接続

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/data');
```

### メッセージ形式

**購読開始:**
```json
{
  "action": "subscribe",
  "data_type": "temperature"
}
```

**データ受信:**
```json
{
  "type": "data_update",
  "data": {
    "timestamp": "2025-01-26T10:30:00Z",
    "value": 23.5,
    "device_id": "sensor_001",
    "location": "greenhouse_a"
  }
}
```

## SDK・クライアントライブラリ

### JavaScript/TypeScript

```typescript
import { PlantMonitorClient } from '@plant-monitor/client';

const client = new PlantMonitorClient({
  baseUrl: 'http://localhost:8000'
});

// データ取得
const data = await client.getData({
  dataType: 'temperature',
  days: 7
});

// 最新データ取得
const latest = await client.getLatestData('temperature');
```

### Python

```python
from plant_monitor_client import PlantMonitorClient

client = PlantMonitorClient(base_url='http://localhost:8000')

# データ取得
data = client.get_data(data_type='temperature', days=7)

# 最新データ取得
latest = client.get_latest_data('temperature')
```

## 変更履歴

### v0.1.0 (2025-01-26)
- 初期リリース
- 基本的なデータ取得機能
- HTML形式でのグラフ表示

### 今後の予定

#### v0.2.0
- JSON API エンドポイント追加
- エラーハンドリング改善
- レスポンス形式標準化

#### v0.3.0
- WebSocket API実装
- リアルタイムデータ更新
- 認証機能追加

#### v1.0.0
- 本番環境対応
- パフォーマンス最適化
- 包括的なテストカバレッジ