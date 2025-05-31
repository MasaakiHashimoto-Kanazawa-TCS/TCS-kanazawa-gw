import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from botocore.exceptions import ClientError
import os

# Ensure the app module can be imported
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.s3 import S3Service

@pytest.fixture
def mock_s3_client():
    return MagicMock()

@pytest.fixture
def s3_service_factory(mock_s3_client):
    def _factory(bucket_name='test-bucket'):
        with patch.dict(os.environ, {'AWS_S3_BUCKET_NAME': bucket_name}):
            with patch('boto3.client', return_value=mock_s3_client) as mock_boto_client:
                service = S3Service()
                service.s3_client = mock_s3_client # Ensure our mock is used
                return service
    return _factory

def test_s3_service_init_success(s3_service_factory, mock_s3_client):
    service = s3_service_factory()
    assert service.bucket_name == 'test-bucket'
    assert service.s3_client == mock_s3_client

def test_s3_service_init_no_env_var():
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(ValueError, match="AWS_S3_BUCKET_NAME environment variable is not set."):
            S3Service()

@pytest.mark.parametrize("key, expected_datetime_str", [
    ("plant_images/20231026_120000.jpg", "2023-10-26 12:00:00"),
    ("plant_images/img_2023-10-26_12-05-00_data.png", "2023-10-26 12:05:00"),
    ("foo/bar/20231027_093015_other.jpeg", "2023-10-27 09:30:15"),
    ("no_timestamp_here.jpg", None),
    ("plant_images/20231026_1200.jpg", None), # Invalid time format
    ("plant_images/2023-13-01_10-00-00.jpg", None) # Invalid month
])
def test_extract_timestamp_from_key(s3_service_factory, key, expected_datetime_str):
    service = s3_service_factory()
    if expected_datetime_str:
        expected_dt = datetime.strptime(expected_datetime_str, '%Y-%m-%d %H:%M:%S')
        assert service._extract_timestamp_from_key(key) == expected_dt
    else:
        assert service._extract_timestamp_from_key(key) is None

def test_list_images_success(s3_service_factory, mock_s3_client):
    service = s3_service_factory()
    mock_paginator = MagicMock()
    mock_page_iterator = iter([
        {
            'Contents': [
                {'Key': 'plant_images/img_20231026_120000.jpg'},
                {'Key': 'plant_images/invalid_format.txt'},
                {'Key': 'plant_images/pic_20231026_120500.png'},
            ]
        },
        {
            'Contents': [
                {'Key': 'plant_images/20231026_121000.jpeg'},
            ]
        }
    ])
    mock_paginator.paginate.return_value = mock_page_iterator
    mock_s3_client.get_paginator.return_value = mock_paginator

    images = service.list_images(prefix='plant_images/')

    assert len(images) == 3
    assert {'key': 'plant_images/img_20231026_120000.jpg', 'timestamp': datetime(2023, 10, 26, 12, 0, 0)} in images
    assert {'key': 'plant_images/pic_20231026_120500.png', 'timestamp': datetime(2023, 10, 26, 12, 5, 0)} in images
    assert {'key': 'plant_images/20231026_121000.jpeg', 'timestamp': datetime(2023, 10, 26, 12, 10, 0)} in images
    mock_s3_client.get_paginator.assert_called_once_with('list_objects_v2')
    mock_paginator.paginate.assert_called_once_with(Bucket='test-bucket', Prefix='plant_images/')

def test_list_images_empty(s3_service_factory, mock_s3_client):
    service = s3_service_factory()
    mock_paginator = MagicMock()
    mock_page_iterator = iter([{'Contents': []}]) # No contents
    mock_paginator.paginate.return_value = mock_page_iterator
    mock_s3_client.get_paginator.return_value = mock_paginator

    images = service.list_images()
    assert len(images) == 0

def test_list_images_no_contents_key(s3_service_factory, mock_s3_client):
    service = s3_service_factory()
    mock_paginator = MagicMock()
    mock_page_iterator = iter([{}]) # Page without 'Contents' key
    mock_paginator.paginate.return_value = mock_page_iterator
    mock_s3_client.get_paginator.return_value = mock_paginator

    images = service.list_images()
    assert len(images) == 0

def test_list_images_client_error(s3_service_factory, mock_s3_client):
    service = s3_service_factory()
    mock_s3_client.get_paginator.side_effect = ClientError({'Error': {'Code': 'SomeError', 'Message': 'Details'}}, 'list_objects_v2')

    with pytest.raises(ClientError):
        service.list_images()

@pytest.fixture
def mock_list_images_data(s3_service_factory):
    return [
        {'key': 'img1_20231026_120000.jpg', 'timestamp': datetime(2023, 10, 26, 12, 0, 0)},
        {'key': 'img2_20231026_121000.jpg', 'timestamp': datetime(2023, 10, 26, 12, 10, 0)},
        {'key': 'img3_20231026_122000.jpg', 'timestamp': datetime(2023, 10, 26, 12, 20, 0)},
    ]

def test_find_closest_image_exact_match(s3_service_factory, mock_list_images_data):
    service = s3_service_factory()
    with patch.object(service, 'list_images', return_value=mock_list_images_data):
        closest = service.find_closest_image('2023-10-26 12:10:00')
        assert closest == 'img2_20231026_121000.jpg'

def test_find_closest_image_closest_before(s3_service_factory, mock_list_images_data):
    service = s3_service_factory()
    with patch.object(service, 'list_images', return_value=mock_list_images_data):
        closest = service.find_closest_image('2023-10-26 12:04:00') # Closest is 12:00:00
        assert closest == 'img1_20231026_120000.jpg'

def test_find_closest_image_closest_after(s3_service_factory, mock_list_images_data):
    service = s3_service_factory()
    with patch.object(service, 'list_images', return_value=mock_list_images_data):
        closest = service.find_closest_image('2023-10-26 12:16:00') # Closest is 12:20:00
        assert closest == 'img3_20231026_122000.jpg'

def test_find_closest_image_equidistant(s3_service_factory, mock_list_images_data):
    service = s3_service_factory()
    # Add an image that creates an equidistant situation
    extended_list = mock_list_images_data + [{'key': 'img4_20231026_120800.jpg', 'timestamp': datetime(2023, 10, 26, 12, 8, 0)}]
    # Target: 2023-10-26 12:09:00. Equidistant from 12:08:00 and 12:10:00.
    # The algorithm will pick the first one it finds with the minimum difference.
    with patch.object(service, 'list_images', return_value=extended_list):
        closest = service.find_closest_image('2023-10-26 12:09:00')
        # Depending on sort order or list order, this could be img2 or img4.
        # The current implementation iterates and picks the first one that minimizes diff.
        # If 'img2_20231026_121000.jpg' comes before 'img4_20231026_120800.jpg' in list_images (after sorting by time if any)
        # and target is 12:09:00, diff with 12:10 is 1 min, diff with 12:08 is 1 min.
        # The provided mock_list_images_data is not sorted by timestamp implicitly by S3Service.find_closest_image
        # S3Service.list_images returns images as they come from S3 (potentially multiple pages).
        # Let's assume the order from list_images is as in extended_list
        # img2 (12:10) diff is 1 min. min_diff = 1 min. closest_image = img2
        # img4 (12:08) diff is 1 min. time_diff (1m) is not < min_time_diff (1m). So closest_image remains img2.
        # To be robust, let's sort the list by timestamp for predictable test outcome
        sorted_list = sorted(extended_list, key=lambda x: x['timestamp'])
        with patch.object(service, 'list_images', return_value=sorted_list):
            closest = service.find_closest_image('2023-10-26 12:09:00')
            assert closest == 'img4_20231026_120800.jpg' # img4 is 12:08, img2 is 12:10. 12:08 is chosen.


def test_find_closest_image_no_images(s3_service_factory):
    service = s3_service_factory()
    with patch.object(service, 'list_images', return_value=[]): # No images
        closest = service.find_closest_image('2023-10-26 12:00:00')
        assert closest is None

def test_find_closest_image_invalid_timestamp_format(s3_service_factory):
    service = s3_service_factory()
    # No need to mock list_images as it should fail before that
    closest = service.find_closest_image('invalid-timestamp-format')
    assert closest is None # Or check for logged error if you implement logging

def test_generate_presigned_url_success(s3_service_factory, mock_s3_client):
    service = s3_service_factory()
    expected_url = "https://example.com/presigned-url"
    mock_s3_client.generate_presigned_url.return_value = expected_url

    url = service.generate_presigned_url("some/object/key.jpg", expiration=3600)

    assert url == expected_url
    mock_s3_client.generate_presigned_url.assert_called_once_with(
        'get_object',
        Params={'Bucket': 'test-bucket', 'Key': 'some/object/key.jpg'},
        ExpiresIn=3600
    )

def test_generate_presigned_url_client_error(s3_service_factory, mock_s3_client):
    service = s3_service_factory()
    mock_s3_client.generate_presigned_url.side_effect = ClientError(
        {'Error': {'Code': 'AccessDenied', 'Message': 'Access Denied'}},
        'generate_presigned_url'
    )

    url = service.generate_presigned_url("another/key.png")
    assert url is None # Expect None on error as per current implementation

def test_generate_presigned_url_no_object_key(s3_service_factory):
    service = s3_service_factory()
    url = service.generate_presigned_url(None)
    assert url is None
