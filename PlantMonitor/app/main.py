from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse # For returning JSON
from datetime import datetime, timedelta
import os
from .services.dynamodb import DynamoDBService
from .services.graph import GraphService
from .services.s3 import S3Service # Add this line

app = FastAPI()

# 現在のファイルのディレクトリを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(current_dir, "templates"))
app.mount("/static", StaticFiles(directory=os.path.join(current_dir, "static")), name="static")

try:
    dynamodb_service = DynamoDBService()
    graph_service = GraphService()
    s3_service = S3Service() # Add this line
except Exception as e:
    print(f"初期化エラー: {str(e)}")
    raise

@app.get("/")
async def home(
    request: Request,
    data_type: str = Query(default="temperature", description="データの種類"),
    days: int = Query(default=7, description="表示する日数")
):
    try:
        # 指定された日数前からのデータを表示
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        print(f"データ取得開始: data_type={data_type}, days={days}")
        print(f"期間: {start_date} から {end_date}")
        
        data = dynamodb_service.get_data(
            data_type,
            start_date.strftime("%Y-%m-%d %H:%M:%S"),
            end_date.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        plot_html = graph_service.create_time_series_plot(data)
        
        return templates.TemplateResponse(
            "index.html",
            {
                "request": request,
                "plot_html": plot_html,
                "data_type": data_type,
                "days": days
            }
        )
    except Exception as e:
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error_message": f"エラーが発生しました: {str(e)}"}
        )

@app.get("/get_image_for_timestamp")
async def get_image_for_timestamp(
    request: Request,
    timestamp: str = Query(..., description="Timestamp in YYYY-MM-DD HH:MM:SS format")
):
    if not s3_service.bucket_name:
        # This check is a bit redundant if S3Service constructor throws an error,
        # but can be a safeguard or used if initialization logic changes.
        print("S3 bucket name not configured.")
        raise HTTPException(status_code=500, detail="S3 service not configured: Bucket name missing.")

    try:
        print(f"Received request for image closest to timestamp: {timestamp}")
        closest_image_key = s3_service.find_closest_image(timestamp)

        if not closest_image_key:
            print(f"No image found for timestamp: {timestamp}")
            return JSONResponse(
                status_code=404,
                content={"error": "No image found matching the timestamp."}
            )

        presigned_url = s3_service.generate_presigned_url(closest_image_key)
        if not presigned_url:
            print(f"Could not generate presigned URL for key: {closest_image_key}")
            raise HTTPException(status_code=500, detail="Could not generate image URL.")

        print(f"Found image: {closest_image_key}, URL: {presigned_url}")
        return JSONResponse(content={"image_url": presigned_url, "image_key": closest_image_key})

    except ValueError as ve: # Catch specific errors like invalid timestamp format from S3Service
        print(f"ValueError in get_image_for_timestamp: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"Error in get_image_for_timestamp: {str(e)}")
        # Log the full error for debugging: import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")