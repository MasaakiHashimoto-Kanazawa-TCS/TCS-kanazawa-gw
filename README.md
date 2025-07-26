# TCS-kanazawa-gw - 植物監視システム

IoTセンサーを使用した植物の環境監視システム。リアルタイムでデータを収集し、美しいダッシュボードで可視化します。

## 🌱 システム概要

このシステムは、植物の成長環境を監視するためのフルスタックWebアプリケーションです：

- **IoTセンサー**: 温度、湿度などの環境データを収集
- **データ保存**: AWS DynamoDBにデータを保存
- **バックエンドAPI**: FastAPIでデータ処理とグラフ生成
- **フロントエンド**: Next.jsで美しいダッシュボードを提供

## 🏗️ アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoTセンサー    │───▶│   DynamoDB      │───▶│  FastAPI        │
│  (温度・湿度)    │    │  (データ保存)    │    │  (バックエンド)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐                            ┌─────────────────┐
│   ユーザー       │◀───────────────────────────│   Next.js       │
│  (Webブラウザ)   │                            │  (フロントエンド) │
└─────────────────┘                            └─────────────────┘
```

## 📁 プロジェクト構造

```
TCS-kanazawa-gw/
├── README.md                    # このファイル
├── docs/                        # プロジェクトドキュメント
│   ├── architecture.md          # システムアーキテクチャ
│   ├── api.md                   # API仕様
│   └── deployment.md            # デプロイメントガイド
├── backend/                     # FastAPI バックエンド
│   ├── README.md                # バックエンドセットアップガイド
│   ├── pyproject.toml           # Python依存関係
│   ├── app/                     # アプリケーションコード
│   ├── tests/                   # テストファイル
│   └── scripts/                 # ユーティリティスクリプト
├── frontend/                    # Next.js フロントエンド
│   ├── README.md                # フロントエンドセットアップガイド
│   ├── package.json             # Node.js依存関係
│   ├── src/                     # ソースコード
│   ├── public/                  # 静的ファイル
│   └── __tests__/               # テストファイル
└── scripts/                     # プロジェクト全体のスクリプト
    ├── setup.sh / setup.ps1         # 初期セットアップ
    ├── start-dev.sh / start-dev.ps1 # 開発サーバー起動
    ├── test.sh / test.ps1           # テスト実行
    └── build.ps1                    # ビルドスクリプト
```

## 🚀 クイックスタート

### 前提条件

- **Python**: 3.12以上
- **Node.js**: 18.0.0以上
- **uv**: Python パッケージマネージャー
- **AWS**: 認証情報とDynamoDBテーブル

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd TCS-kanazawa-gw
```

### 2. 自動セットアップ (推奨)

Linux/macOS:
```bash
./scripts/setup.sh
```

Windows PowerShell:
```powershell
.\scripts\setup.ps1
```

### 3. 手動セットアップ

**バックエンド**:
```bash
cd backend
uv sync
cp .env.example .env
# .envファイルを編集してAWS認証情報を設定
```

**フロントエンド**:
```bash
cd frontend
npm install
cp .env.local.example .env.local
# .env.localファイルを編集してAPI URLを設定
```

### 4. 開発サーバーの起動

**自動起動スクリプト使用 (推奨)**:

Linux/macOS:
```bash
./scripts/start-dev.sh
```

Windows PowerShell:
```powershell
.\scripts\start-dev.ps1
```

**手動起動**:

バックエンド (ターミナル1):
```bash
cd backend
uv run uvicorn app.main:app --reload
```

フロントエンド (ターミナル2):
```bash
cd frontend
npm run dev
```

### 5. アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **API ドキュメント**: http://localhost:8000/docs

## 🛠️ 開発

### バックエンド開発

```bash
cd backend

# 開発サーバー起動
uv run uvicorn app.main:app --reload

# テスト実行
uv run pytest

# コードフォーマット
uv run black app tests
uv run isort app tests

# リンティング
uv run flake8 app tests
```

### フロントエンド開発

```bash
cd frontend

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト実行
npm run test

# リンティング
npm run lint

# 型チェック
npm run type-check
```

## 📊 機能

### 現在の機能

- ✅ DynamoDBからのデータ取得
- ✅ 時系列グラフの生成 (Plotly)
- ✅ データ種別の選択 (温度、湿度など)
- ✅ 表示期間の設定
- ✅ レスポンシブWebデザイン

### 今後の機能 (予定)

- 🔄 リアルタイムデータ更新
- 🔔 アラート機能
- 📱 モバイルアプリ
- 📈 データ分析機能
- 👥 ユーザー管理

## 🧪 テスト

### 自動テスト実行 (推奨)

Linux/macOS:
```bash
./scripts/test.sh              # 全テスト実行
./scripts/test.sh backend      # バックエンドのみ
./scripts/test.sh frontend     # フロントエンドのみ
```

Windows PowerShell:
```powershell
.\scripts\test.ps1                    # 全テスト実行
.\scripts\test.ps1 -Target backend   # バックエンドのみ
.\scripts\test.ps1 -Coverage          # カバレッジ付き
```

### 手動テスト実行

**バックエンド**:
```bash
cd backend
uv run pytest --cov=app --cov-report=html
```

**フロントエンド**:
```bash
cd frontend
npm run test:coverage
```

## 🚀 デプロイ

詳細なデプロイメント手順は [docs/deployment.md](docs/deployment.md) を参照してください。

### 本番環境

- **バックエンド**: AWS Lambda + API Gateway
- **フロントエンド**: Vercel または AWS Amplify
- **データベース**: AWS DynamoDB

## 📚 ドキュメント

- [システムアーキテクチャ](docs/architecture.md)
- [API仕様](docs/api.md)
- [デプロイメントガイド](docs/deployment.md)
- [バックエンドREADME](backend/README.md)
- [フロントエンドREADME](frontend/README.md)

## 🤝 貢献

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### 開発ガイドライン

- コードスタイル: Black (Python), Prettier (TypeScript)
- テストカバレッジ: 80%以上を維持
- コミットメッセージ: [Conventional Commits](https://www.conventionalcommits.org/)

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 👥 チーム

- **開発チーム**: TCS金沢グループワーク
- **プロジェクト期間**: 2025年

## 📞 サポート

問題や質問がある場合は、[Issues](../../issues) でお知らせください。

---

**Happy Coding! 🌱**