# React & Next.js 基礎ガイド

## React の基本概念

### 1. コンポーネントとは

コンポーネントは、UIの一部を表現する再利用可能なコードブロックです。

#### 関数コンポーネント（推奨）
```typescript
// シンプルなコンポーネント
function Welcome() {
  return <h1>こんにちは！</h1>;
}

// プロパティを受け取るコンポーネント
function PlantStatus({ plantName, temperature }) {
  return (
    <div>
      <h2>{plantName}</h2>
      <p>現在の温度: {temperature}°C</p>
    </div>
  );
}

// 使用例
<PlantStatus plantName="バジル" temperature={25} />
```

### 2. JSX（JavaScript XML）

JSXは、JavaScriptの中でHTMLのような記法を使える構文です。

```typescript
// JSXの基本
const element = <h1>Hello, World!</h1>;

// 変数を埋め込む
const name = "植物A";
const element = <h1>Hello, {name}!</h1>;

// 条件分岐
const isHealthy = true;
const status = (
  <div>
    {isHealthy ? (
      <span style={{color: 'green'}}>健康です</span>
    ) : (
      <span style={{color: 'red'}}>注意が必要です</span>
    )}
  </div>
);

// リストの表示
const plants = ['バジル', 'トマト', 'レタス'];
const plantList = (
  <ul>
    {plants.map((plant, index) => (
      <li key={index}>{plant}</li>
    ))}
  </ul>
);
```

### 3. State（状態管理）

Stateは、コンポーネント内で変化するデータを管理します。

```typescript
import { useState } from 'react';

function TemperatureDisplay() {
  // useState: [現在の値, 値を更新する関数] = useState(初期値)
  const [temperature, setTemperature] = useState(20);
  const [isLoading, setIsLoading] = useState(false);

  // ボタンクリック時の処理
  const updateTemperature = async () => {
    setIsLoading(true);
    
    try {
      // APIからデータを取得（例）
      const response = await fetch('/api/temperature');
      const data = await response.json();
      setTemperature(data.temperature);
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>現在の温度: {temperature}°C</h2>
      <button onClick={updateTemperature} disabled={isLoading}>
        {isLoading ? '更新中...' : '温度を更新'}
      </button>
    </div>
  );
}
```

### 4. Effect（副作用）

useEffectは、コンポーネントの外部との相互作用（API呼び出し、タイマーなど）を管理します。

```typescript
import { useState, useEffect } from 'react';

function PlantMonitor() {
  const [plantData, setPlantData] = useState(null);
  const [loading, setLoading] = useState(true);

  // コンポーネントがマウント（表示）された時に実行
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/plants');
        const data = await response.json();
        setPlantData(data);
      } catch (error) {
        console.error('エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // 空の配列 = 初回のみ実行

  // 5秒ごとにデータを更新
  useEffect(() => {
    const interval = setInterval(() => {
      // データ更新処理
      fetchLatestData();
    }, 5000);

    // クリーンアップ関数（コンポーネントが削除される時に実行）
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      <h1>植物監視システム</h1>
      {plantData && (
        <div>
          <p>温度: {plantData.temperature}°C</p>
          <p>湿度: {plantData.humidity}%</p>
        </div>
      )}
    </div>
  );
}
```

### 5. Props（プロパティ）

Propsは、親コンポーネントから子コンポーネントにデータを渡す仕組みです。

```typescript
// 子コンポーネント
interface PlantCardProps {
  name: string;
  temperature: number;
  humidity: number;
  onUpdate: () => void; // 関数もpropsとして渡せる
}

function PlantCard({ name, temperature, humidity, onUpdate }: PlantCardProps) {
  return (
    <div className="border p-4 rounded">
      <h3>{name}</h3>
      <p>温度: {temperature}°C</p>
      <p>湿度: {humidity}%</p>
      <button onClick={onUpdate}>更新</button>
    </div>
  );
}

// 親コンポーネント
function Dashboard() {
  const [plants, setPlants] = useState([
    { id: 1, name: 'バジル', temperature: 25, humidity: 60 },
    { id: 2, name: 'トマト', temperature: 23, humidity: 55 }
  ]);

  const handleUpdate = (plantId: number) => {
    // 更新処理
    console.log(`植物 ${plantId} を更新`);
  };

  return (
    <div>
      <h1>植物ダッシュボード</h1>
      {plants.map(plant => (
        <PlantCard
          key={plant.id}
          name={plant.name}
          temperature={plant.temperature}
          humidity={plant.humidity}
          onUpdate={() => handleUpdate(plant.id)}
        />
      ))}
    </div>
  );
}
```

## Next.js の基本概念

### 1. App Router（ファイルベースルーティング）

Next.js 13以降のApp Routerでは、ファイル構造がそのままURLになります。

```
src/app/
├── page.tsx                 # / (ホームページ)
├── about/
│   └── page.tsx            # /about
├── plants/
│   ├── page.tsx            # /plants (植物一覧)
│   └── [id]/
│       └── page.tsx        # /plants/123 (動的ルート)
└── dashboard/
    ├── page.tsx            # /dashboard
    └── settings/
        └── page.tsx        # /dashboard/settings
```

### 2. レイアウト

layout.tsxは、複数のページで共通のレイアウトを定義します。

```typescript
// src/app/layout.tsx (ルートレイアウト)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <header>
          <nav>
            <a href="/">ホーム</a>
            <a href="/plants">植物一覧</a>
            <a href="/dashboard">ダッシュボード</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer>
          <p>&copy; 2025 植物監視システム</p>
        </footer>
      </body>
    </html>
  );
}

// src/app/dashboard/layout.tsx (ダッシュボード専用レイアウト)
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav>
          <a href="/dashboard">概要</a>
          <a href="/dashboard/plants">植物管理</a>
          <a href="/dashboard/settings">設定</a>
        </nav>
      </aside>
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
```

### 3. ページコンポーネント

各page.tsxファイルがページを定義します。

```typescript
// src/app/page.tsx (ホームページ)
export default function HomePage() {
  return (
    <div>
      <h1>植物監視システム</h1>
      <p>植物の健康状態をリアルタイムで監視します</p>
    </div>
  );
}

// src/app/plants/page.tsx (植物一覧ページ)
import { useState, useEffect } from 'react';

export default function PlantsPage() {
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    // 植物データを取得
    fetch('/api/plants')
      .then(res => res.json())
      .then(data => setPlants(data));
  }, []);

  return (
    <div>
      <h1>植物一覧</h1>
      <div className="grid">
        {plants.map(plant => (
          <div key={plant.id} className="plant-card">
            <h3>{plant.name}</h3>
            <p>温度: {plant.temperature}°C</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// src/app/plants/[id]/page.tsx (動的ルート)
interface PlantDetailPageProps {
  params: { id: string };
}

export default function PlantDetailPage({ params }: PlantDetailPageProps) {
  const [plant, setPlant] = useState(null);

  useEffect(() => {
    // 特定の植物データを取得
    fetch(`/api/plants/${params.id}`)
      .then(res => res.json())
      .then(data => setPlant(data));
  }, [params.id]);

  if (!plant) {
    return <div>読み込み中...</div>;
  }

  return (
    <div>
      <h1>{plant.name}の詳細</h1>
      <p>温度: {plant.temperature}°C</p>
      <p>湿度: {plant.humidity}%</p>
      <p>土壌水分: {plant.soilMoisture}%</p>
    </div>
  );
}
```

### 4. データ取得

Next.jsでは、様々な方法でデータを取得できます。

```typescript
// クライアントサイドでのデータ取得
'use client'; // クライアントコンポーネントであることを明示

import { useState, useEffect } from 'react';

export default function ClientDataPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>読み込み中...</div>;

  return (
    <div>
      <h1>データ表示</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
```

## カスタムフック

再利用可能なロジックをカスタムフックとして抽出できます。

```typescript
// src/hooks/usePlantData.ts
import { useState, useEffect } from 'react';

interface Plant {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
}

export function usePlantData() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/plants');
      if (!response.ok) {
        throw new Error('データ取得に失敗しました');
      }
      const data = await response.json();
      setPlants(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラー');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlants();
  }, []);

  return {
    plants,
    loading,
    error,
    refetch: fetchPlants
  };
}

// 使用例
function PlantList() {
  const { plants, loading, error, refetch } = usePlantData();

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div>
      <button onClick={refetch}>更新</button>
      {plants.map(plant => (
        <div key={plant.id}>
          <h3>{plant.name}</h3>
          <p>温度: {plant.temperature}°C</p>
        </div>
      ))}
    </div>
  );
}
```

## TypeScript の活用

### 型定義の例

```typescript
// src/types/plant.ts
export interface Plant {
  id: string;
  name: string;
  species: string;
  location: string;
  sensors: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    light: number;
  };
  thresholds: {
    temperature: { min: number; max: number };
    humidity: { min: number; max: number };
    soilMoisture: { min: number; max: number };
    light: { min: number; max: number };
  };
  lastUpdated: string;
}

export interface SensorReading {
  timestamp: string;
  value: number;
  sensorType: 'temperature' | 'humidity' | 'soilMoisture' | 'light';
}

export interface Alert {
  id: string;
  plantId: string;
  type: 'warning' | 'error';
  message: string;
  timestamp: string;
  resolved: boolean;
}
```

### コンポーネントでの型使用

```typescript
import { Plant, Alert } from '@/types/plant';

interface PlantDashboardProps {
  plants: Plant[];
  alerts: Alert[];
  onPlantSelect: (plant: Plant) => void;
  onAlertDismiss: (alertId: string) => void;
}

export default function PlantDashboard({
  plants,
  alerts,
  onPlantSelect,
  onAlertDismiss
}: PlantDashboardProps) {
  return (
    <div>
      <h1>植物ダッシュボード</h1>
      
      {/* アラート表示 */}
      {alerts.length > 0 && (
        <div className="alerts">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert alert-${alert.type}`}>
              <p>{alert.message}</p>
              <button onClick={() => onAlertDismiss(alert.id)}>
                閉じる
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 植物一覧 */}
      <div className="plant-grid">
        {plants.map(plant => (
          <div
            key={plant.id}
            className="plant-card"
            onClick={() => onPlantSelect(plant)}
          >
            <h3>{plant.name}</h3>
            <p>種類: {plant.species}</p>
            <p>場所: {plant.location}</p>
            <div className="sensor-readings">
              <span>温度: {plant.sensors.temperature}°C</span>
              <span>湿度: {plant.sensors.humidity}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

この基礎ガイドを参考に、植物監視システムのフロントエンドを段階的に構築していきます。