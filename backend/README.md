# Plant Monitor Backend

植物監視システムのバックエンドAPI - FastAPIを使用したDynamoDBデータ可視化アプリケーション

## 概要

このバックエンドは、IoTセンサーから収集された植物の環境データ（温度、湿度など）をDynamoDBから取得し、時系列グラフとして可視化するAPIを提供します。

## 技術スタック

- **Python**: 3.12+
- **FastAPI**: Webフレームワーク
- **boto3**: AWS SDK
- **Plotly**: グラフ生成
- **Pandas**: データ処理
- **Pydantic Settings**: 設定管理

## セットアップ

### 前提条件

- Python 3.12以上
- uv (Python パッケージマネージャー)
- AWS認証情報

### インストール

1. 依存関係のインストール:
```bash
cd backend
uv sync
```

2. 環境変数の設定:
```bash
cp .env.example .env
# .envファイルを編集してAWS認証情報を設定
```

### 環境変数

`.env`ファイルに以下の設定が必要です：

```env
# AWS認証情報
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-northeast-1

# DynamoDB設定
DYNAMODB_TABLE_NAME=aggdata_table

# アプリケーション設定
DEFAULT_DATA_TYPE=temperature
DEFAULT_PERIOD_DAYS=7
ENVIRONMENT=development
```

## 開発

### 開発サーバーの起動

```bash
uv run uvicorn app.main:app --reload
```

サーバーは `http://localhost:8000` で起動します。

### API ドキュメント

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API エンドポイント

### GET /

植物監視データの可視化ページを表示

**パラメータ:**
- `data_type` (string, optional): データの種類 (デフォルト: "temperature")
- `days` (int, optional): 表示する日数 (デフォルト: 7)

**例:**
```
GET /?data_type=humidity&days=14
```

## プロジェクト構造

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPIアプリケーション
│   ├── config.py            # 設定管理
│   ├── models/              # データモデル
│   ├── services/            # ビジネスロジック
│   │   ├── dynamodb.py      # DynamoDB操作
│   │   └── graph.py         # グラフ生成
│   ├── api/                 # APIルート
│   ├── templates/           # Jinja2テンプレート
│   └── static/              # 静的ファイル
├── tests/                   # テストファイル
├── scripts/                 # ユーティリティスクリプト
├── pyproject.toml          # プロジェクト設定
├── .env.example            # 環境変数テンプレート
└── README.md               # このファイル
```

## テスト

### テストの実行

```bash
uv run pytest
```

### カバレッジレポート

```bash
uv run pytest --cov=app --cov-report=html
```

## コード品質

### フォーマット

```bash
uv run black app tests
uv run isort app tests
```

### リンティング

```bash
uv run flake8 app tests
```

## デプロイ

### 本番環境での実行

```bash
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## トラブルシューティング

### よくある問題

1. **AWS認証エラー**
   - `.env`ファイルのAWS認証情報を確認
   - AWS CLIの設定を確認

2. **DynamoDBテーブルが見つからない**
   - `DYNAMODB_TABLE_NAME`の設定を確認
   - テーブルが存在することを確認

3. **依存関係のエラー**
   - `uv sync`を実行して依存関係を再インストール

## 貢献

1. フォークしてブランチを作成
2. 変更を実装
3. テストを実行
4. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。