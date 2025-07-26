# 設計書

## 概要

この設計書は、TCS-kanazawa-gw植物監視システムの再構築について説明し、クリーンで保守しやすく、よく整理されたプロジェクト構造を作成することを目的としています。システムは3つの主要コンポーネントで構成されています：Python FastAPIバックエンド（PlantMonitor）、Next.jsフロントエンド（PlantMonitorPage）、そして潜在的なMQTTテストコンポーネント（MQTTtest）。

## アーキテクチャ

### 現状分析

**特定された問題:**
1. **一貫性のない依存関係管理**: PlantMonitorに`pyproject.toml`と`requirements.txt`の両方があり、バージョン競合が発生
2. **設定ファイルの不足**: PlantMonitorPageに`package.json`と適切なNext.js設定が不足
3. **不完全なドキュメント**: ルートREADME.mdが最小限で、コンポーネントのREADMEが不足
4. **不明確なコンポーネントの目的**: MQTTtestディレクトリが空（削除予定）
5. **混在する設定アプローチ**: 異なるコンポーネントが異なる設定パターンを使用

**目標アーキテクチャ:**
```
TCS-kanazawa-gw/
├── README.md                    # 包括的なプロジェクト概要
├── docs/                        # プロジェクトドキュメント
│   ├── architecture.md
│   ├── api.md
│   └── deployment.md
├── backend/                     # PlantMonitorからリネーム
│   ├── README.md
│   ├── pyproject.toml          # 依存関係の単一情報源
│   ├── .env.example
│   ├── app/
│   ├── tests/
│   └── scripts/
├── frontend/                    # PlantMonitorPageからリネーム
│   ├── README.md
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── src/
│   └── public/

└── scripts/                     # プロジェクト全体のユーティリティスクリプト
    ├── setup.sh
    ├── start-dev.sh
    └── deploy.sh
```

## コンポーネントとインターフェース

### 1. バックエンドコンポーネント (FastAPI)

**構造:**
```
backend/
├── README.md                    # セットアップとAPIドキュメント
├── pyproject.toml              # 単一の依存関係管理
├── .env.example                # 環境変数テンプレート
├── .gitignore
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPIアプリケーション
│   ├── config.py               # 設定管理
│   ├── models/                 # データモデル
│   ├── services/               # ビジネスロジック
│   ├── api/                    # APIルート
│   ├── templates/              # Jinja2テンプレート（必要に応じて）
│   └── static/                 # 静的ファイル
├── tests/                      # テストスイート
│   ├── __init__.py
│   ├── test_api.py
│   └── test_services.py
└── scripts/
    ├── start.py                # 開発サーバー
    └── migrate.py              # データベースマイグレーション
```

**主な変更点:**
- `requirements.txt`を削除し、`pyproject.toml`のみを使用
- 適切な設定管理を追加
- コードを論理的なモジュールに整理
- 包括的なテスト構造を追加

### 2. フロントエンドコンポーネント (Next.js)

**構造:**
```
frontend/
├── README.md                   # セットアップと開発ガイド
├── package.json               # 依存関係とスクリプト
├── next.config.js             # Next.js設定
├── tailwind.config.js         # Tailwind CSS設定
├── tsconfig.json              # TypeScript設定
├── .env.local.example         # 環境変数テンプレート
├── .gitignore
├── public/                    # 静的アセット
├── src/
│   ├── app/                   # App Router構造
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/            # 再利用可能なコンポーネント
│   ├── lib/                   # ユーティリティ関数
│   ├── hooks/                 # カスタムReactフック
│   └── types/                 # TypeScript型定義
└── __tests__/                 # テストファイル
```

**主な変更点:**
- 適切な依存関係を持つ`package.json`を作成
- Next.js設定ファイルを追加
- 適切なTypeScriptセットアップを実装
- コンポーネントとユーティリティを整理

### 3. MQTTコンポーネント

**注意:** MQTTtestディレクトリは空で不要なため、削除します。将来的にMQTT機能が必要になった場合は、バックエンドコンポーネント内に統合するか、別途実装します。

## データモデル

### 設定管理

**バックエンド設定 (`backend/app/config.py`):**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    dynamodb_table_name: str
    environment: str = "development"
    
    class Config:
        env_file = ".env"
```

**フロントエンド設定 (`frontend/.env.local.example`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development
```



### 依存関係管理

**バックエンド依存関係 (pyproject.toml):**
- `requirements.txt`を削除
- すべての依存関係を`pyproject.toml`に統合
- 柔軟性のためにバージョン範囲を使用
- 開発依存関係セクションを追加

**フロントエンド依存関係 (package.json):**
- 包括的な`package.json`を作成
- Next.js、React、TypeScriptを含める
- 開発ツール（ESLint、Prettier）を追加
- テストフレームワークを含める

## エラーハンドリング

### 標準化されたエラーレスポンス

**バックエンドエラーハンドリング:**
```python
from fastapi import HTTPException
from fastapi.responses import JSONResponse

class ErrorHandler:
    @staticmethod
    def handle_dynamodb_error(error):
        return JSONResponse(
            status_code=500,
            content={"error": "Database error", "detail": str(error)}
        )
```

**フロントエンドエラーハンドリング:**
```typescript
interface ApiError {
  error: string;
  detail: string;
  timestamp: string;
}

class ErrorHandler {
  static handleApiError(error: ApiError): void {
    // 集中化されたエラーハンドリングロジック
  }
}
```

## テスト戦略

### バックエンドテスト
- サービスとモデルの単体テスト
- APIエンドポイントの統合テスト
- テストフィクスチャを使用したデータベース統合テスト
- 適切なフィクスチャでpytestを使用

### フロントエンドテスト
- React Testing Libraryを使用したコンポーネントテスト
- API相互作用の統合テスト
- PlaywrightまたはCypressを使用したE2Eテスト
- ビジュアル回帰テスト



## 開発ワークフロー

### セットアップスクリプト
- `scripts/setup.sh`: 初期プロジェクトセットアップ
- `scripts/start-dev.sh`: すべての開発サーバーを開始
- `scripts/test.sh`: すべてのテストスイートを実行
- `scripts/lint.sh`: コード品質チェック

### 開発コマンド
**バックエンド:**
```bash
cd backend
uv run uvicorn app.main:app --reload
uv run pytest
```

**フロントエンド:**
```bash
cd frontend
npm run dev
npm run test
npm run build
```



## マイグレーション戦略

### フェーズ1: ディレクトリ再構築
1. ディレクトリを標準名にリネーム
2. ファイルを適切な場所に移動
3. インポートパスと参照を更新

### フェーズ2: 設定の標準化
1. 依存関係ファイルを統合
2. 不足している設定ファイルを作成
3. 環境管理を標準化

### フェーズ3: ドキュメントとスクリプト
1. 包括的なドキュメントを作成
2. セットアップと開発スクリプトを追加
3. テストインフラストラクチャを実装

### フェーズ4: クリーンアップと最適化
1. 未使用のファイルと依存関係を削除
2. ビルドプロセスを最適化
3. すべてのコンポーネントが連携することを検証