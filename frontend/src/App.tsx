import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./app/page"));
const AlertsPage = lazy(() => import("./app/alerts/page"));
const HistoryPage = lazy(() => import("./app/history/page"));
const PlantDetailPage = lazy(() => import("./app/plant/page"));

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/plant" element={<PlantDetailPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
