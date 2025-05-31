# PlantMonitor

PlantMonitor is a FastAPI web application designed to visualize time-series data from sensors (e.g., temperature, pH) stored in AWS DynamoDB and display related images from AWS S3.

## Configuration

Create a `.env` file in the `PlantMonitor` directory by copying the `.env.example` file:

```bash
cp .env.example .env
```

Update the `.env` file with your specific configurations:

*   `AWS_DYNAMODB_TABLE_NAME`: The name of your DynamoDB table (e.g., `aggdata_table` as in the example).
*   `AWS_S3_BUCKET_NAME`: The name of the S3 bucket where plant images are stored.
*   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`: Your AWS credentials and region (e.g., `ap-northeast-1`), if not configured globally or via IAM roles.
*   Other application settings like `DEFAULT_DATA_TYPE` and `DEFAULT_PERIOD_DAYS` can also be adjusted as needed.

## Features

*   **Data Visualization**: Displays time-series data (e.g., temperature, pH, configurable via `DEFAULT_DATA_TYPE`) from DynamoDB on an interactive Plotly graph.
*   **Data Filtering**: Allows filtering data by type (temperature, pH) and time range (number of days, configurable via `DEFAULT_PERIOD_DAYS`) through the web interface.
*   **Image Display**: When a data point on the graph is clicked, the application fetches and displays the image from the configured S3 bucket whose timestamp is closest to the selected data point. This provides a visual correlation with the graphed data.
    *   **Image Naming Convention**: For images to be correctly matched, their filenames in the S3 bucket should contain a timestamp in `YYYYMMDD_HHMMSS` or `YYYY-MM-DD_HH-MM-SS` format (e.g., `plant_images/20231026_120000.jpg` or `plant_images/capture_2023-10-27_09-30-00.png`).
    *   **Image Location**: Images are expected to be under a prefix (folder) named `plant_images/` within the S3 bucket. This prefix is currently hardcoded in the `S3Service` (`app/services/s3.py`) but can be modified there if needed.
    *   **Error Handling**: If no matching image is found for a clicked timestamp, or if there's an issue fetching it (e.g., image not found, S3 access error), an appropriate message is displayed below the graph area.

## Running the Application

1.  Ensure Python 3.8+ is installed.
2.  Set up a virtual environment (recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
    *(Note: `requirements.txt` would need to be created and include `fastapi`, `uvicorn`, `boto3`, `plotly`, `jinja2`, `python-dotenv` etc.)*
4.  Configure your AWS credentials and settings in the `.env` file as described in the "Configuration" section.
5.  Run the FastAPI application using Uvicorn:
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
6.  Open your web browser and navigate to `http://127.0.0.1:8000`.

## Testing

Tests are written using `pytest`. Ensure development dependencies (like `pytest`, `pytest-mock`, `requests` for TestClient) are installed.

To run tests:
```bash
pytest
```
This command will discover and run tests in the `PlantMonitor/tests` directory. Ensure `AWS_S3_BUCKET_NAME` and `AWS_DYNAMODB_TABLE_NAME` are set in your environment (e.g., via `.env` or directly) for tests that might rely on app initialization, though critical service interactions are typically mocked. Test-specific environment variables are also set within test files like `test_main_py_endpoint.py`.
