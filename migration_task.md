# 移行後タスクリスト

Next.js → Vite + React SPA 移行後の残タスク。

---

## コード修正（TypeScript 型エラー）

- [x] `vite-env.d.ts` 作成（`import.meta.env` の型定義が不足）
  - `src/vite-env.d.ts` を新規作成し `ImportMetaEnv` インターフェースを定義
  - 対象変数: `VITE_API_URL`, `VITE_ENVIRONMENT`, `VITE_APP_NAME`, `VITE_APP_VERSION`, `VITE_DEBUG`

- [x] `plantService.ts` の API 呼び出し修正
  - `buildEndpoint(API_ENDPOINTS.PLANT_DETAIL, { id })` → `buildEndpoint.plant(id)` に変更
  - `PLANT_DETAIL` は `API_ENDPOINTS` に存在しない

- [x] `ErrorMessage` の prop 名修正（`message=` → `error=`）
  - `CachedDashboardOverview.tsx:54`
  - `OptimizedDashboardOverview.tsx:96`

- [x] `MetricsGrid` の props 修正（インターフェース不一致）
  - `{ temperatureSummary, phSummary, temperatureLoading, phLoading }` → `{ metrics, thresholds }` 形式に修正
  - `CachedDashboardOverview.tsx:88`
  - `OptimizedDashboardOverview.tsx:138`

- [x] `TimeSeriesChart` の props 修正（古い設計の呼び出しが残っている）
  - `{ data, dataKey, xAxisKey, color, height }` → `{ data, dataType, timeRange, height }` 形式に修正
  - `CachedDashboardOverview.tsx:101,112`
  - `OptimizedDashboardOverview.tsx:151,162`

- [x] recharts `LabelPosition` 型エラー修正
  - `position: "topLeft"` → `position: "insideTopLeft"` に変更
  - `TimeSeriesChart.tsx:89,95`

## スクリプト

- [x] `scripts/start-dev.sh` の修正
- [x] `scripts/start-dev.ps1` の修正
- [x] `scripts/test.sh` の修正
- [x] `scripts/test.ps1` の修正
- [x] `scripts/build.ps1` の修正
- [x] `scripts/setup.sh` の修正
- [x] `scripts/README.md` の修正

## `.gitignore`

- [x] `frontend/.gitignore` の更新
  - `/.next/`, `/out/`, `/build` → `/dist/` に変更
  - `next-env.d.ts` の行を削除

## ドキュメント

- [x] `docs/deployment.md` の更新
  - `NEXT_PUBLIC_*` 環境変数 → `VITE_*` に全置換
  - Dockerfile を Vite + nginx 向けに修正（ビルド出力: `dist/`）
  - Vercel / Amplify 設定を Vite 向けに更新
  - CI/CD を `vp check` / `vp test` / `vp build` に更新

## テスト

- [ ] テストファイルの作成
  - `vite.config.ts` に vitest 設定済みだがテストファイルが1件もない
  - `src/components/__tests__/` または各コンポーネントと同階層に `.test.tsx` を配置
  - テストユーティリティは `vite-plus/test` からインポート

## バックエンド・連携

- [ ] バックエンド JSON API の実装
  - 現状フロントエンドはモックデータで動作中（`IS_DEVELOPMENT = true` 時）
  - 実装が必要なエンドポイント:
    - `GET /api/v1/data` - センサーデータ取得
    - `GET /api/v1/data/latest` - 最新値取得
    - `GET /api/v1/data/summary` - 統計サマリー
    - `GET /api/v1/plants` - 植物一覧
    - `GET /api/v1/plants/{id}` - 植物詳細
  - 参考: `frontend/src/lib/api/README.md` に API 仕様あり
