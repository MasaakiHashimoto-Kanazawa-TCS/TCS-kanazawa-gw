import os
import boto3
from datetime import datetime, timedelta
from dotenv import load_dotenv
from loguru import logger

load_dotenv()

class DynamoDBService:
    def __init__(self):
        # 環境変数から認証情報を取得
        aws_access_key_id = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_access_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        region_name = os.getenv('AWS_REGION', 'ap-northeast-1')

        if not aws_access_key_id or not aws_secret_access_key:
            raise ValueError("AWS認証情報が設定されていません。.envファイルを確認してください。")

        # 認証情報の形式を確認
        logger.debug(f"Access Key: {aws_access_key_id[:4]}...")
        logger.debug(f"Secret Key: {aws_secret_access_key[:4]}...")
        logger.debug(f"Region: {region_name}")

        try:
            self.dynamodb = boto3.resource(
                'dynamodb',
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                region_name=region_name
            )
            # テーブルの存在確認
            self.table = self.dynamodb.Table('aggdata_table')
            self.table.load()  # テーブルの存在を確認
            logger.info("DynamoDBテーブルに正常に接続しました。")
        except Exception as e:
            logger.error(f"DynamoDB接続エラー: {str(e)}")
            raise

    def get_data(self, data_type: str, start_date: str, end_date: str):
        try:
            logger.debug(f"クエリパラメータ: data_type={data_type}, start_date={start_date}, end_date={end_date}")
            response = self.table.query(
                KeyConditionExpression='data_type = :type AND insert_date BETWEEN :start AND :end',
                ExpressionAttributeValues={
                    ':type': data_type,
                    ':start': start_date,
                    ':end': end_date
                }
            )
            logger.info(f"取得したデータ数: {len(response['Items'])}")
            return response['Items']
        except Exception as e:
            logger.error(f"DynamoDBクエリエラー: {str(e)}")
            return [] 