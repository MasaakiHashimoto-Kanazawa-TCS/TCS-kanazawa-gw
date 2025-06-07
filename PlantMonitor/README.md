# PlantMonitor

PlantMonitorは、AWS DynamoDBに保存されたセンサーデータ（例: 温度、pH）と、AWS S3に保存された関連画像を可視化するFastAPIウェブアプリケーションです。

## 環境構築

1. **仮想環境の作成**
   ```bash
   uv venv
   ```
   - Linux/Mac: `source .venv/bin/activate`
   - Windows: `.\.venv\Scripts\Activate.ps1`

2. **依存パッケージのインストール**
   ```bash
   uv add fastapi uvicorn boto3 plotly jinja2 python-dotenv pytest pytest-mock requests
   uv sync
   ```
   - 依存パッケージは`uv add <パッケージ名>`で追加し、`uv sync`で同期します。

3. **.envファイルの作成**
   `PlantMonitor`ディレクトリで`.env.example`をコピーして`.env`を作成し、必要な値を設定してください。
   ```bash
   cp .env.example .env
   ```
   - 主な設定項目:
     - `AWS_DYNAMODB_TABLE_NAME`: DynamoDBテーブル名（例: `aggdata_table`）
     - `AWS_S3_BUCKET_NAME`: S3バケット名
     - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`: AWS認証情報
     - その他、`DEFAULT_DATA_TYPE`や`DEFAULT_PERIOD_DAYS`など

## 主な機能

- **データ可視化:** DynamoDBから取得した時系列データ（温度、pHなど）をPlotlyグラフで表示
- **データフィルタ:** データ型や期間（日数）でのフィルタリング
- **画像表示:** グラフ上のデータ点をクリックすると、S3バケット内で最も近いタイムスタンプの画像を表示
  - **画像の配置場所:** 画像はS3バケット内の`plant_images/`プレフィックス（フォルダ）配下に配置することを推奨しますが、実際の検索処理（`find_closest_image`メソッド）はデフォルトでプレフィックスを指定していません。必要に応じて`list_images`メソッドの`prefix`引数に`plant_images/`を指定してください。
  - **タイムスタンプの扱い:** 画像のマッチングにはS3オブジェクトの`LastModified`（最終更新日時）を利用しています。ファイル名にタイムスタンプ（`YYYYMMDD_HHMMSS`や`YYYY-MM-DD_HH-MM-SS`形式）を含めることを推奨しますが、現状の実装ではファイル名からの抽出は行っていません。今後、ファイル名ベースのマッチングが必要な場合は`_extract_timestamp_from_key`メソッドを利用してください。
  - **エラーハンドリング:** マッチする画像が見つからない場合やS3アクセスエラー時は、グラフ下部にエラーメッセージを表示します。

## アプリケーションの起動

```bash
uv run run.py
```
- ブラウザで `http://127.0.0.1:8000` にアクセスしてください。

## テスト

- テストは`pytest`で実行します。
- S3レスポンスのモックデータには`LastModified`フィールドを必ず含めてください。
  - 例: `{'Key': 'plant_images/img_20231026_120000.jpg', 'LastModified': datetime(2023, 10, 26, 12, 0, 0)}`
- テスト実行例:
  ```bash
  pytest
  ```
- テスト用の環境変数（`AWS_S3_BUCKET_NAME`や`AWS_DYNAMODB_TABLE_NAME`など）は`.env`またはテストファイル内で設定してください。

---

> **パッケージ管理・環境構築は@about-enviroment.mdcのルールに従ってください。**
