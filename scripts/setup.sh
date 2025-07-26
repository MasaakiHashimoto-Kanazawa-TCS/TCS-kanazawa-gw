#!/bin/bash

# Plant Monitor システムセットアップスクリプト

set -e

echo "🌱 Plant Monitor システムのセットアップを開始します..."

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

# 前提条件チェック
check_prerequisites() {
    print_info "前提条件をチェックしています..."
    
    # Python チェック
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3.12以上が必要です"
        exit 1
    fi
    
    # Node.js チェック
    if ! command -v node &> /dev/null; then
        print_error "Node.js 18.0.0以上が必要です"
        exit 1
    fi
    
    # uv チェック
    if ! command -v uv &> /dev/null; then
        print_error "uv パッケージマネージャーが必要です"
        echo "インストール: pip install uv"
        exit 1
    fi
    
    print_success "前提条件チェック完了"
}

# バックエンドセットアップ
setup_backend() {
    print_info "バックエンドをセットアップしています..."
    
    cd backend
    
    # 依存関係インストール
    uv sync
    print_success "バックエンド依存関係インストール完了"
    
    # 環境変数ファイル作成
    if [ ! -f .env ]; then
        cp .env.example .env
        print_info "環境変数ファイル (.env) を作成しました"
        print_info "AWS認証情報を設定してください"
    fi
    
    cd ..
    print_success "バックエンドセットアップ完了"
}

# フロントエンドセットアップ
setup_frontend() {
    print_info "フロントエンドをセットアップしています..."
    
    cd frontend
    
    # 依存関係インストール
    npm install
    print_success "フロントエンド依存関係インストール完了"
    
    # 環境変数ファイル作成
    if [ ! -f .env.local ]; then
        cp .env.local.example .env.local
        print_info "環境変数ファイル (.env.local) を作成しました"
        print_info "API URLを設定してください"
    fi
    
    cd ..
    print_success "フロントエンドセットアップ完了"
}

# メイン実行
main() {
    check_prerequisites
    setup_backend
    setup_frontend
    
    echo ""
    print_success "🎉 セットアップが完了しました！"
    echo ""
    echo "次のステップ:"
    echo "1. backend/.env ファイルでAWS認証情報を設定"
    echo "2. frontend/.env.local ファイルでAPI URLを設定"
    echo "3. 開発サーバーを起動: ./scripts/start-dev.sh"
    echo ""
}

main "$@"