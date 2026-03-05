import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CryptoPage from './pages/CryptoPage';
import PhotoAnalyzerPage from './pages/PhotoAnalyzerPage';
import FileAnalyzerPage from './pages/FileAnalyzerPage';
import WebAnalyzerPage from './pages/WebAnalyzerPage';
import ComingSoonPage from './pages/ComingSoonPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="crypto" element={<CryptoPage />} />
        <Route path="photo" element={<PhotoAnalyzerPage />} />
        <Route path="file" element={<FileAnalyzerPage />} />
        <Route path="web" element={<WebAnalyzerPage />} />
        <Route path="drive" element={<ComingSoonPage type="drive" />} />
        <Route path="pcap" element={<ComingSoonPage type="pcap" />} />
      </Route>
    </Routes>
  );
}

export default App;
