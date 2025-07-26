# Plant Monitor Frontend

植物監視システムのフロントエンド - Next.js + TypeScript + Tailwind CSSで構築されたモダンなWebアプリケーション

## 概要

このフロントエンドは、植物監視システムのユーザーインターフェースを提供します。バックエンドAPIからデータを取得し、美しく直感的なダッシュボードで植物の環境データを表示します。

## 技術スタック

- **Next.js 14**: React フレームワーク (App Router)
- **TypeScript**: 型安全性
- **Tailwind CSS**: ユーティリティファーストCSS
- **React 18**: UIライブラリ

## セットアップ

### 前提条件

- Node.js 18.0.0以上
- npm 8.0.0以上

### インストール

1. 依存関係のインストール:
```bash
cd frontend
npm install
```

2. 環境変数の設定:
```bash
cp .env.local.example .env.local
# .env.localファイルを編集してAPI URLを設定
```

### 環境変数

`.env.local`ファイルに以下の設定が必要です：

```env
# API設定
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_ENVIRONMENT=development

# アプリケーション設定
NEXT_PUBLIC_APP_NAME=Plant Monitor
NEXT_PUBLIC_APP_VERSION=0.1.0

# 開発設定
NEXT_PUBLIC_DEBUG=false
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは `http://localhost:3000` で起動します。

### ビルド

```bash
npm run build
```

### 本番環境での実行

```bash
npm run start
```

## スクリプト

- `npm run dev`: 開発サーバーを起動
- `npm run build`: 本番用ビルドを作成
- `npm run start`: 本番サーバーを起動
- `npm run lint`: ESLintでコードをチェック
- `npm run lint:fix`: ESLintでコードを自動修正
- `npm run type-check`: TypeScriptの型チェック
- `npm run test`: テストを実行
- `npm run test:watch`: テストをウォッチモードで実行
- `npm run test:coverage`: カバレッジレポート付きでテストを実行

## プロジェクト構造

```
frontend/
├── src/
│   ├── app/                 # App Router (Next.js 13+)
│   │   ├── layout.tsx       # ルートレイアウト
│   │   ├── page.tsx         # ホームページ
│   │   └── globals.css      # グローバルスタイル
│   ├── components/          # 再利用可能なコンポーネント
│   ├── lib/                 # ユーティリティ関数
│   ├── hooks/               # カスタムReactフック
│   └── types/               # TypeScript型定義
├── public/                  # 静的アセット
├── __tests__/               # テストファイル
├── package.json             # プロジェクト設定
├── next.config.js           # Next.js設定
├── tailwind.config.js       # Tailwind CSS設定
├── tsconfig.json            # TypeScript設定
├── .env.local.example       # 環境変数テンプレート
└── README.md                # このファイル
```

## 開発ガイドライン

### コンポーネント作成

新しいコンポーネントは`src/components/`ディレクトリに作成してください：

```typescript
// src/components/ExampleComponent.tsx
interface ExampleComponentProps {
  title: string;
  children: React.ReactNode;
}

export default function ExampleComponent({ title, children }: ExampleComponentProps) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}
```

### カスタムフック

再利用可能なロジックは`src/hooks/`ディレクトリにカスタムフックとして作成してください：

```typescript
// src/hooks/useApi.ts
import { useState, useEffect } from 'react';

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API呼び出しロジック
  }, [url]);

  return { data, loading, error };
}
```

### 型定義

TypeScript型は`src/types/`ディレクトリで管理してください：

```typescript
// src/types/api.ts
export interface PlantData {
  id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
}

export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}
```

## スタイリング

### Tailwind CSS

このプロジェクトはTailwind CSSを使用しています。ユーティリティクラスを使用してスタイリングを行ってください：

```tsx
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h1 className="text-2xl font-bold text-gray-800 mb-4">タイトル</h1>
  <p className="text-gray-600">説明文</p>
</div>
```

### カスタムカラー

`tailwind.config.js`でカスタムカラーを定義しています：

- `primary`: #4F46E5 (インディゴ)
- `secondary`: #10B981 (エメラルド)

## テスト

### テストの実行

```bash
npm run test
```

### テストファイルの作成

テストファイルは`__tests__/`ディレクトリまたはコンポーネントと同じディレクトリに`.test.tsx`拡張子で作成してください：

```typescript
// __tests__/ExampleComponent.test.tsx
import { render, screen } from '@testing-library/react';
import ExampleComponent from '@/components/ExampleComponent';

describe('ExampleComponent', () => {
  it('renders title correctly', () => {
    render(<ExampleComponent title="Test Title">Content</ExampleComponent>);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
});
```

## デプロイ

### Vercel (推奨)

1. Vercelアカウントにログイン
2. GitHubリポジトリを接続
3. 環境変数を設定
4. デプロイ

### その他のプラットフォーム

Next.jsは様々なプラットフォームにデプロイできます：
- Netlify
- AWS Amplify
- Docker

## トラブルシューティング

### よくある問題

1. **ビルドエラー**
   - `npm run type-check`でTypeScriptエラーを確認
   - `npm run lint`でESLintエラーを確認

2. **スタイルが適用されない**
   - Tailwind CSSの設定を確認
   - `globals.css`でTailwindディレクティブが正しく読み込まれているか確認

3. **API接続エラー**
   - `.env.local`のAPI URLを確認
   - バックエンドサーバーが起動しているか確認

## 貢献

1. フォークしてブランチを作成
2. 変更を実装
3. テストを実行
4. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。