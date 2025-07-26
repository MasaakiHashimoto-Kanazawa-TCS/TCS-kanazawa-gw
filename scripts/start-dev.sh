#!/bin/bash

# Plant Monitor 開発サーバー起動スクリプト

set -e

# 色付きメッセージ用の関数
print_success() {
    echo -e "\033[32m✓ $1\033[0m"
}

print_info() {
    echo -e "\033[34mℹ $1\033[0m"
}

print_error() {
    echo -e "\033[31m✗ $1\033[0m"
}

# プロセス終了時のクリーンアップ
cleanup() {
    print_info "サーバーを停止しています..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

print_info "🌱 Plant Monitor 開発サーバーを起動しています..."

# バックエンドサーバー起動
print_info "バックエンドサーバーを起動中..."
cd backend
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# バックエンドの起動を待機
sleep 3

# フロントエンドサーバー起動
print_info "フロントエンドサーバーを起動中..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# フロントエンドの起動を待機
sleep 5

echo ""
print_success "🎉 開発サーバーが起動しました！"
echo ""
echo "アクセス URL:"
echo "  フロントエンド: http://localhost:3000"
echo "  バックエンドAPI: http://localhost:8000"
echo "  API ドキュメント: http://localhost:8000/docs"
echo ""
echo "停止するには Ctrl+C を押してください"
echo ""

# プロセスの監視
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        print_error "バックエンドサーバーが停止しました"
        cleanup
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        print_error "フロントエンドサーバーが停止しました"
        cleanup
    fi
    
    sleep 5
done