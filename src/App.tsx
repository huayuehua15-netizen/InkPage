import { HashRouter, Route, Routes } from 'react-router-dom';
import { LibraryPage } from './pages/LibraryPage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { useNativeBackButton } from './hooks/useNativeBackButton';
import { useNativeFileOpen } from './hooks/useNativeFileOpen';

function AppRoutes() {
  useNativeBackButton();
  useNativeFileOpen((msg) => window.alert(msg));
  return (
    <Routes>
      <Route path="/" element={<LibraryPage />} />
      <Route path="/read/:id" element={<ReaderPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
