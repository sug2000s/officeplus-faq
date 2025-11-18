import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import styles from './MainLayout.module.css';
export const MainLayout = ({ children }) => {
    return (_jsxs("div", { className: styles.layout, children: [_jsx(Header, {}), _jsxs("div", { className: styles.container, children: [_jsx(Sidebar, {}), _jsx("main", { className: styles.main, children: _jsx("div", { className: styles.content, children: children }) })] })] }));
};
