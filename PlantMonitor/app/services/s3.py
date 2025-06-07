import boto3
import os
from datetime import datetime, timedelta, timezone
from botocore.exceptions import ClientError
import re
from loguru import logger

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket_name = os.environ.get('AWS_S3_BUCKET_NAME')
        if not self.bucket_name:
            raise ValueError("AWS_S3_BUCKET_NAME environment variable is not set.")

    def _extract_timestamp_from_key(self, key):
        """
        Extracts timestamp from S3 object key.
        Assumes key format like 'plant_images/YYYYMMDD_HHMMSS.jpg'
        or 'plant_images/YYYY-MM-DD_HH-MM-SS.jpg'
        or 'plant_images/img_YYYYMMDD_HHMMSS_otherstuff.jpg'
        Returns a datetime object or None if format is incorrect.
        """
        # Try to match YYYYMMDD_HHMMSS or YYYY-MM-DD_HH-MM-SS
        match = re.search(r'(\d{4}-?\d{2}-?\d{2}_\d{2}-?\d{2}-?\d{2})', key)
        logger.info(f"Extracted timestamp: {match} key: {key}")
        if match:
            timestamp_str = match.group(1).replace('-', '') # Normalize to YYYYMMDD_HHMMSS
            try:
                return datetime.strptime(timestamp_str, '%Y%m%d_%H%M%S')
            except ValueError:
                pass
        return None

    def list_images(self, prefix=''):
        """
        S3バケット内の画像をリストアップし、各画像の更新日時（LastModified）を取得する。
        画像ファイル（jpg, jpeg, png, gif, bmp, webpなど）のみを対象とする。
        """
        images = []
        image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.JPG', '.JPEG', '.PNG', '.GIF', '.BMP', '.WEBP')
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            page_iterator = paginator.paginate(Bucket=self.bucket_name, Prefix=prefix)
            for page in page_iterator:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        key = obj['Key']
                        if key.lower().endswith(image_extensions):
                            last_modified = obj['LastModified']  # datetime型
                            images.append({'key': key, 'timestamp': last_modified})
                        else:
                            logger.warning(f"Skipping object {key} due to unsupported file extension")
        except ClientError as e:
            logger.error(f"Error listing S3 objects: {e}")
            raise
        return images

    def find_closest_image(self, target_timestamp_str):
        """
        指定した日時（'%Y-%m-%d %H:%M:%S'形式）に最も近い更新日時の画像を返す。
        JST（日本標準時）で比較する。
        """
        JST = timezone(timedelta(hours=9))
        try:
            target_dt = datetime.strptime(target_timestamp_str, '%Y-%m-%d %H:%M:%S')
            target_dt = target_dt.replace(tzinfo=JST)
        except ValueError:
            logger.error(f"Invalid target timestamp format: {target_timestamp_str}")
            return None

        images = self.list_images()  # prefixが必要なら引数で渡す
        if not images:
            return None

        closest_image = None
        min_time_diff = timedelta.max

        for image_info in images:
            ts = image_info['timestamp']
            if ts.tzinfo is None:
                # naive型ならJSTを付与
                ts_jst = ts.replace(tzinfo=JST)
            else:
                # aware型ならJSTへ変換
                ts_jst = ts.astimezone(JST)
            time_diff = abs(ts_jst - target_dt)
            if time_diff < min_time_diff:
                min_time_diff = time_diff
                closest_image = image_info['key']

        return closest_image

    def generate_presigned_url(self, object_key, expiration=3600):
        """
        Generates a presigned URL for an S3 object.
        Returns the URL string or None if an error occurs.
        """
        if not object_key:
            return None
        try:
            response = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': object_key},
                ExpiresIn=expiration
            )
            return response
        except ClientError as e:
            logger.error(f"Error generating presigned URL for {object_key}: {e}")
            return None

# Example Usage (for testing purposes, remove or comment out in production):
if __name__ == '__main__':
    # Mock environment variable for testing
    os.environ['AWS_S3_BUCKET_NAME'] = 'your-test-bucket-name'

    # Mock boto3 client for local testing without actual AWS connection
    class MockS3Client:
        def get_paginator(self, operation_name):
            class MockPaginator:
                def paginate(self, Bucket, Prefix):
                    # Simulate some S3 objects
                    return [{
                        'Contents': [
                            {'Key': 'plant_images/img_20231026_120000.jpg'},
                            {'Key': 'plant_images/pic_20231026_120500.jpg'},
                            {'Key': 'plant_images/2023-10-26_12-10-00_data.jpg'},
                            {'Key': 'plant_images/capture_20231026_115500.png'}, # different extension
                            {'Key': 'plant_images/randomfile.txt'}, # not an image or wrong format
                            {'Key': 'plant_images/20231026_123000.jpeg'},
                        ]
                    }]
            return MockPaginator()

        def generate_presigned_url(self, operation_name, Params, ExpiresIn):
            return f"https://s3.example.com/{Params['Bucket']}/{Params['Key']}?presigned_url_token"

    s3_service = S3Service()
    s3_service.s3_client = MockS3Client() # Replace real client with mock

    logger.info("Listing images:")
    images_found = s3_service.list_images()
    for img in images_found:
        logger.info(f"  {img['key']} -> {img['timestamp']}")

    logger.info("\nFinding closest image to '2023-10-26 12:03:00':")
    closest_key = s3_service.find_closest_image('2023-10-26 12:03:00')
    logger.info(f"  Closest image key: {closest_key}") # Expected: plant_images/pic_20231026_120500.jpg

    logger.info("\nFinding closest image to '2023-10-26 12:09:00':")
    closest_key_2 = s3_service.find_closest_image('2023-10-26 12:09:00')
    logger.info(f"  Closest image key: {closest_key_2}") # Expected: plant_images/2023-10-26_12-10-00_data.jpg

    if closest_key:
        logger.info(f"\nGenerating presigned URL for {closest_key}:")
        url = s3_service.generate_presigned_url(closest_key)
        logger.info(f"  URL: {url}")
