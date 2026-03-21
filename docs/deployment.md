# デプロイメントガイド

## 概要

このドキュメントでは、Plant Monitor システムを様々な環境にデプロイする方法について説明します。

## 前提条件

### 共通要件

- Git
- Docker (推奨)
- AWS CLI (AWS デプロイの場合)

### バックエンド要件

- Python 3.12+
- uv (Python パッケージマネージャー)
- AWS アカウント (DynamoDB アクセス用)

### フロントエンド要件

- Node.js 18.0.0+
- Vite+ CLI (`vp`)

## 環境設定

### 環境変数

#### バックエンド (.env)

```env
# AWS設定
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=ap-northeast-1

# DynamoDB設定
DYNAMODB_TABLE_NAME=aggdata_table

# アプリケーション設定
DEFAULT_DATA_TYPE=temperature
DEFAULT_PERIOD_DAYS=7
ENVIRONMENT=production
```

#### フロントエンド (.env.local)

```env
# API設定
VITE_API_URL=https://api.your-domain.com
VITE_ENVIRONMENT=production

# アプリケーション設定
VITE_APP_NAME=Plant Monitor
VITE_APP_VERSION=0.1.0
```

## ローカル開発環境

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd TCS-kanazawa-gw
```

### 2. バックエンドセットアップ

```bash
cd backend
uv sync
cp .env.example .env
# .envファイルを編集
```

### 3. フロントエンドセットアップ

```bash
cd frontend
vp install
cp .env.local.example .env.local
# .env.localファイルを編集
```

### 4. 開発サーバー起動

```bash
# ターミナル1: バックエンド
cd backend
uv run uvicorn app.main:app --reload

# ターミナル2: フロントエンド
cd frontend
vp dev
```

## Docker を使用したデプロイ

### 1. Dockerファイル作成

#### バックエンド Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# uvのインストール
RUN pip install uv

# 依存関係のコピーとインストール
COPY pyproject.toml ./
RUN uv sync --frozen

# アプリケーションコードのコピー
COPY . .

# ポート公開
EXPOSE 8000

# アプリケーション起動
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### フロントエンド Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# vp CLI のインストール
RUN npm install -g vite-plus

# 依存関係のインストール
COPY package.json pnpm-lock.yaml ./
RUN vp install --frozen-lockfile

# アプリケーションのビルド
COPY . .
RUN vp build

# 本番環境用イメージ (nginx で静的ファイルを配信)
FROM nginx:alpine AS runner

# ビルド成果物をコピー
COPY --from=builder /app/dist /usr/share/nginx/html

# SPA フォールバック設定
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files $uri $uri/ /index.html; }\n}\n' \
    > /etc/nginx/conf.d/default.conf

# ポート公開
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose

```yaml
# docker-compose.yml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_REGION=${AWS_REGION}
      - DYNAMODB_TABLE_NAME=${DYNAMODB_TABLE_NAME}
      - ENVIRONMENT=production
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

### 3. 起動

```bash
docker-compose up -d
```

## AWS デプロイ

### 1. AWS Lambda + API Gateway (バックエンド)

#### requirements.txt 作成

```bash
cd backend
uv export --format requirements-txt > requirements.txt
```

#### Lambda ハンドラー作成

```python
# backend/lambda_handler.py
from mangum import Mangum
from app.main import app

handler = Mangum(app)
```

#### デプロイスクリプト

```bash
#!/bin/bash
# backend/deploy-lambda.sh

# パッケージ作成
zip -r deployment.zip . -x "*.git*" "*__pycache__*" "*.pytest_cache*"

# Lambda関数更新
aws lambda update-function-code \
    --function-name plant-monitor-backend \
    --zip-file fileb://deployment.zip

# API Gateway デプロイ
aws apigateway create-deployment \
    --rest-api-id your-api-id \
    --stage-name prod
```

### 2. Vercel (フロントエンド)

#### vercel.json 設定

```json
{
  "framework": "vite",
  "buildCommand": "vp build",
  "devCommand": "vp dev",
  "installCommand": "vp install",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_URL": "@api-url",
    "VITE_ENVIRONMENT": "production"
  }
}
```

#### デプロイ

```bash
cd frontend
vp dlx vercel --prod
```

### 3. AWS Amplify (フロントエンド)

#### amplify.yml 設定

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm install -g vite-plus
        - vp install
    build:
      commands:
        - vp build
  artifacts:
    baseDirectory: dist
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
```

## CI/CD パイプライン

### GitHub Actions

#### バックエンド CI/CD

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on:
  push:
    branches: [main]
    paths: ["backend/**"]
  pull_request:
    branches: [main]
    paths: ["backend/**"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.12"

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: |
          cd backend
          uv sync

      - name: Run tests
        run: |
          cd backend
          uv run pytest

      - name: Run linting
        run: |
          cd backend
          uv run black --check app tests
          uv run isort --check-only app tests
          uv run flake8 app tests

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to AWS Lambda
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd backend
          ./deploy-lambda.sh
```

#### フロントエンド CI/CD

```yaml
# .github/workflows/frontend.yml
name: Frontend CI/CD

on:
  push:
    branches: [main]
    paths: ["frontend/**"]
  pull_request:
    branches: [main]
    paths: ["frontend/**"]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install vp CLI
        run: npm install -g vite-plus

      - name: Install dependencies
        run: |
          cd frontend
          vp install

      - name: Check (format, lint, types)
        run: |
          cd frontend
          vp check

      - name: Run tests
        run: |
          cd frontend
          vp test

      - name: Build
        run: |
          cd frontend
          vp build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend
```

## 監視・ログ

### AWS CloudWatch

#### ログ設定

```python
# backend/app/logging_config.py
import logging
import watchtower

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # CloudWatch Logs ハンドラー
    handler = watchtower.CloudWatchLogsHandler(
        log_group='plant-monitor-backend',
        stream_name='application'
    )

    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
```

#### メトリクス設定

```python
# backend/app/metrics.py
import boto3

cloudwatch = boto3.client('cloudwatch')

def put_metric(metric_name: str, value: float, unit: str = 'Count'):
    cloudwatch.put_metric_data(
        Namespace='PlantMonitor',
        MetricData=[
            {
                'MetricName': metric_name,
                'Value': value,
                'Unit': unit
            }
        ]
    )
```

### Vercel Analytics

```typescript
// frontend/src/lib/analytics.ts
import { Analytics } from '@vercel/analytics/react';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
```

## セキュリティ

### HTTPS設定

#### Let's Encrypt (自己ホスト)

```bash
# SSL証明書取得
sudo certbot --nginx -d your-domain.com

# 自動更新設定
sudo crontab -e
# 以下を追加
0 12 * * * /usr/bin/certbot renew --quiet
```

### セキュリティヘッダー

```python
# backend/app/middleware.py
from fastapi import FastAPI
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware

def add_security_middleware(app: FastAPI):
    # CORS設定
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["https://your-frontend-domain.com"],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )

    # Trusted Host設定
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["your-api-domain.com"]
    )
```

## バックアップ・復旧

### DynamoDB バックアップ

```bash
# ポイントインタイム復旧有効化
aws dynamodb update-continuous-backups \
    --table-name aggdata_table \
    --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true

# オンデマンドバックアップ
aws dynamodb create-backup \
    --table-name aggdata_table \
    --backup-name aggdata_table_backup_$(date +%Y%m%d)
```

### アプリケーションバックアップ

```bash
#!/bin/bash
# scripts/backup.sh

# コードバックアップ
git archive --format=tar.gz --output=backup_$(date +%Y%m%d).tar.gz HEAD

# 設定ファイルバックアップ
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
    backend/.env \
    frontend/.env.local
```

## トラブルシューティング

### よくある問題

#### 1. DynamoDB接続エラー

```bash
# AWS認証情報確認
aws sts get-caller-identity

# DynamoDBテーブル確認
aws dynamodb describe-table --table-name aggdata_table
```

#### 2. CORS エラー

```python
# backend/app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 開発環境
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 3. ビルドエラー

```bash
# 依存関係の再インストール
cd frontend
rm -rf node_modules
vp install

# ビルド
vp build
```

### ログ確認

```bash
# Docker ログ
docker-compose logs -f backend
docker-compose logs -f frontend

# AWS Lambda ログ
aws logs tail /aws/lambda/plant-monitor-backend --follow

# Vercel ログ
vercel logs your-deployment-url
```

## パフォーマンス最適化

### バックエンド最適化

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 接続プール設定
import boto3
from botocore.config import Config

config = Config(
    max_pool_connections=50,
    retries={'max_attempts': 3}
)
dynamodb = boto3.resource('dynamodb', config=config)
```

### フロントエンド最適化

```typescript
// frontend/vite.config.ts
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // チャンク分割
    rolldownOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
});
```

## スケーリング

### 水平スケーリング

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: plant-monitor-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: plant-monitor-backend
  template:
    metadata:
      labels:
        app: plant-monitor-backend
    spec:
      containers:
        - name: backend
          image: plant-monitor-backend:latest
          ports:
            - containerPort: 8000
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

### オートスケーリング

```yaml
# kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: plant-monitor-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: plant-monitor-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```
