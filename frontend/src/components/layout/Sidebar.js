import { jsx as _jsx } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
const navItems = [
    { path: '/intents', label: 'FAQ 관리' },
    { path: '/tags', label: '태그 관리' },
];
export const Sidebar = () => {
    return (_jsx("aside", { className: styles.sidebar, children: _jsx("nav", { className: styles.nav, children: _jsx("ul", { className: styles.navList, children: navItems.map((item) => (_jsx("li", { children: _jsx(NavLink, { to: item.path, className: ({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`, children: item.label }) }, item.path))) }) }) }));
};
