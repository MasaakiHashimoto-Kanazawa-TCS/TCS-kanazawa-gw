# TCS-kanazawa-gw - 植物監視システム

IoTセンサーを使用した植物の環境監視システム。リアルタイムでデータを収集し、ダッシュボードで可視化します。

## システム概要

植物の成長環境を監視するフルスタックWebアプリケーション：

- **IoTセンサー**: 温度・pHなどの環境データを収集
- **データ保存**: AWS DynamoDB にデータを永続化
- **バックエンドAPI**: FastAPI でデータ処理・グラフ生成
- **フロントエンド**: Vite + React SPA + Tailwind CSS のレスポンシブダッシュボード

## アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoTセンサー    │───▶│   DynamoDB      │───▶│  FastAPI        │
│  (温度・pH)      │    │  (データ保存)    │    │  (バックエンド)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐                            ┌─────────────────┐
│   ユーザー       │◀───────────────────────────│  Vite + React   │
│  (Webブラウザ)   │                            │  (フロントエンド) │
└─────────────────┘                            └─────────────────┘
```

## 技術スタック

| レイヤー       | 技術                                   |
| -------------- | -------------------------------------- |
| フロントエンド | React 18, TypeScript 5, React Router 7 |
| スタイリング   | Tailwind CSS 3                         |
| チャート       | Recharts 3                             |
| ビルドツール   | Vite+ (`vp` CLI) / pnpm                |
| バックエンド   | Python 3.12+, FastAPI                  |
| データ処理     | Pandas, Plotly                         |
| AWS SDK        | boto3                                  |
| データベース   | AWS DynamoDB                           |

## プロジェクト構造

```
TCS-kanazawa-gw/
├── README.md
├── backend/                         # FastAPI バックエンド
│   ├── app/
│   │   ├── main.py                  # アプリエントリーポイント
│   │   ├── config.py                # 設定管理
│   │   ├── api/v1.py                # REST API エンドポイント
│   │   ├── services/
│   │   │   ├── dynamodb.py          # DynamoDB操作
│   │   │   └── graph.py             # グラフ生成
│   │   └── templates/               # Jinja2テンプレート
│   ├── tests/
│   ├── pyproject.toml
│   └── .env.example
├── frontend/                        # Vite + React SPA フロントエンド
│   ├── index.html                   # Vite エントリ HTML
│   ├── src/
│   │   ├── main.tsx                 # アプリエントリーポイント
│   │   ├── App.tsx                  # BrowserRouter + Routes
│   │   ├── app/                     # ページコンポーネント
│   │   │   ├── globals.css          # グローバルスタイル
│   │   │   ├── page.tsx             # ダッシュボード (/)
│   │   │   ├── alerts/page.tsx      # アラート管理 (/alerts)
│   │   │   ├── history/page.tsx     # データ履歴 (/history)
│   │   │   └── plant/page.tsx       # 植物詳細 (/plant)
│   │   ├── components/
│   │   │   ├── ui/                  # 汎用UIコンポーネント
│   │   │   ├── layout/              # レイアウト (Header, Navigation)
│   │   │   ├── dashboard/           # ダッシュボード関連
│   │   │   ├── charts/              # チャート (TimeSeriesChart, etc.)
│   │   │   ├── alerts/              # アラート表示
│   │   │   ├── plant/               # 植物情報
│   │   │   └── mobile/              # モバイル専用レイアウト
│   │   ├── hooks/                   # カスタムフック
│   │   │   ├── useApiData.ts
│   │   │   ├── useSensorData.ts
│   │   │   ├── useCachedSensorData.ts
│   │   │   ├── usePlantData.ts
│   │   │   └── useAlerts.ts
│   │   ├── lib/
│   │   │   ├── api/                 # APIクライアント・エンドポイント定義
│   │   │   ├── services/            # センサー・植物データサービス
│   │   │   ├── utils/               # ユーティリティ (cache, dataTransform, etc.)
│   │   │   └── constants.ts         # アプリ定数・設定
│   │   └── types/                   # TypeScript型定義
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts               # Vite+ 設定
├── scripts/                         # セットアップ・起動スクリプト
│   ├── setup.sh / setup.ps1
│   ├── start-dev.sh / start-dev.ps1
│   └── test.sh / test.ps1
└── docs/                            # ドキュメント
    ├── architecture.md
    ├── api.md
    └── deployment.md
```

## クイックスタート

### 前提条件

- Python 3.12以上
- Node.js 18.0.0以上
- [uv](https://docs.astral.sh/uv/) (Python パッケージマネージャー)
- [Vite+](https://vite.dev/plus) (`vp` CLI)
- AWS 認証情報と DynamoDB テーブル

### セットアップ (自動)

**Linux/macOS:**

```bash
./scripts/setup.sh
```

**Windows PowerShell:**

```powershell
.\scripts\setup.ps1
```

### セットアップ (手動)

**バックエンド:**

```bash
cd backend
uv sync
cp .env.example .env
# .env を編集して AWS 認証情報を設定
```

**フロントエンド:**

```bash
cd frontend
vp install
cp .env.local.example .env.local
# .env.local を編集して API URL を設定
```

### 開発サーバー起動

**自動起動:**

```bash
./scripts/start-dev.sh      # Linux/macOS
.\scripts\start-dev.ps1     # Windows
```

**手動起動 (ターミナル2つ):**

```bash
# バックエンド
cd backend
uv run uvicorn app.main:app --reload

# フロントエンド
cd frontend
vp dev
```

### アクセス

| サービス                   | URL                        |
| -------------------------- | -------------------------- |
| フロントエンド             | http://localhost:5173      |
| バックエンドAPI            | http://localhost:8000      |
| API ドキュメント (Swagger) | http://localhost:8000/docs |

## 環境変数

### フロントエンド (`.env.local`)

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Plant Monitor
VITE_ENVIRONMENT=development
VITE_DEBUG=true
```

### バックエンド (`.env`)

```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-northeast-1
DYNAMODB_TABLE_NAME=aggdata_table
DEFAULT_DATA_TYPE=temperature
DEFAULT_PERIOD_DAYS=7
ENVIRONMENT=development
```

## API エンドポイント

| エンドポイント             | メソッド | 説明                      |
| -------------------------- | -------- | ------------------------- |
| `/`                        | GET      | データ可視化ページ (HTML) |
| `/api/v1/data`             | GET      | センサーデータ取得        |
| `/api/v1/data/latest`      | GET      | 最新センサー値            |
| `/api/v1/data/summary`     | GET      | データ統計サマリー        |
| `/api/v1/plants`           | GET      | 植物一覧                  |
| `/api/v1/plants/{id}`      | GET      | 植物詳細                  |
| `/api/v1/plants/{id}/data` | GET      | 植物別センサーデータ      |
| `/api/v1/alerts`           | GET      | アラート一覧              |

**主なクエリパラメータ:**

- `data_type`: `"temperature"` または `"pH"` (デフォルト: temperature)
- `days`: 取得日数 (デフォルト: 7)
- `start_time` / `end_time`: ISO 8601 形式
- `limit`: 最大件数 (デフォルト: 1000)

## 機能

### 実装済み

- ダッシュボード概要（メトリクス・植物カード）
- 時系列チャート（温度・pH）
- 時間範囲フィルター（24時間 / 7日 / 30日 / 150日 / カスタム）
- アラート・通知表示
- データキャッシュ（パフォーマンス最適化）
- レスポンシブデザイン（PC・モバイル対応）
- エラーバウンダリ・エラーハンドリング
- バックエンドAPI統合

### 今後の予定

- WebSocket によるリアルタイム更新
- アラート設定の高度化
- モバイルアプリ
- データ分析機能
- ユーザー管理

## 開発

### フロントエンド (Vite+ を使用)

```bash
cd frontend

vp dev          # 開発サーバー起動
vp build        # プロダクションビルド
vp check        # フォーマット・リント・型チェック
vp test         # テスト実行
vp lint         # リントのみ
vp fmt          # フォーマットのみ
```

> **注意:** `npm`/`pnpm` を直接使わず、`vp` コマンドを使用すること。

### バックエンド

```bash
cd backend

uv run uvicorn app.main:app --reload   # 開発サーバー
uv run pytest                          # テスト
uv run pytest --cov=app --cov-report=html  # カバレッジ付きテスト
uv run black app tests                 # フォーマット
uv run flake8 app tests                # リント
```

## テスト

```bash
# 全テスト
./scripts/test.sh

# フロントエンドのみ
cd frontend && vp test

# バックエンドのみ
cd backend && uv run pytest
```

## デプロイ

| コンポーネント | 環境                                                    |
| -------------- | ------------------------------------------------------- |
| フロントエンド | 静的ホスティング (Vercel / AWS S3+CloudFront / Amplify) |
| バックエンド   | AWS Lambda + API Gateway                                |
| データベース   | AWS DynamoDB                                            |

詳細は [docs/deployment.md](docs/deployment.md) を参照。

## ドキュメント

- [システムアーキテクチャ](docs/architecture.md)
- [API仕様](docs/api.md)
- [デプロイメントガイド](docs/deployment.md)
- [バックエンドREADME](backend/README.md)
- [フロントエンドREADME](frontend/README.md)

## チーム

- **開発**: TCS金沢グループワーク
- **期間**: 2025年〜
