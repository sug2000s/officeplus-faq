import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFaqs, useDeleteFaq } from '../../hooks/useFaqs';
import { useTags } from '../../hooks/useTags';
import { Button, SearchInput, Pagination, TagBadge, ConfirmModal, MultiSelect } from '../../components/common';
import styles from './FAQListPage.module.css';
export const FAQListPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { data, isLoading, error } = useFaqs({
        page,
        page_size: 20,
        search: searchQuery || undefined,
        tag_ids: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        is_active: selectedStatus,
    });
    const { data: tags } = useTags(true);
    const deleteFaq = useDeleteFaq();
    const handleSearch = () => {
        setSearchQuery(search);
        setPage(1);
    };
    const handleDelete = async () => {
        if (!deleteTarget)
            return;
        try {
            await deleteFaq.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
        }
        catch (error) {
            console.error('Delete failed:', error);
        }
    };
    if (error) {
        return _jsx("div", { className: styles.error, children: "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
    }
    return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: "FAQ \uAD00\uB9AC" }), _jsx(Button, { onClick: () => navigate('/faqs/new'), children: "\uC0C8 FAQ \uB4F1\uB85D" })] }), _jsxs("div", { className: styles.filters, children: [_jsx(SearchInput, { placeholder: "\uC9C8\uBB38, \uB2F5\uBCC0 \uAC80\uC0C9", value: search, onChange: setSearch, onSearch: handleSearch }), _jsx(MultiSelect, { options: tags || [], selectedIds: selectedTagIds, onChange: (ids) => {
                            setSelectedTagIds(ids);
                            setPage(1);
                        }, placeholder: "\uC804\uCCB4 \uD0DC\uADF8", className: styles.tagFilter }), _jsxs("select", { className: styles.statusFilter, value: selectedStatus === undefined ? '' : selectedStatus ? 'true' : 'false', onChange: (e) => {
                            const value = e.target.value;
                            setSelectedStatus(value === '' ? undefined : value === 'true');
                            setPage(1);
                        }, children: [_jsx("option", { value: "", children: "\uC804\uCCB4 \uC0C1\uD0DC" }), _jsx("option", { value: "true", children: "\uD65C\uC131" }), _jsx("option", { value: "false", children: "\uBE44\uD65C\uC131" })] })] }), isLoading ? (_jsx("div", { className: styles.loading, children: "\uB85C\uB529 \uC911..." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.tableContainer, children: _jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "\uC9C8\uBB38" }), _jsx("th", { children: "\uD0DC\uADF8" }), _jsx("th", { children: "\uC0C1\uD0DC" }), _jsx("th", { children: "\uC218\uC815\uC77C" }), _jsx("th", { children: "\uC791\uC5C5" })] }) }), _jsx("tbody", { children: data?.items.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 6, className: styles.empty, children: "\uB4F1\uB85D\uB41C FAQ\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }) })) : (data?.items.map((faq) => (_jsxs("tr", { children: [_jsx("td", { children: faq.id }), _jsx("td", { children: _jsx(Link, { to: `/faqs/${faq.id}`, className: styles.link, children: faq.question }) }), _jsx("td", { children: _jsx("div", { className: styles.tags, children: faq.tags.map((tag) => (_jsx(TagBadge, { name: tag.name, color: tag.color }, tag.id))) }) }), _jsx("td", { children: _jsx("span", { className: `${styles.status} ${faq.is_active ? styles.active : styles.inactive}`, children: faq.is_active ? '활성' : '비활성' }) }), _jsx("td", { children: new Date(faq.updated_at).toLocaleDateString('ko-KR') }), _jsx("td", { children: _jsxs("div", { className: styles.actions, children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/faqs/${faq.id}/edit`), children: "\uC218\uC815" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setDeleteTarget(faq), children: "\uC0AD\uC81C" })] }) })] }, faq.id)))) })] }) }), data && data.total_pages > 1 && (_jsx(Pagination, { currentPage: page, totalPages: data.total_pages, onPageChange: setPage }))] })), _jsx(ConfirmModal, { isOpen: !!deleteTarget, onClose: () => setDeleteTarget(null), onConfirm: handleDelete, title: "FAQ \uC0AD\uC81C", message: `"${deleteTarget?.question}"을(를) 삭제하시겠습니까?`, confirmText: "\uC0AD\uC81C", isLoading: deleteFaq.isPending })] }));
};
