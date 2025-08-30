"""
API v1 endpoints for Plant Monitor
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta
from typing import List, Optional
import logging
from ..services.dynamodb import DynamoDBService
from ..config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["v1"])

# DynamoDBサービスのインスタンス
try:
    dynamodb_service = DynamoDBService()
    logger.info("DynamoDBサービスが初期化されました")
except Exception as e:
    logger.error(f"DynamoDB初期化エラー: {str(e)}")
    dynamodb_service = None

@router.get("/data")
async def get_sensor_data(
    data_type: str = Query(..., description="データタイプ (temperature, pH)"),
    start_time: Optional[str] = Query(None, description="開始時刻 (ISO format)"),
    end_time: Optional[str] = Query(None, description="終了時刻 (ISO format)"),
    limit: int = Query(1000, description="最大取得件数")
):
    """
    センサーデータを取得
    """
    if not dynamodb_service:
        raise HTTPException(status_code=500, detail="DynamoDB service not available")
    
    try:
        logger.info(f"センサーデータ取得開始: data_type={data_type}, limit={limit}")
        
        # デフォルトの時間範囲を設定（過去1年間）
        if not start_time or not end_time:
            end_dt = datetime.now()
            start_dt = end_dt - timedelta(days=365)
            start_time = start_dt.strftime("%Y-%m-%d %H:%M:%S")
            end_time = end_dt.strftime("%Y-%m-%d %H:%M:%S")
            logger.debug(f"デフォルト時間範囲を使用: {start_time} - {end_time}")
        else:
            # ISO形式からDynamoDB形式に変換
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            start_time = start_dt.strftime("%Y-%m-%d %H:%M:%S")
            end_time = end_dt.strftime("%Y-%m-%d %H:%M:%S")
            logger.debug(f"指定時間範囲: {start_time} - {end_time}")
        
        # DynamoDBからデータを取得
        raw_data = dynamodb_service.get_data(data_type, start_time, end_time)
        logger.info(f"DynamoDBから{len(raw_data)}件のデータを取得")
        
        # フロントエンド用の形式に変換
        result = []
        for item in raw_data[:limit]:  # limitを適用
            result.append({
                "timestamp": item["insert_date"] + "Z",  # ISO形式に変換
                "value": float(item["avg_value"]),
                "device_id": "sensor_001",  # 固定値
                "location": "温室A"  # 固定値
            })
        
        # 時刻順にソート
        result.sort(key=lambda x: x["timestamp"])
        
        logger.info(f"センサーデータ取得完了: {len(result)}件のデータを返却")
        return result
        
    except Exception as e:
        logger.error(f"データ取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"データ取得に失敗しました: {str(e)}")

@router.get("/data/latest")
async def get_latest_data(
    data_type: str = Query(..., description="データタイプ (temperature, pH)")
):
    """
    最新のセンサーデータを取得
    """
    if not dynamodb_service:
        raise HTTPException(status_code=500, detail="DynamoDB service not available")
    
    try:
        logger.info(f"最新データ取得開始: data_type={data_type}")
        
        # 過去1年間のデータを取得
        end_dt = datetime.now()
        start_dt = end_dt - timedelta(days=365)
        start_time = start_dt.strftime("%Y-%m-%d %H:%M:%S")
        end_time = end_dt.strftime("%Y-%m-%d %H:%M:%S")
        
        raw_data = dynamodb_service.get_data(data_type, start_time, end_time)
        
        if not raw_data:
            logger.warning(f"最新データが見つかりません: data_type={data_type}")
            return None
        
        # 最新のデータを取得
        latest = max(raw_data, key=lambda x: x["insert_date"])
        
        result = {
            "timestamp": latest["insert_date"] + "Z",
            "value": float(latest["avg_value"]),
            "device_id": "sensor_001",
            "location": "温室A"
        }
        
        logger.info(f"最新データ取得完了: timestamp={result['timestamp']}, value={result['value']}")
        return result
        
    except Exception as e:
        logger.error(f"最新データ取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"最新データ取得に失敗しました: {str(e)}")

@router.get("/data/summary")
async def get_data_summary(
    data_type: str = Query(..., description="データタイプ (temperature, pH)"),
    period: str = Query("day", description="集計期間"),
    start_time: Optional[str] = Query(None, description="開始時刻 (ISO format)"),
    end_time: Optional[str] = Query(None, description="終了時刻 (ISO format)")
):
    """
    データサマリーを取得
    """
    if not dynamodb_service:
        raise HTTPException(status_code=500, detail="DynamoDB service not available")
    
    try:
        logger.info(f"データサマリー取得開始: data_type={data_type}, period={period}")
        
        # デフォルトの時間範囲を設定（データが古いため、広い範囲で検索）
        if not start_time or not end_time:
            end_dt = datetime.now()
            if period == "day":
                start_dt = end_dt - timedelta(days=365)  # 1年間に拡張
            elif period == "week":
                start_dt = end_dt - timedelta(days=365)  # 1年間に拡張
            elif period == "month":
                start_dt = end_dt - timedelta(days=365)  # 1年間に拡張
            else:
                start_dt = end_dt - timedelta(days=365)
            
            start_time = start_dt.strftime("%Y-%m-%d %H:%M:%S")
            end_time = end_dt.strftime("%Y-%m-%d %H:%M:%S")
            logger.debug(f"デフォルト時間範囲を使用: {start_time} - {end_time}")
        else:
            # ISO形式からDynamoDB形式に変換
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            start_time = start_dt.strftime("%Y-%m-%d %H:%M:%S")
            end_time = end_dt.strftime("%Y-%m-%d %H:%M:%S")
            logger.debug(f"指定時間範囲: {start_time} - {end_time}")
        
        raw_data = dynamodb_service.get_data(data_type, start_time, end_time)
        
        if not raw_data:
            logger.warning(f"サマリー用データが見つかりません: data_type={data_type}")
            return {
                "average": 0,
                "minimum": 0,
                "maximum": 0,
                "count": 0,
                "period": period
            }
        
        values = [float(item["avg_value"]) for item in raw_data]
        
        result = {
            "average": sum(values) / len(values),
            "minimum": min(values),
            "maximum": max(values),
            "count": len(values),
            "period": period
        }
        
        logger.info(f"データサマリー取得完了: count={result['count']}, avg={result['average']:.2f}")
        return result
        
    except Exception as e:
        logger.error(f"サマリー取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail=f"サマリー取得に失敗しました: {str(e)}")

@router.get("/plants")
async def get_plants():
    """
    植物情報を取得
    """
    # 現在は固定データを返す（将来的にはデータベースから取得）
    return [
        {
            "id": "plant-001",
            "name": "バジル",
            "species": "Ocimum basilicum",
            "location": "温室A",
            "device_id": "sensor_001",
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": datetime.now().isoformat() + "Z",
            "thresholds": {
                "temperature": {"min": 18, "max": 28},
                "pH": {"min": 6.0, "max": 7.5}
            }
        }
    ]

@router.get("/health")
async def health_check():
    """
    ヘルスチェック
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat() + "Z",
        "dynamodb": "connected" if dynamodb_service else "disconnected"
    }