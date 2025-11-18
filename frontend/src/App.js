import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import HomePage from "./pages/HomePage";
import SessionsPage from "./pages/SessionsPage";
import StatusPage from "./pages/StatusPage";
import FAQPage from "./pages/FAQPage";
function App() {
    return (_jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/faq", element: _jsx(FAQPage, {}) }), _jsx(Route, { path: "/sessions", element: _jsx(SessionsPage, {}) }), _jsx(Route, { path: "/status", element: _jsx(StatusPage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }) }));
}
export default App;
