import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import styles from './Pagination.module.css';
export const Pagination = ({ currentPage, totalPages, onPageChange, }) => {
    if (totalPages <= 1)
        return null;
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        }
        else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
            else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            }
            else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };
    return (_jsxs("div", { className: styles.pagination, children: [_jsx("button", { className: styles.pageBtn, onClick: () => onPageChange(currentPage - 1), disabled: currentPage === 1, children: "\uC774\uC804" }), getPageNumbers().map((page, index) => (typeof page === 'number' ? (_jsx("button", { className: `${styles.pageBtn} ${currentPage === page ? styles.active : ''}`, onClick: () => onPageChange(page), children: page }, index)) : (_jsx("span", { className: styles.ellipsis, children: page }, index)))), _jsx("button", { className: styles.pageBtn, onClick: () => onPageChange(currentPage + 1), disabled: currentPage === totalPages, children: "\uB2E4\uC74C" })] }));
};
