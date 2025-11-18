import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useIntents, useDeleteIntent } from '../../hooks/useIntents';
import { useTags } from '../../hooks/useTags';
import { Button, SearchInput, Pagination, TagBadge, ConfirmModal } from '../../components/common';
import styles from './IntentListPage.module.css';
export const IntentListPage = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTagId, setSelectedTagId] = useState();
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { data, isLoading, error } = useIntents({
        page,
        page_size: 20,
        search: searchQuery || undefined,
        tag_id: selectedTagId,
    });
    const { data: tags } = useTags(true);
    const deleteIntent = useDeleteIntent();
    const handleSearch = () => {
        setSearchQuery(search);
        setPage(1);
    };
    const handleDelete = async () => {
        if (!deleteTarget)
            return;
        try {
            await deleteIntent.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
        }
        catch (error) {
            console.error('Delete failed:', error);
        }
    };
    if (error) {
        return _jsx("div", { className: styles.error, children: "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
    }
    return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: "FAQ \uAD00\uB9AC" }), _jsx(Button, { onClick: () => navigate('/intents/new'), children: "\uC0C8 FAQ \uB4F1\uB85D" })] }), _jsxs("div", { className: styles.filters, children: [_jsx(SearchInput, { placeholder: "\uC9C8\uBB38, \uB2F5\uBCC0 \uAC80\uC0C9", value: search, onChange: setSearch, onSearch: handleSearch }), _jsxs("select", { className: styles.tagFilter, value: selectedTagId || '', onChange: (e) => {
                            setSelectedTagId(e.target.value ? Number(e.target.value) : undefined);
                            setPage(1);
                        }, children: [_jsx("option", { value: "", children: "\uC804\uCCB4 \uD0DC\uADF8" }), tags?.map((tag) => (_jsx("option", { value: tag.id, children: tag.name }, tag.id)))] })] }), isLoading ? (_jsx("div", { className: styles.loading, children: "\uB85C\uB529 \uC911..." })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: styles.tableContainer, children: _jsxs("table", { className: styles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "ID" }), _jsx("th", { children: "\uC758\uB3C4\uBA85" }), _jsx("th", { children: "\uC9C8\uBB38" }), _jsx("th", { children: "\uD0DC\uADF8" }), _jsx("th", { children: "\uC0C1\uD0DC" }), _jsx("th", { children: "\uC218\uC815\uC77C" }), _jsx("th", { children: "\uC791\uC5C5" })] }) }), _jsx("tbody", { children: data?.items.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: styles.empty, children: "\uB4F1\uB85D\uB41C FAQ\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." }) })) : (data?.items.map((intent) => (_jsxs("tr", { children: [_jsx("td", { children: intent.intent_id }), _jsx("td", { children: _jsx(Link, { to: `/intents/${intent.id}`, className: styles.link, children: intent.intent_name }) }), _jsx("td", { className: styles.question, children: intent.display_question }), _jsx("td", { children: _jsx("div", { className: styles.tags, children: intent.tags.map((tag) => (_jsx(TagBadge, { name: tag.name, color: tag.color }, tag.id))) }) }), _jsx("td", { children: _jsx("span", { className: `${styles.status} ${intent.is_active ? styles.active : styles.inactive}`, children: intent.is_active ? '활성' : '비활성' }) }), _jsx("td", { children: new Date(intent.updated_at).toLocaleDateString('ko-KR') }), _jsx("td", { children: _jsxs("div", { className: styles.actions, children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => navigate(`/intents/${intent.id}/edit`), children: "\uC218\uC815" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setDeleteTarget(intent), children: "\uC0AD\uC81C" })] }) })] }, intent.id)))) })] }) }), data && data.total_pages > 1 && (_jsx(Pagination, { currentPage: page, totalPages: data.total_pages, onPageChange: setPage }))] })), _jsx(ConfirmModal, { isOpen: !!deleteTarget, onClose: () => setDeleteTarget(null), onConfirm: handleDelete, title: "FAQ \uC0AD\uC81C", message: `"${deleteTarget?.intent_name}"을(를) 삭제하시겠습니까?`, confirmText: "\uC0AD\uC81C", isLoading: deleteIntent.isPending })] }));
};
