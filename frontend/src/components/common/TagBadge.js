import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './TagBadge.module.css';
export const TagBadge = ({ name, color, onRemove }) => {
    const badgeStyle = color
        ? { backgroundColor: `${color}20`, borderColor: color, color }
        : {};
    return (_jsxs("span", { className: styles.badge, style: badgeStyle, children: [name, onRemove && (_jsx("button", { className: styles.removeBtn, onClick: onRemove, children: "\u00D7" }))] }));
};
