import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import os
import sys

# Ensure the app module can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# It's important to set up environment variables BEFORE app is imported if it uses them at import time
# For S3Service, AWS_S3_BUCKET_NAME is checked at __init__.
# We will mock S3Service directly, so direct os.environ manipulation for this test might not be strictly
# necessary for all S3Service interactions if the mock is comprehensive.
# However, if main.py itself or other services tried to init S3Service outside of the patched context,
# it could fail. For safety, set a dummy one for the test session.
os.environ['AWS_S3_BUCKET_NAME'] = 'test-bucket-for-main'
# Similarly for DynamoDB if it's initialized globally and not mocked for these specific tests
os.environ['AWS_DYNAMODB_TABLE_NAME'] = 'test-table-for-main'
# Add other necessary env vars for app initialization if any.

from app.main import app # app instance from your main.py
# from app.services.s3 import S3Service # Not directly used here, but good to know path

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def mock_s3_service():
    # This mock will replace the actual S3Service instance used by the endpoint
    mock = MagicMock()
    # Configure default return values for its methods as needed per test
    mock.bucket_name = 'mock-bucket' # Ensure it has a bucket_name
    mock.find_closest_image.return_value = "some/image_key.jpg"
    mock.generate_presigned_url.return_value = "https://s3.example.com/presigned-url"
    return mock

def test_get_image_for_timestamp_success(client, mock_s3_service):
    with patch('app.main.s3_service', mock_s3_service): # Patch where s3_service is used
        response = client.get("/get_image_for_timestamp?timestamp=2023-10-26%2012:00:00")

    assert response.status_code == 200
    json_response = response.json()
    assert json_response['image_url'] == "https://s3.example.com/presigned-url"
    assert json_response['image_key'] == "some/image_key.jpg"
    mock_s3_service.find_closest_image.assert_called_once_with("2023-10-26 12:00:00")
    mock_s3_service.generate_presigned_url.assert_called_once_with("some/image_key.jpg")

def test_get_image_for_timestamp_no_image_found(client, mock_s3_service):
    mock_s3_service.find_closest_image.return_value = None # Simulate no image found

    with patch('app.main.s3_service', mock_s3_service):
        response = client.get("/get_image_for_timestamp?timestamp=2023-10-26%2012:00:00")

    assert response.status_code == 404
    json_response = response.json()
    assert "error" in json_response
    assert json_response["error"] == "No image found matching the timestamp."
    mock_s3_service.find_closest_image.assert_called_once_with("2023-10-26 12:00:00")
    mock_s3_service.generate_presigned_url.assert_not_called()


def test_get_image_for_timestamp_presigned_url_fails(client, mock_s3_service):
    # find_closest_image returns a key, but generate_presigned_url fails
    mock_s3_service.find_closest_image.return_value = "a/valid_key.jpg"
    mock_s3_service.generate_presigned_url.return_value = None

    with patch('app.main.s3_service', mock_s3_service):
        response = client.get("/get_image_for_timestamp?timestamp=2023-10-26%2012:00:00")

    assert response.status_code == 500
    json_response = response.json()
    assert "detail" in json_response # FastAPI's HTTPException uses 'detail'
    assert json_response["detail"] == "Could not generate image URL."
    mock_s3_service.find_closest_image.assert_called_once_with("2023-10-26 12:00:00")
    mock_s3_service.generate_presigned_url.assert_called_once_with("a/valid_key.jpg")

def test_get_image_for_timestamp_invalid_timestamp_format_in_request(client, mock_s3_service):
    # Test how the endpoint reacts if the S3 service indicates an invalid timestamp format
    # This happens if s3_service.find_closest_image itself raises ValueError or returns None due to bad format.
    # The S3Service.find_closest_image was written to return None for bad formats.
    # The endpoint should translate this (or a direct ValueError) to a 400 or appropriate error.
    # Current endpoint re-raises ValueError as HTTPException(400).

    # Scenario 1: find_closest_image returns None because of bad format (as per s3.py impl)
    # mock_s3_service.find_closest_image.return_value = None # This would lead to 404 by current main.py
                                                        # if not distinguished from "not found"

    # To specifically test the ValueError path that leads to 400,
    # we need find_closest_image to raise it.
    mock_s3_service.find_closest_image.side_effect = ValueError("Invalid timestamp format for test")

    with patch('app.main.s3_service', mock_s3_service):
        response = client.get("/get_image_for_timestamp?timestamp=INVALID-FORMAT")

    assert response.status_code == 400
    json_response = response.json()
    assert "detail" in json_response
    assert json_response["detail"] == "Invalid timestamp format for test"
    mock_s3_service.find_closest_image.assert_called_once_with("INVALID-FORMAT")


def test_get_image_for_timestamp_s3_service_general_exception(client, mock_s3_service):
    # Simulate an unexpected error from the S3 service
    mock_s3_service.find_closest_image.side_effect = Exception("Unexpected S3 service boom!")

    with patch('app.main.s3_service', mock_s3_service):
        response = client.get("/get_image_for_timestamp?timestamp=2023-10-26%2012:00:00")

    assert response.status_code == 500
    json_response = response.json()
    assert "detail" in json_response
    assert "An unexpected error occurred: Unexpected S3 service boom!" in json_response["detail"]


# It can be tricky to test the S3Service init failure (bucket name not set)
# via TestClient if the app crashes on startup.
# The current S3Service raises ValueError if AWS_S3_BUCKET_NAME is not set.
# If this happens during app = FastAPI() or s3_service = S3Service() at module level in main.py,
# the app import itself might fail.
# The provided S3Service init is within a try-except in main.py, which then re-raises.
# This test assumes `s3_service` object exists but its `bucket_name` is None.
# The endpoint has a check: `if not s3_service.bucket_name:`
def test_get_image_for_timestamp_s3_not_configured_bucket_name_missing(client, mock_s3_service):
    mock_s3_service.bucket_name = None # Simulate bucket_name not being set on the instance

    with patch('app.main.s3_service', mock_s3_service):
        response = client.get("/get_image_for_timestamp?timestamp=2023-10-26%2012:00:00")

    assert response.status_code == 500 # As per current logic in main.py
    json_response = response.json()
    assert "detail" in json_response
    assert json_response["detail"] == "S3 service not configured: Bucket name missing."

# Test for missing timestamp query parameter (FastAPI handles this by default)
def test_get_image_for_timestamp_missing_timestamp_param(client):
    response = client.get("/get_image_for_timestamp") # No timestamp query param
    assert response.status_code == 422 # Unprocessable Entity for missing parameter
    json_response = response.json()
    assert "detail" in json_response
    # Check for detail message structure related to missing query parameter
    assert any(d['msg'] == 'Field required' and d['loc'] == ['query', 'timestamp'] for d in json_response['detail'])
