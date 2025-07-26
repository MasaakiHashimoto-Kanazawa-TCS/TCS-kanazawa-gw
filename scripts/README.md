# Plant Monitor スクリプト集

このディレクトリには、Plant Monitor システムの開発・運用を支援するスクリプトが含まれています。

## 📁 スクリプト一覧

### セットアップスクリプト
- `setup.sh` - Linux/macOS用セットアップスクリプト
- `setup.ps1` - Windows PowerShell用セットアップスクリプト

### 開発サーバースクリプト
- `start-dev.sh` - Linux/macOS用開発サーバー起動スクリプト
- `start-dev.ps1` - Windows PowerShell用開発サーバー起動スクリプト

### テストスクリプト
- `test.sh` - Linux/macOS用テスト実行スクリプト
- `test.ps1` - Windows PowerShell用テスト実行スクリプト

### ビルドスクリプト
- `build.ps1` - Windows PowerShell用ビルドスクリプト

## 🚀 使用方法

### 初回セットアップ

**Linux/macOS:**
```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```

**Windows PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\scripts\setup.ps1
```

### 開発サーバー起動

**Linux/macOS:**
```bash
./scripts/start-dev.sh
```

**Windows PowerShell:**
```powershell
.\scripts\start-dev.ps1
```

**オプション:**
- `-BackendOnly` - バックエンドサーバーのみ起動
- `-FrontendOnly` - フロントエンドサーバーのみ起動

### テスト実行

**Linux/macOS:**
```bash
./scripts/test.sh              # 全テスト実行
./scripts/test.sh backend      # バックエンドのみ
./scripts/test.sh frontend     # フロントエンドのみ
```

**Windows PowerShell:**
```powershell
.\scripts\test.ps1                    # 全テスト実行
.\scripts\test.ps1 -Target backend   # バックエンドのみ
.\scripts\test.ps1 -Target frontend  # フロントエンドのみ
.\scripts\test.ps1 -Coverage          # カバレッジレポート付き
.\scripts\test.ps1 -Target frontend -Watch  # ウォッチモード
```

### ビルド

**Windows PowerShell:**
```powershell
.\scripts\build.ps1                           # 全体を本番ビルド
.\scripts\build.ps1 -Target frontend         # フロントエンドのみ
.\scripts\build.ps1 -Environment development # 開発ビルド
.\scripts\build.ps1 -Clean                   # クリーンビルド
```

## 🔧 スクリプト詳細

### setup.sh / setup.ps1

**機能:**
- 前提条件のチェック (Python, Node.js, uv)
- バックエンド依存関係のインストール
- フロントエンド依存関係のインストール
- 環境変数ファイルの作成

**使用例:**
```bash
./scripts/setup.sh
```

### start-dev.sh / start-dev.ps1

**機能:**
- バックエンドサーバーの起動 (http://localhost:8000)
- フロントエンドサーバーの起動 (http://localhost:3000)
- サーバーの監視とエラーハンドリング
- Ctrl+C での安全な停止

**使用例:**
```powershell
.\scripts\start-dev.ps1 -BackendOnly  # バックエンドのみ
```

### test.sh / test.ps1

**機能:**
- 単体テストの実行
- カバレッジレポートの生成
- コード品質チェック (リンティング、フォーマット)
- 型チェック (TypeScript)
- ビルドテスト

**使用例:**
```powershell
.\scripts\test.ps1 -Coverage -Target backend
```

### build.ps1

**機能:**
- 本番用ビルドの作成
- テストとリンティングの実行
- 依存関係の最適化
- 静的ファイルの生成

**使用例:**
```powershell
.\scripts\build.ps1 -Clean -Environment production
```

## 🛠️ トラブルシューティング

### Windows PowerShell実行ポリシーエラー

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Linux/macOS権限エラー

```bash
chmod +x scripts/*.sh
```

### ポート競合エラー

開発サーバーが起動しない場合、以下のポートが使用されていないか確認してください：
- バックエンド: 8000
- フロントエンド: 3000

### 依存関係エラー

```bash
# バックエンド
cd backend
uv sync

# フロントエンド
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## 📝 カスタマイズ

スクリプトは必要に応じてカスタマイズできます：

1. **ポート番号の変更**: スクリプト内の `8000`, `3000` を変更
2. **環境変数の追加**: 各スクリプトの環境変数設定部分を修正
3. **追加チェック**: 前提条件チェック関数に新しい要件を追加

## 🔄 継続的インテグレーション

これらのスクリプトはCI/CDパイプラインでも使用できます：

```yaml
# GitHub Actions例
- name: Setup
  run: ./scripts/setup.sh

- name: Test
  run: ./scripts/test.sh

- name: Build
  run: ./scripts/build.ps1
```

## 📞 サポート

スクリプトに関する問題や改善提案は、プロジェクトのIssuesで報告してください。