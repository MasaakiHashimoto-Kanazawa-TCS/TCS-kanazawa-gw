# Plant Monitor システムセットアップスクリプト (PowerShell版)

param(
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
Plant Monitor システムセットアップスクリプト

使用方法:
    .\scripts\setup.ps1

このスクリプトは以下を実行します:
1. 前提条件のチェック
2. バックエンドのセットアップ
3. フロントエンドのセットアップ
4. 環境変数ファイルの作成

前提条件:
- Python 3.12以上
- Node.js 18.0.0以上
- uv パッケージマネージャー
"@
}

# 前提条件チェック
function Test-Prerequisites {
    Write-Info "前提条件をチェックしています..."
    
    # Python チェック
    try {
        $pythonVersion = python --version 2>$null
        if (-not $pythonVersion) {
            throw "Python not found"
        }
        Write-Host "Python: $pythonVersion" -ForegroundColor Gray
    }
    catch {
        Write-Error "Python 3.12以上が必要です"
        Write-Host "インストール: https://www.python.org/downloads/" -ForegroundColor Yellow
        exit 1
    }
    
    # Node.js チェック
    try {
        $nodeVersion = node --version 2>$null
        if (-not $nodeVersion) {
            throw "Node.js not found"
        }
        Write-Host "Node.js: $nodeVersion" -ForegroundColor Gray
    }
    catch {
        Write-Error "Node.js 18.0.0以上が必要です"
        Write-Host "インストール: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # uv チェック
    try {
        $uvVersion = uv --version 2>$null
        if (-not $uvVersion) {
            throw "uv not found"
        }
        Write-Host "uv: $uvVersion" -ForegroundColor Gray
    }
    catch {
        Write-Error "uv パッケージマネージャーが必要です"
        Write-Host "インストール: pip install uv" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Success "前提条件チェック完了"
}

# バックエンドセットアップ
function Setup-Backend {
    Write-Info "バックエンドをセットアップしています..."
    
    Push-Location backend
    
    try {
        # 依存関係インストール
        Write-Host "依存関係をインストール中..." -ForegroundColor Gray
        uv sync
        Write-Success "バックエンド依存関係インストール完了"
        
        # 環境変数ファイル作成
        if (-not (Test-Path ".env")) {
            Copy-Item ".env.example" ".env"
            Write-Info "環境変数ファイル (.env) を作成しました"
            Write-Host "AWS認証情報を設定してください" -ForegroundColor Yellow
        }
        else {
            Write-Host ".envファイルは既に存在します" -ForegroundColor Gray
        }
    }
    catch {
        Write-Error "バックエンドセットアップでエラーが発生しました: $_"
        exit 1
    }
    finally {
        Pop-Location
    }
    
    Write-Success "バックエンドセットアップ完了"
}

# フロントエンドセットアップ
function Setup-Frontend {
    Write-Info "フロントエンドをセットアップしています..."
    
    Push-Location frontend
    
    try {
        # 依存関係インストール
        Write-Host "依存関係をインストール中..." -ForegroundColor Gray
        npm install
        Write-Success "フロントエンド依存関係インストール完了"
        
        # 環境変数ファイル作成
        if (-not (Test-Path ".env.local")) {
            Copy-Item ".env.local.example" ".env.local"
            Write-Info "環境変数ファイル (.env.local) を作成しました"
            Write-Host "API URLを設定してください" -ForegroundColor Yellow
        }
        else {
            Write-Host ".env.localファイルは既に存在します" -ForegroundColor Gray
        }
    }
    catch {
        Write-Error "フロントエンドセットアップでエラーが発生しました: $_"
        exit 1
    }
    finally {
        Pop-Location
    }
    
    Write-Success "フロントエンドセットアップ完了"
}

# メイン実行
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "🌱 Plant Monitor システムのセットアップを開始します..." -ForegroundColor Green
    Write-Host ""
    
    try {
        Test-Prerequisites
        Setup-Backend
        Setup-Frontend
        
        Write-Host ""
        Write-Success "🎉 セットアップが完了しました！"
        Write-Host ""
        Write-Host "次のステップ:" -ForegroundColor Cyan
        Write-Host "1. backend\.env ファイルでAWS認証情報を設定"
        Write-Host "2. frontend\.env.local ファイルでAPI URLを設定"
        Write-Host "3. 開発サーバーを起動: .\scripts\start-dev.ps1"
        Write-Host ""
    }
    catch {
        Write-Error "セットアップ中にエラーが発生しました: $_"
        exit 1
    }
}

# スクリプト実行
Main