import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import HomePage from './pages/HomePage';
import OperationDeskPage from './pages/OperationDeskPage';
import ReportPage from './pages/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/:sessionId" element={<OperationDeskPage />} />
        <Route path="/report/:sessionId" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

