#!/bin/bash

# Plant Monitor テスト実行スクリプト

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

# バックエンドテスト
test_backend() {
    print_info "バックエンドテストを実行中..."
    
    cd backend
    
    # 単体テスト
    print_info "単体テストを実行..."
    uv run pytest tests/ -v
    
    # カバレッジテスト
    print_info "カバレッジテストを実行..."
    uv run pytest --cov=app --cov-report=html --cov-report=term
    
    # リンティング
    print_info "コード品質チェックを実行..."
    uv run black --check app tests
    uv run isort --check-only app tests
    uv run flake8 app tests
    
    cd ..
    print_success "バックエンドテスト完了"
}

# フロントエンドテスト
test_frontend() {
    print_info "フロントエンドテストを実行中..."
    
    cd frontend
    
    # 単体テスト
    print_info "単体テストを実行..."
    npm run test -- --coverage --watchAll=false
    
    # 型チェック
    print_info "TypeScript型チェックを実行..."
    npm run type-check
    
    # リンティング
    print_info "ESLintチェックを実行..."
    npm run lint
    
    # ビルドテスト
    print_info "ビルドテストを実行..."
    npm run build
    
    cd ..
    print_success "フロントエンドテスト完了"
}

# メイン実行
main() {
    print_info "🧪 Plant Monitor テストスイートを実行します..."
    
    # 引数チェック
    if [ "$1" = "backend" ]; then
        test_backend
    elif [ "$1" = "frontend" ]; then
        test_frontend
    else
        test_backend
        test_frontend
    fi
    
    echo ""
    print_success "🎉 すべてのテストが完了しました！"
    echo ""
}

main "$@"