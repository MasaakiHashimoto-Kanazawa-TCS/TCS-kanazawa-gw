# Plant Monitor テスト実行スクリプト (PowerShell版)

param(
    [string]$Target = "all",  # all, backend, frontend
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$Help
)

# エラー時に停止
$ErrorActionPreference = "Stop"

# 色付きメッセージ用の関数
function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Show-Help {
    Write-Host @"
Plant Monitor テスト実行スクリプト

使用方法:
    .\scripts\test.ps1 [オプション]

パラメータ:
    -Target <string>    テスト対象 (all, backend, frontend)
                       デフォルト: all

オプション:
    -Coverage          カバレッジレポートを生成
    -Watch             ウォッチモードで実行 (フロントエンドのみ)
    -Help              このヘルプを表示

例:
    .\scripts\test.ps1                    # 全テスト実行
    .\scripts\test.ps1 -Target backend    # バックエンドのみ
    .\scripts\test.ps1 -Coverage          # カバレッジ付き
    .\scripts\test.ps1 -Target frontend -Watch  # フロントエンドをウォッチモード
"@
}

# バックエンドテスト
function Test-Backend {
    Write-Info "バックエンドテストを実行中..."
    
    if (-not (Test-Path "backend")) {
        Write-Error "backendディレクトリが見つかりません"
        return $false
    }
    
    Push-Location backend
    
    try {
        # 単体テスト
        Write-Info "単体テストを実行..."
        if ($Coverage) {
            uv run pytest tests/ -v --cov=app --cov-report=html --cov-report=term
        }
        else {
            uv run pytest tests/ -v
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "テストが失敗しました"
        }
        
        # リンティング
        Write-Info "コード品質チェックを実行..."
        
        Write-Host "Black フォーマットチェック..." -ForegroundColor Gray
        uv run black --check app tests
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Black フォーマットエラーがあります。修正するには: uv run black app tests"
        }
        
        Write-Host "isort インポートチェック..." -ForegroundColor Gray
        uv run isort --check-only app tests
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "isort エラーがあります。修正するには: uv run isort app tests"
        }
        
        Write-Host "flake8 リンティング..." -ForegroundColor Gray
        uv run flake8 app tests
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "flake8 エラーがあります"
        }
        
        Write-Success "バックエンドテスト完了"
        return $true
    }
    catch {
        Write-Error "バックエンドテストでエラーが発生しました: $_"
        return $false
    }
    finally {
        Pop-Location
    }
}

# フロントエンドテスト
function Test-Frontend {
    Write-Info "フロントエンドテストを実行中..."
    
    if (-not (Test-Path "frontend")) {
        Write-Error "frontendディレクトリが見つかりません"
        return $false
    }
    
    Push-Location frontend
    
    try {
        # 単体テスト
        Write-Info "単体テストを実行..."
        if ($Watch) {
            vp test --watch
        }
        elseif ($Coverage) {
            vp test --coverage
        }
        else {
            vp test
        }

        if ($LASTEXITCODE -ne 0) {
            throw "テストが失敗しました"
        }

        if (-not $Watch) {
            # フォーマット・リント・型チェック
            Write-Info "コード品質チェックを実行..."
            vp check
            if ($LASTEXITCODE -ne 0) {
                throw "コード品質チェックが失敗しました"
            }

            # ビルドテスト
            Write-Info "ビルドテストを実行..."
            vp build
            if ($LASTEXITCODE -ne 0) {
                throw "ビルドが失敗しました"
            }
        }
        
        Write-Success "フロントエンドテスト完了"
        return $true
    }
    catch {
        Write-Error "フロントエンドテストでエラーが発生しました: $_"
        return $false
    }
    finally {
        Pop-Location
    }
}

# テスト結果サマリー
function Show-TestSummary {
    param(
        [bool]$BackendResult,
        [bool]$FrontendResult
    )
    
    Write-Host ""
    Write-Host "📊 テスト結果サマリー" -ForegroundColor Cyan
    Write-Host "=" * 30
    
    if ($Target -eq "all" -or $Target -eq "backend") {
        if ($BackendResult) {
            Write-Success "バックエンド: 成功"
        }
        else {
            Write-Error "バックエンド: 失敗"
        }
    }
    
    if ($Target -eq "all" -or $Target -eq "frontend") {
        if ($FrontendResult) {
            Write-Success "フロントエンド: 成功"
        }
        else {
            Write-Error "フロントエンド: 失敗"
        }
    }
    
    Write-Host ""
    
    if ($Coverage) {
        Write-Info "カバレッジレポート:"
        if (Test-Path "backend/htmlcov/index.html") {
            Write-Host "  バックエンド: backend/htmlcov/index.html"
        }
        if (Test-Path "frontend/coverage/lcov-report/index.html") {
            Write-Host "  フロントエンド: frontend/coverage/lcov-report/index.html"
        }
    }
}

# メイン実行
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    # パラメータ検証
    if ($Target -notin @("all", "backend", "frontend")) {
        Write-Error "無効なTarget値です。all, backend, frontend のいずれかを指定してください。"
        exit 1
    }
    
    Write-Host "🧪 Plant Monitor テストスイートを実行します..." -ForegroundColor Green
    Write-Host "対象: $Target" -ForegroundColor Gray
    if ($Coverage) { Write-Host "カバレッジ: 有効" -ForegroundColor Gray }
    if ($Watch) { Write-Host "ウォッチモード: 有効" -ForegroundColor Gray }
    Write-Host ""
    
    $backendResult = $true
    $frontendResult = $true
    
    try {
        # バックエンドテスト実行
        if ($Target -eq "all" -or $Target -eq "backend") {
            $backendResult = Test-Backend
        }
        
        # フロントエンドテスト実行
        if ($Target -eq "all" -or $Target -eq "frontend") {
            $frontendResult = Test-Frontend
        }
        
        # 結果サマリー表示
        if (-not $Watch) {
            Show-TestSummary -BackendResult $backendResult -FrontendResult $frontendResult
        }
        
        # 全体結果判定
        $overallSuccess = $backendResult -and $frontendResult
        
        if ($overallSuccess) {
            Write-Success "🎉 すべてのテストが完了しました！"
        }
        else {
            Write-Error "❌ テストが失敗しました"
            exit 1
        }
    }
    catch {
        Write-Error "テスト実行中にエラーが発生しました: $_"
        exit 1
    }
}

# スクリプト実行
Main