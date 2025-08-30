"""
リクエストログ用ミドルウェア
"""
import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """リクエストとレスポンスをログ出力するミドルウェア"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # リクエスト開始時刻
        start_time = time.time()
        
        # クライアント情報
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        # リクエスト情報をログ出力
        logger.info(
            f"REQUEST: {request.method} {request.url} - "
            f"Client: {client_ip} - User-Agent: {user_agent}"
        )
        
        # クエリパラメータがある場合はログ出力
        if request.query_params:
            logger.info(f"Query params: {dict(request.query_params)}")
        
        try:
            # リクエストを処理
            response = await call_next(request)
            
            # 処理時間を計算
            process_time = time.time() - start_time
            
            # レスポンス情報をログ出力
            logger.info(
                f"RESPONSE: {request.method} {request.url} - "
                f"Status: {response.status_code} - "
                f"Time: {process_time:.4f}s"
            )
            
            return response
            
        except Exception as e:
            # エラー時のログ出力
            process_time = time.time() - start_time
            logger.error(
                f"ERROR: {request.method} {request.url} - "
                f"Error: {str(e)} - "
                f"Time: {process_time:.4f}s"
            )
            raise