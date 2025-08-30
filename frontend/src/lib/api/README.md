# API統合ガイド

## 現在の状況

現在のバックエンドは以下の構造になっています：

### DynamoDBデータ構造
```
aggdata_table:
- data_type (パーティションキー): "temperature" | "pH"
- insert_date (ソートキー): "YYYY-MM-DD HH:MM:SS"
- avg_value (数値): センサーの平均値
```

### 現在のバックエンドAPI
- `GET /` - HTML形式でのグラフ表示のみ

## フロントエンド統合のための推奨バックエンド実装

フロントエンドを完全に動作させるには、以下のJSON APIエンドポイントの実装が推奨されます：

### 1. データ取得API
```python
@app.get("/api/v1/data")
async def get_data(
    data_type: str,
    start_time: str = None,
    end_time: str = None,
    limit: int = 1000
):
    """
    センサーデータを取得
    
    Returns:
    [
        {
            "insert_date": "2025-01-26T10:30:00Z",
            "avg_value": 23.5
        }
    ]
    """
    # DynamoDBからデータを取得
    data = dynamodb_service.get_data(data_type, start_time, end_time)
    
    # フロントエンド用に変換（device_id, locationは固定値）
    result = []
    for item in data:
        result.append({
            "timestamp": item["insert_date"],
            "value": item["avg_value"],
            "device_id": "sensor_001",  # 固定値
            "location": "温室A"         # 固定値
        })
    
    return result
```

### 2. 最新データ取得API
```python
@app.get("/api/v1/data/latest")
async def get_latest_data(data_type: str):
    """
    最新のセンサーデータを取得
    """
    # 最新の1件を取得
    data = dynamodb_service.get_data(
        data_type, 
        (datetime.now() - timedelta(hours=1)).strftime("%Y-%m-%d %H:%M:%S"),
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    if data:
        latest = max(data, key=lambda x: x["insert_date"])
        return {
            "timestamp": latest["insert_date"],
            "value": latest["avg_value"],
            "device_id": "sensor_001",
            "location": "温室A"
        }
    
    return None
```

### 3. データサマリーAPI
```python
@app.get("/api/v1/data/summary")
async def get_data_summary(
    data_type: str,
    period: str = "day",
    start_time: str = None,
    end_time: str = None
):
    """
    データサマリーを取得
    """
    data = dynamodb_service.get_data(data_type, start_time, end_time)
    
    if not data:
        return {
            "average": 0,
            "minimum": 0,
            "maximum": 0,
            "count": 0,
            "period": period
        }
    
    values = [item["avg_value"] for item in data]
    
    return {
        "average": sum(values) / len(values),
        "minimum": min(values),
        "maximum": max(values),
        "count": len(values),
        "period": period
    }
```

### 4. 植物情報API
```python
@app.get("/api/v1/plants")
async def get_plants():
    """
    植物情報を取得（設定ファイルまたはデータベースから）
    """
    return [
        {
            "id": "plant-001",
            "name": "バジル",
            "species": "Ocimum basilicum",
            "location": "温室A",
            "device_id": "sensor_001",
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2025-01-26T00:00:00Z",
            "thresholds": {
                "temperature": {"min": 18, "max": 28},
                "pH": {"min": 6.0, "max": 7.5}
            }
        }
    ]
```

### 5. CORS設定
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 現在のフロントエンド動作

フロントエンドは現在、開発モード（`IS_DEVELOPMENT = true`）でモックデータを使用して動作します。
実際のAPIが実装されるまで、この設定で基本的な機能確認が可能です。

## データマッピング

DynamoDBの実際のデータ構造とフロントエンドが期待する構造の対応：

| DynamoDB | フロントエンド | 説明 |
|----------|---------------|------|
| `insert_date` | `timestamp` | 日時データ |
| `avg_value` | `value` | センサー値 |
| (なし) | `device_id` | 固定値 "sensor_001" |
| (なし) | `location` | 固定値 "温室A" |

この構造により、既存のDynamoDBデータを変更することなく、フロントエンドとの統合が可能です。