from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timedelta
import os
from .config import settings
from .services.dynamodb import DynamoDBService
from .services.graph import GraphService

app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version
)

# 現在のファイルのディレクトリを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(current_dir, "templates"))
app.mount("/static", StaticFiles(directory=os.path.join(current_dir, "static")), name="static")

try:
    dynamodb_service = DynamoDBService()
    graph_service = GraphService()
except Exception as e:
    print(f"初期化エラー: {str(e)}")
    raise

@app.get("/")
async def home(
    request: Request,
    data_type: str = Query(default=settings.default_data_type, description="データの種類"),
    days: int = Query(default=settings.default_period_days, description="表示する日数")
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