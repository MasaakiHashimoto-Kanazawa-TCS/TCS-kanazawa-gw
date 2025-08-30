"""
アプリケーション設定管理
"""
from pydantic_settings import BaseSettings
from typing import Optional
import logging


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # AWS設定
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "ap-northeast-1"
    
    # DynamoDB設定
    dynamodb_table_name: str = "aggdata_table"
    
    # アプリケーション設定
    default_data_type: str = "temperature"
    default_period_days: int = 7
    environment: str = "development"
    
    # API設定
    api_title: str = "Plant Monitor API"
    api_description: str = "植物監視システムのバックエンドAPI"
    api_version: str = "0.1.0"
    
    # ログ設定
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    enable_request_logging: bool = True
    log_to_file: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# グローバル設定インスタンス
settings = Settings()


def setup_logging():
    """ログ設定を初期化"""
    import os
    
    # ログディレクトリを作成
    log_dir = "logs"
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    handlers = [
        logging.StreamHandler(),  # コンソール出力
    ]
    
    # ファイル出力を追加（オプション）
    if hasattr(settings, 'log_to_file') and settings.log_to_file:
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            filename=os.path.join(log_dir, "app.log"),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        file_handler.setFormatter(logging.Formatter(settings.log_format))
        handlers.append(file_handler)
    
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format=settings.log_format,
        handlers=handlers
    )
    
    # uvicornのログレベルも設定
    logging.getLogger("uvicorn").setLevel(getattr(logging, settings.log_level.upper()))
    logging.getLogger("uvicorn.access").setLevel(getattr(logging, settings.log_level.upper()))