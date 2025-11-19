import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
import styles from './Header.module.css';
export const Header = () => {
    return (_jsx("header", { className: styles.header, children: _jsx("div", { className: styles.inner, children: _jsx(Link, { to: "/", className: styles.logo, children: _jsx("h1", { children: "FAQ \uAD00\uB9AC \uC2DC\uC2A4\uD15C" }) }) }) }));
};
