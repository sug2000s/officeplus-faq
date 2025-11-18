import { jsx as _jsx } from "react/jsx-runtime";
import styles from './Button.module.css';
export const Button = ({ variant = 'primary', size = 'md', children, className = '', disabled, ...props }) => {
    return (_jsx("button", { className: `${styles.button} ${styles[variant]} ${styles[size]} ${className}`, disabled: disabled, ...props, children: children }));
};
