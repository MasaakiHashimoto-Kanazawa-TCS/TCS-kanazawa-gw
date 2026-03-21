# Plant Monitor Frontend

植物監視システムのフロントエンド - Vite + React + TypeScript + Tailwind CSS で構築された SPA

## 技術スタック

| 技術             | 用途                           |
| ---------------- | ------------------------------ |
| Vite+ (`vp` CLI) | ビルドツール・統合 CLI         |
| React 18         | UI ライブラリ                  |
| React Router 7   | クライアントサイドルーティング |
| TypeScript 5     | 型安全性                       |
| Tailwind CSS 3   | スタイリング                   |
| Recharts 3       | チャート・グラフ               |

## セットアップ

### 前提条件

- Node.js 18.0.0以上
- [Vite+](https://vite.dev/plus) グローバル CLI (`vp`)

### インストール

```bash
cd frontend
vp install
```

### 環境変数

`.env.local` を作成して設定：

```bash
cp .env.local.example .env.local
```

```env
VITE_API_URL=http://localhost:8000
VITE_ENVIRONMENT=development
VITE_APP_NAME=Plant Monitor
VITE_APP_VERSION=0.1.0
VITE_DEBUG=false
```

## 開発コマンド

```bash
vp dev          # 開発サーバー起動 (http://localhost:5173)
vp build        # プロダクションビルド
vp preview      # ビルド結果のプレビュー
vp check        # フォーマット・リント・型チェック
vp check --fix  # 自動修正付きチェック
vp test         # テスト実行
vp lint         # リントのみ
vp fmt          # フォーマットのみ
```

> **注意:** `npm`/`pnpm` を直接使わず、常に `vp` コマンドを使用すること。

## プロジェクト構造

```
frontend/
├── index.html               # Vite エントリ HTML
├── vite.config.ts           # Vite+ 設定
├── tailwind.config.js       # Tailwind CSS 設定
├── tsconfig.json            # TypeScript 設定
├── .env.local.example       # 環境変数テンプレート
└── src/
    ├── main.tsx             # アプリエントリーポイント
    ├── App.tsx              # ルートコンポーネント (BrowserRouter + Routes)
    ├── app/                 # ページコンポーネント
    │   ├── globals.css      # グローバルスタイル
    │   ├── page.tsx         # ダッシュボード (/)
    │   ├── alerts/page.tsx  # アラート管理 (/alerts)
    │   ├── history/page.tsx # データ履歴 (/history)
    │   └── plant/page.tsx   # 植物詳細 (/plant)
    ├── components/
    │   ├── ui/              # 汎用UIコンポーネント (Button, Card, Badge, etc.)
    │   ├── layout/          # レイアウト (Header, Navigation, AppLayout)
    │   ├── dashboard/       # ダッシュボード関連
    │   ├── charts/          # チャート (TimeSeriesChart, ChartControls, etc.)
    │   ├── alerts/          # アラート表示
    │   ├── plant/           # 植物情報
    │   └── mobile/          # モバイル専用レイアウト
    ├── hooks/               # カスタムフック
    │   ├── useApiData.ts
    │   ├── useSensorData.ts
    │   ├── useCachedSensorData.ts
    │   ├── usePlantData.ts
    │   ├── useAlerts.ts
    │   ├── useTabCache.ts
    │   └── useTabPrefetch.ts
    ├── lib/
    │   ├── api/             # API クライアント・エンドポイント定義
    │   ├── services/        # センサー・植物データサービス
    │   ├── utils/           # ユーティリティ (cache, dataTransform, etc.)
    │   └── constants.ts     # アプリ定数・設定
    └── types/               # TypeScript 型定義
```

## ルーティング

React Router (BrowserRouter) によるクライアントサイドルーティング：

| パス       | ページ         |
| ---------- | -------------- |
| `/`        | ダッシュボード |
| `/alerts`  | アラート管理   |
| `/history` | データ履歴     |
| `/plant`   | 植物詳細       |

## テスト

テストファイルは `**/__tests__/**/*.{ts,tsx}` または `**/*.{test,spec}.{ts,tsx}` に配置：

```typescript
// src/components/__tests__/ExampleComponent.test.tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vite-plus/test";
import ExampleComponent from "@/components/ExampleComponent";

test("renders title correctly", () => {
  render(<ExampleComponent title="Test Title">Content</ExampleComponent>);
  expect(screen.getByText("Test Title")).toBeInTheDocument();
});
```

> **注意:** テストユーティリティは `vitest` から直接ではなく `vite-plus/test` からインポートすること。

## トラブルシューティング

| 問題                     | 対処                                                    |
| ------------------------ | ------------------------------------------------------- |
| 型エラー                 | `vp check` で確認                                       |
| スタイルが当たらない     | `globals.css` の Tailwind ディレクティブを確認          |
| API 接続エラー           | `.env.local` の `VITE_API_URL` とバックエンド起動を確認 |
| ページ直接アクセスで 404 | 開発時は `vp dev` のデフォルトで SPA フォールバック有効 |
