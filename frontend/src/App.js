import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { FAQListPage, FAQFormPage, FAQDetailPage } from './pages/faqs';
import { TagListPage } from './pages/tags';
function App() {
    return (_jsx(MainLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/faqs", replace: true }) }), _jsx(Route, { path: "/faqs", element: _jsx(FAQListPage, {}) }), _jsx(Route, { path: "/faqs/new", element: _jsx(FAQFormPage, {}) }), _jsx(Route, { path: "/faqs/:id", element: _jsx(FAQDetailPage, {}) }), _jsx(Route, { path: "/faqs/:id/edit", element: _jsx(FAQFormPage, {}) }), _jsx(Route, { path: "/tags", element: _jsx(TagListPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/faqs", replace: true }) })] }) }));
}
export default App;
