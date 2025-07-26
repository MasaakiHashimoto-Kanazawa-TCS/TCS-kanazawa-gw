"""
アプリケーション設定管理
"""
from pydantic_settings import BaseSettings
from typing import Optional


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
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# グローバル設定インスタンス
settings = Settings()