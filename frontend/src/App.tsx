import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { FAQListPage, FAQFormPage, FAQDetailPage } from './pages/faqs';
import { TagListPage } from './pages/tags';

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/faqs" replace />} />
        <Route path="/faqs" element={<FAQListPage />} />
        <Route path="/faqs/new" element={<FAQFormPage />} />
        <Route path="/faqs/:id" element={<FAQDetailPage />} />
        <Route path="/faqs/:id/edit" element={<FAQFormPage />} />
        <Route path="/tags" element={<TagListPage />} />
        <Route path="*" element={<Navigate to="/faqs" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
