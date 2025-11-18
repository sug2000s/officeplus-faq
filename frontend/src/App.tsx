import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { IntentListPage, IntentFormPage, IntentDetailPage } from './pages/intents';
import { TagListPage } from './pages/tags';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/intents" replace />} />
        <Route path="/intents" element={<IntentListPage />} />
        <Route path="/intents/new" element={<IntentFormPage />} />
        <Route path="/intents/:id" element={<IntentDetailPage />} />
        <Route path="/intents/:id/edit" element={<IntentFormPage />} />
        <Route path="/tags" element={<TagListPage />} />
        <Route path="*" element={<Navigate to="/intents" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
