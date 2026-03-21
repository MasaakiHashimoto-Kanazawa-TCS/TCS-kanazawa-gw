import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./app/page";
import AlertsPage from "./app/alerts/page";
import HistoryPage from "./app/history/page";
import PlantDetailPage from "./app/plant/page";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/plant" element={<PlantDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
