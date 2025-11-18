import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Button } from './Button';
import styles from './Modal.module.css';
export const Modal = ({ isOpen, onClose, title, children, footer, }) => {
    if (!isOpen)
        return null;
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.overlay, onClick: onClose }), _jsxs("div", { className: styles.modal, children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: title }), _jsx("button", { className: styles.closeBtn, onClick: onClose, children: "\u00D7" })] }), _jsx("div", { className: styles.content, children: children }), footer && _jsx("div", { className: styles.footer, children: footer })] })] }));
};
export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = '확인', cancelText = '취소', isLoading = false, }) => {
    return (_jsx(Modal, { isOpen: isOpen, onClose: onClose, title: title, footer: _jsxs("div", { className: styles.confirmFooter, children: [_jsx(Button, { variant: "secondary", onClick: onClose, disabled: isLoading, children: cancelText }), _jsx(Button, { variant: "danger", onClick: onConfirm, disabled: isLoading, children: isLoading ? '처리 중...' : confirmText })] }), children: _jsx("p", { className: styles.message, children: message }) }));
};
