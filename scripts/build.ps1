# Plant Monitor ビルドスクリプト (PowerShell版)

param(
    [string]$Target = "all",  # all, backend, frontend
    [string]$Environment = "production",  # development, production
    [switch]$Clean,
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

function Show-Help {
    Write-Host @"
Plant Monitor ビルドスクリプト

使用方法:
    .\scripts\build.ps1 [オプション]

パラメータ:
    -Target <string>        ビルド対象 (all, backend, frontend)
                           デフォルト: all
    -Environment <string>   環境 (development, production)
                           デフォルト: production

オプション:
    -Clean                 ビルド前にクリーンアップ
    -Help                  このヘルプを表示

例:
    .\scripts\build.ps1                           # 全体を本番ビルド
    .\scripts\build.ps1 -Target frontend         # フロントエンドのみ
    .\scripts\build.ps1 -Environment development # 開発ビルド
    .\scripts\build.ps1 -Clean                   # クリーンビルド
"@
}

# クリーンアップ
function Invoke-Cleanup {
    Write-Info "クリーンアップを実行中..."
    
    # バックエンドクリーンアップ
    if (Test-Path "backend") {
        Push-Location backend
        if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
        if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
        if (Test-Path "*.egg-info") { Remove-Item -Recurse -Force "*.egg-info" }
        Pop-Location
    }
    
    # フロントエンドクリーンアップ
    if (Test-Path "frontend") {
        Push-Location frontend
        if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
        if (Test-Path "out") { Remove-Item -Recurse -Force "out" }
        if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
        Pop-Location
    }
    
    Write-Success "クリーンアップ完了"
}

# バックエンドビルド
function Build-Backend {
    Write-Info "バックエンドをビルド中..."
    
    if (-not (Test-Path "backend")) {
        Write-Error "backendディレクトリが見つかりません"
        return $false
    }
    
    Push-Location backend
    
    try {
        # 依存関係の確認
        Write-Host "依存関係を確認中..." -ForegroundColor Gray
        uv sync
        
        # テスト実行
        Write-Host "テストを実行中..." -ForegroundColor Gray
        uv run pytest tests/ -v
        if ($LASTEXITCODE -ne 0) {
            throw "テストが失敗しました"
        }
        
        # リンティング
        Write-Host "コード品質チェック中..." -ForegroundColor Gray
        uv run black --check app tests
        uv run isort --check-only app tests
        uv run flake8 app tests
        
        # ビルド (Pythonの場合は主に依存関係の確認とパッケージング)
        Write-Host "パッケージを作成中..." -ForegroundColor Gray
        if ($Environment -eq "production") {
            # 本番用の最適化された依存関係リストを作成
            uv export --format requirements-txt --no-dev > requirements.txt
        }
        
        Write-Success "バックエンドビルド完了"
        return $true
    }
    catch {
        Write-Error "バックエンドビルドでエラーが発生しました: $_"
        return $false
    }
    finally {
        Pop-Location
    }
}

# フロントエンドビルド
function Build-Frontend {
    Write-Info "フロントエンドをビルド中..."
    
    if (-not (Test-Path "frontend")) {
        Write-Error "frontendディレクトリが見つかりません"
        return $false
    }
    
    Push-Location frontend
    
    try {
        # 依存関係の確認
        Write-Host "依存関係を確認中..." -ForegroundColor Gray
        npm ci
        
        # 型チェック
        Write-Host "TypeScript型チェック中..." -ForegroundColor Gray
        npm run type-check
        if ($LASTEXITCODE -ne 0) {
            throw "型チェックが失敗しました"
        }
        
        # リンティング
        Write-Host "ESLintチェック中..." -ForegroundColor Gray
        npm run lint
        if ($LASTEXITCODE -ne 0) {
            throw "リンティングが失敗しました"
        }
        
        # テスト実行
        Write-Host "テストを実行中..." -ForegroundColor Gray
        npm run test -- --watchAll=false
        if ($LASTEXITCODE -ne 0) {
            throw "テストが失敗しました"
        }
        
        # ビルド
        Write-Host "Next.jsアプリケーションをビルド中..." -ForegroundColor Gray
        if ($Environment -eq "development") {
            $env:NODE_ENV = "development"
        }
        else {
            $env:NODE_ENV = "production"
        }
        
        npm run build
        if ($LASTEXITCODE -ne 0) {
            throw "ビルドが失敗しました"
        }
        
        Write-Success "フロントエンドビルド完了"
        return $true
    }
    catch {
        Write-Error "フロントエンドビルドでエラーが発生しました: $_"
        return $false
    }
    finally {
        Pop-Location
    }
}

# ビルド結果サマリー
function Show-BuildSummary {
    param(
        [bool]$BackendResult,
        [bool]$FrontendResult
    )
    
    Write-Host ""
    Write-Host "📦 ビルド結果サマリー" -ForegroundColor Cyan
    Write-Host "=" * 30
    Write-Host "環境: $Environment" -ForegroundColor Gray
    Write-Host ""
    
    if ($Target -eq "all" -or $Target -eq "backend") {
        if ($BackendResult) {
            Write-Success "バックエンド: 成功"
            if (Test-Path "backend/requirements.txt") {
                Write-Host "  出力: backend/requirements.txt"
            }
        }
        else {
            Write-Error "バックエンド: 失敗"
        }
    }
    
    if ($Target -eq "all" -or $Target -eq "frontend") {
        if ($FrontendResult) {
            Write-Success "フロントエンド: 成功"
            if (Test-Path "frontend/.next") {
                Write-Host "  出力: frontend/.next/"
            }
            if (Test-Path "frontend/out") {
                Write-Host "  静的出力: frontend/out/"
            }
        }
        else {
            Write-Error "フロントエンド: 失敗"
        }
    }
    
    Write-Host ""
    
    if ($BackendResult -and $FrontendResult) {
        Write-Host "🚀 デプロイ準備完了！" -ForegroundColor Green
        Write-Host ""
        Write-Host "次のステップ:" -ForegroundColor Cyan
        Write-Host "1. バックエンド: backend/ ディレクトリをサーバーにデプロイ"
        Write-Host "2. フロントエンド: frontend/.next/ または frontend/out/ をホスティングサービスにデプロイ"
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
    
    if ($Environment -notin @("development", "production")) {
        Write-Error "無効なEnvironment値です。development, production のいずれかを指定してください。"
        exit 1
    }
    
    Write-Host "📦 Plant Monitor ビルドを開始します..." -ForegroundColor Green
    Write-Host "対象: $Target" -ForegroundColor Gray
    Write-Host "環境: $Environment" -ForegroundColor Gray
    if ($Clean) { Write-Host "クリーンビルド: 有効" -ForegroundColor Gray }
    Write-Host ""
    
    $backendResult = $true
    $frontendResult = $true
    
    try {
        # クリーンアップ
        if ($Clean) {
            Invoke-Cleanup
        }
        
        # バックエンドビルド
        if ($Target -eq "all" -or $Target -eq "backend") {
            $backendResult = Build-Backend
        }
        
        # フロントエンドビルド
        if ($Target -eq "all" -or $Target -eq "frontend") {
            $frontendResult = Build-Frontend
        }
        
        # 結果サマリー表示
        Show-BuildSummary -BackendResult $backendResult -FrontendResult $frontendResult
        
        # 全体結果判定
        $overallSuccess = $backendResult -and $frontendResult
        
        if ($overallSuccess) {
            Write-Success "🎉 ビルドが完了しました！"
        }
        else {
            Write-Error "❌ ビルドが失敗しました"
            exit 1
        }
    }
    catch {
        Write-Error "ビルド実行中にエラーが発生しました: $_"
        exit 1
    }
}

# スクリプト実行
Main