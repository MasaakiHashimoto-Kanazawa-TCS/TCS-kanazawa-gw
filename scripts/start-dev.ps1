# Plant Monitor 開発サーバー起動スクリプト (PowerShell版)

param(
    [switch]$Help,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

# エラー時に停止
$ErrorActionPreference = "Stop"

# グローバル変数
$BackendJob = $null
$FrontendJob = $null

# Ctrl+C 処理のためのフラグ
$script:ExitRequested = $false

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
Plant Monitor 開発サーバー起動スクリプト

使用方法:
    .\scripts\start-dev.ps1 [オプション]

オプション:
    -BackendOnly    バックエンドサーバーのみ起動
    -FrontendOnly   フロントエンドサーバーのみ起動
    -Help           このヘルプを表示

デフォルトでは両方のサーバーを起動します。
停止するには Ctrl+C を押してください。
"@
}

# クリーンアップ関数
function Stop-Servers {
    Write-Info "サーバーを停止しています..."
    
    if ($BackendJob) {
        Stop-Job $BackendJob -ErrorAction SilentlyContinue
        Remove-Job $BackendJob -ErrorAction SilentlyContinue
    }
    
    if ($FrontendJob) {
        Stop-Job $FrontendJob -ErrorAction SilentlyContinue
        Remove-Job $FrontendJob -ErrorAction SilentlyContinue
    }
    
    # プロセスを強制終了
    Get-Process -Name "uvicorn" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" } | Stop-Process -Force
    
    Write-Info "サーバーを停止しました"
}

# Ctrl+C ハンドラー
function Handle-CtrlC {
    if (-not $script:ExitRequested) {
        $script:ExitRequested = $true
        Write-Host ""
        Write-Info "終了シグナルを受信しました..."
        Stop-Servers
        exit 0
    }
}

# トラップハンドラー設定
trap {
    Handle-CtrlC
}

# バックエンドサーバー起動
function Start-Backend {
    Write-Info "バックエンドサーバーを起動中..."
    
    if (-not (Test-Path "backend")) {
        Write-Error "backendディレクトリが見つかりません"
        return $false
    }
    
    $script:BackendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\backend
        uv run uvicorn app.main:app --reload --host localhost --port 8000
    }
    
    # 起動待機とヘルスチェック（リトライ付き）
    $maxRetries = 10
    $retryCount = 0
    $healthCheckPassed = $false
    
    while ($retryCount -lt $maxRetries -and -not $healthCheckPassed) {
        Start-Sleep -Seconds 2
        $retryCount++
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -TimeoutSec 3 -ErrorAction Stop
            $healthCheckPassed = $true
            Write-Success "バックエンドサーバーが起動しました (http://localhost:8000)"
        }
        catch {
            Write-Host "." -NoNewline
            if ($retryCount -eq $maxRetries) {
                Write-Host ""
                Write-Error "バックエンドサーバーの起動に失敗しました (タイムアウト)"
                return $false
            }
        }
    }
    
    return $healthCheckPassed
}

# フロントエンドサーバー起動
function Start-Frontend {
    Write-Info "フロントエンドサーバーを起動中..."
    
    if (-not (Test-Path "frontend")) {
        Write-Error "frontendディレクトリが見つかりません"
        return $false
    }
    
    $script:FrontendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\frontend
        npm run dev
    }
    
    # 起動待機とヘルスチェック（リトライ付き）
    $maxRetries = 15
    $retryCount = 0
    $healthCheckPassed = $false
    
    while ($retryCount -lt $maxRetries -and -not $healthCheckPassed) {
        Start-Sleep -Seconds 2
        $retryCount++
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -ErrorAction Stop
            $healthCheckPassed = $true
            Write-Success "フロントエンドサーバーが起動しました (http://localhost:3000)"
        }
        catch {
            Write-Host "." -NoNewline
            if ($retryCount -eq $maxRetries) {
                Write-Host ""
                Write-Error "フロントエンドサーバーの起動に失敗しました (タイムアウト)"
                return $false
            }
        }
    }
    
    return $healthCheckPassed
}

# サーバー監視
function Monitor-Servers {
    Write-Host ""
    Write-Success "🎉 開発サーバーが起動しました！"
    Write-Host ""
    Write-Host "アクセス URL:" -ForegroundColor Cyan
    
    if (-not $BackendOnly) {
        Write-Host "  フロントエンド: http://localhost:3000"
    }
    if (-not $FrontendOnly) {
        Write-Host "  バックエンドAPI: http://localhost:8000"
        Write-Host "  API ドキュメント: http://localhost:8000/docs"
    }
    
    Write-Host ""
    Write-Host "停止するには Ctrl+C を押してください" -ForegroundColor Yellow
    Write-Host ""
    
    # 監視ループ
    try {
        while ($true) {
            Start-Sleep -Seconds 5
            
            # バックエンドジョブチェック
            if ($BackendJob -and $BackendJob.State -eq "Failed") {
                Write-Error "バックエンドサーバーが停止しました"
                Stop-Servers
                exit 1
            }
            
            # フロントエンドジョブチェック
            if ($FrontendJob -and $FrontendJob.State -eq "Failed") {
                Write-Error "フロントエンドサーバーが停止しました"
                Stop-Servers
                exit 1
            }
        }
    }
    catch [System.Management.Automation.PipelineStoppedException] {
        # Ctrl+C が押された場合
        Handle-CtrlC
    }
}

# メイン実行
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    # Ctrl+C ハンドラー設定 (PowerShell 5.1+ 対応)
    try {
        $null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action { Handle-CtrlC }
    } catch {
        # フォールバック: 古いPowerShellバージョン用
        Write-Info "Ctrl+C ハンドラーの設定をスキップしました (PowerShell バージョンの制限)"
    }
    
    Write-Host "🌱 Plant Monitor 開発サーバーを起動しています..." -ForegroundColor Green
    Write-Host ""
    
    try {
        $backendSuccess = $true
        $frontendSuccess = $true
        
        # バックエンド起動
        if (-not $FrontendOnly) {
            $backendSuccess = Start-Backend
        }
        
        # フロントエンド起動
        if (-not $BackendOnly) {
            $frontendSuccess = Start-Frontend
        }
        
        # 起動確認
        if (-not $backendSuccess -or -not $frontendSuccess) {
            Write-Error "サーバーの起動に失敗しました"
            Stop-Servers
            exit 1
        }
        
        # 監視開始
        Monitor-Servers
    }
    catch {
        Write-Error "エラーが発生しました: $_"
        Stop-Servers
        exit 1
    }
}

# スクリプト実行
Main