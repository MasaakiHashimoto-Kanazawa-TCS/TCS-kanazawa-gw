"""
API エンドポイントのテスト
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_read_main():
    """メインエンドポイントのテスト"""
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_read_main_with_params():
    """パラメータ付きメインエンドポイントのテスト"""
    response = client.get("/?data_type=humidity&days=14")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_invalid_data_type():
    """無効なdata_typeパラメータのテスト"""
    response = client.get("/?data_type=invalid_type")
    # 現在の実装では無効なdata_typeでもエラーページが返される
    assert response.status_code == 200


def test_invalid_days():
    """無効なdaysパラメータのテスト"""
    response = client.get("/?days=-1")
    # 現在の実装では無効なdaysでもエラーページが返される
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_api_docs():
    """API ドキュメントのテスト"""
    response = client.get("/docs")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_openapi_json():
    """OpenAPI JSONのテスト"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"