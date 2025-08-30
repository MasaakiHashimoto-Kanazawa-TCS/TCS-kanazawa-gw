from fastapi import FastAPI, Request, HTTPException, Query
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import os
import logging
from .config import settings, setup_logging
from .services.dynamodb import DynamoDBService
from .services.graph import GraphService
from .api.v1 import router as api_v1_router
from .middleware import RequestLoggingMiddleware

# ログ設定を初期化
setup_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.api_title,
    description=settings.api_description,
    version=settings.api_version
)

# リクエストログミドルウェアを追加（有効な場合のみ）
if settings.enable_request_logging:
    app.add_middleware(RequestLoggingMiddleware)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # フロントエンドのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1ルーターを追加
app.include_router(api_v1_router)

# 現在のファイルのディレクトリを取得
current_dir = os.path.dirname(os.path.abspath(__file__))
templates = Jinja2Templates(directory=os.path.join(current_dir, "templates"))
app.mount("/static", StaticFiles(directory=os.path.join(current_dir, "static")), name="static")

try:
    dynamodb_service = DynamoDBService()
    graph_service = GraphService()
    logger.info("アプリケーションの初期化が完了しました")
except Exception as e:
    logger.error(f"初期化エラー: {str(e)}")
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
        
        logger.info(f"データ取得開始: data_type={data_type}, days={days}")
        logger.debug(f"期間: {start_date} から {end_date}")
        
        data = dynamodb_service.get_data(
            data_type,
            start_date.strftime("%Y-%m-%d %H:%M:%S"),
            end_date.strftime("%Y-%m-%d %H:%M:%S")
        )
        
        plot_html = graph_service.create_time_series_plot(data)
        
        logger.info(f"データ取得完了: {len(data)}件のデータを取得")
        
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
        logger.error(f"ホームページエラー: {str(e)}")
        return templates.TemplateResponse(
            "error.html",
            {"request": request, "error_message": f"エラーが発生しました: {str(e)}"}
        ) 