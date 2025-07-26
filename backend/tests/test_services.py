"""
サービス層のテスト
"""
import pytest
from unittest.mock import Mock, patch
from app.services.dynamodb import DynamoDBService
from app.services.graph import GraphService


class TestDynamoDBService:
    """DynamoDBServiceのテスト"""
    
    @patch('app.services.dynamodb.boto3')
    def test_init(self, mock_boto3):
        """初期化のテスト"""
        service = DynamoDBService()
        assert service is not None
        mock_boto3.resource.assert_called_once()
    
    @patch('app.services.dynamodb.boto3')
    def test_get_data_success(self, mock_boto3):
        """データ取得成功のテスト"""
        # モックの設定
        mock_table = Mock()
        mock_response = {
            'Items': [
                {
                    'timestamp': '2025-01-26T10:30:00',
                    'value': 23.5
                }
            ]
        }
        mock_table.query.return_value = mock_response
        mock_boto3.resource.return_value.Table.return_value = mock_table
        
        service = DynamoDBService()
        result = service.get_data('temperature', '2025-01-19', '2025-01-26')
        
        assert len(result) == 1
        assert result[0]['value'] == 23.5
    
    @patch('app.services.dynamodb.boto3')
    def test_get_data_empty(self, mock_boto3):
        """データが空の場合のテスト"""
        mock_table = Mock()
        mock_response = {'Items': []}
        mock_table.query.return_value = mock_response
        mock_boto3.resource.return_value.Table.return_value = mock_table
        
        service = DynamoDBService()
        result = service.get_data('temperature', '2025-01-19', '2025-01-26')
        
        assert len(result) == 0


class TestGraphService:
    """GraphServiceのテスト"""
    
    def test_init(self):
        """初期化のテスト"""
        service = GraphService()
        assert service is not None
    
    def test_create_time_series_plot_empty_data(self):
        """空データでのグラフ生成テスト"""
        service = GraphService()
        result = service.create_time_series_plot([])
        
        assert isinstance(result, str)
        assert 'plotly' in result.lower()
    
    def test_create_time_series_plot_with_data(self):
        """データありでのグラフ生成テスト"""
        service = GraphService()
        test_data = [
            {'timestamp': '2025-01-26T10:30:00', 'value': 23.5},
            {'timestamp': '2025-01-26T11:30:00', 'value': 24.0}
        ]
        result = service.create_time_series_plot(test_data)
        
        assert isinstance(result, str)
        assert 'plotly' in result.lower()
        assert len(result) > 100  # HTMLが生成されていることを確認