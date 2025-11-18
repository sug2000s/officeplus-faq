import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout';
import { IntentListPage, IntentFormPage, IntentDetailPage } from './pages/intents';
import { TagListPage } from './pages/tags';
function App() {
    return (_jsx(MainLayout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/intents", replace: true }) }), _jsx(Route, { path: "/intents", element: _jsx(IntentListPage, {}) }), _jsx(Route, { path: "/intents/new", element: _jsx(IntentFormPage, {}) }), _jsx(Route, { path: "/intents/:id", element: _jsx(IntentDetailPage, {}) }), _jsx(Route, { path: "/intents/:id/edit", element: _jsx(IntentFormPage, {}) }), _jsx(Route, { path: "/tags", element: _jsx(TagListPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/intents", replace: true }) })] }) }));
}
export default App;
