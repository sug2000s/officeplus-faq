import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './SearchInput.module.css';
export const SearchInput = ({ placeholder = '검색어를 입력하세요', value, onChange, onSearch, }) => {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && onSearch) {
            onSearch();
        }
    };
    return (_jsxs("div", { className: styles.searchInput, children: [_jsx("input", { type: "text", placeholder: placeholder, value: value, onChange: (e) => onChange(e.target.value), onKeyDown: handleKeyDown }), _jsx("button", { className: styles.searchBtn, onClick: onSearch, children: _jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", children: _jsx("path", { d: "M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16ZM19 19l-4.35-4.35", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) }) })] }));
};
