import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntent, useDeleteIntent, useCreateVariant, useDeleteVariant } from '../../hooks/useIntents';
import { Button, TagBadge, ConfirmModal } from '../../components/common';
import styles from './IntentDetailPage.module.css';
export const IntentDetailPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const intentId = Number(id);
    const { data: intent, isLoading, error } = useIntent(intentId);
    const deleteIntent = useDeleteIntent();
    const createVariant = useCreateVariant();
    const deleteVariant = useDeleteVariant();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [newVariant, setNewVariant] = useState('');
    const [deleteVariantId, setDeleteVariantId] = useState(null);
    const handleDelete = async () => {
        try {
            await deleteIntent.mutateAsync(intentId);
            navigate('/intents');
        }
        catch (error) {
            console.error('Delete failed:', error);
        }
    };
    const handleAddVariant = async () => {
        if (!newVariant.trim())
            return;
        try {
            await createVariant.mutateAsync({
                intentId,
                data: { question_text: newVariant.trim(), is_representative: false },
            });
            setNewVariant('');
        }
        catch (error) {
            console.error('Add variant failed:', error);
        }
    };
    const handleDeleteVariant = async () => {
        if (!deleteVariantId)
            return;
        try {
            await deleteVariant.mutateAsync(deleteVariantId);
            setDeleteVariantId(null);
        }
        catch (error) {
            console.error('Delete variant failed:', error);
        }
    };
    if (isLoading) {
        return _jsx("div", { className: styles.loading, children: "\uB85C\uB529 \uC911..." });
    }
    if (error || !intent) {
        return _jsx("div", { className: styles.error, children: "FAQ\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
    }
    return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.header, children: [_jsxs("div", { children: [_jsx("h2", { className: styles.title, children: intent.intent_name }), _jsx("span", { className: styles.intentId, children: intent.intent_id })] }), _jsxs("div", { className: styles.actions, children: [_jsx(Button, { variant: "secondary", onClick: () => navigate('/intents'), children: "\uBAA9\uB85D" }), _jsx(Button, { onClick: () => navigate(`/intents/${id}/edit`), children: "\uC218\uC815" }), _jsx(Button, { variant: "danger", onClick: () => setShowDeleteModal(true), children: "\uC0AD\uC81C" })] })] }), _jsxs("div", { className: styles.content, children: [_jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "\uAE30\uBCF8 \uC815\uBCF4" }), _jsxs("dl", { className: styles.infoList, children: [_jsx("dt", { children: "\uC758\uB3C4 \uC720\uD615" }), _jsx("dd", { children: intent.intent_type || '-' }), _jsx("dt", { children: "\uC0C1\uD0DC" }), _jsx("dd", { children: _jsx("span", { className: `${styles.status} ${intent.is_active ? styles.active : styles.inactive}`, children: intent.is_active ? '활성' : '비활성' }) }), _jsx("dt", { children: "\uD0DC\uADF8" }), _jsx("dd", { children: _jsx("div", { className: styles.tags, children: intent.tags.length > 0 ? (intent.tags.map((tag) => (_jsx(TagBadge, { name: tag.name, color: tag.color }, tag.id)))) : (_jsx("span", { className: styles.empty, children: "-" })) }) }), _jsx("dt", { children: "\uC791\uC131\uC790" }), _jsx("dd", { children: intent.created_by || '-' }), _jsx("dt", { children: "\uC0DD\uC131\uC77C" }), _jsx("dd", { children: new Date(intent.created_at).toLocaleString('ko-KR') }), _jsx("dt", { children: "\uC218\uC815\uC77C" }), _jsx("dd", { children: new Date(intent.updated_at).toLocaleString('ko-KR') })] })] }), _jsxs("div", { className: styles.section, children: [_jsx("h3", { className: styles.sectionTitle, children: "\uC9C8\uC758\uC751\uB2F5" }), _jsxs("div", { className: styles.qaBlock, children: [_jsxs("div", { className: styles.qaItem, children: [_jsx("h4", { children: "\uD654\uBA74 \uD45C\uC2DC\uC6A9 \uC9C8\uC758\uBB38" }), _jsx("p", { children: intent.display_question })] }), _jsxs("div", { className: styles.qaItem, children: [_jsx("h4", { children: "\uB300\uD45C \uC9C8\uC758\uBB38" }), _jsx("p", { children: intent.representative_question })] }), _jsxs("div", { className: styles.qaItem, children: [_jsx("h4", { children: "\uB2F5\uBCC0" }), _jsx("p", { className: styles.answer, children: intent.answer })] }), intent.context && (_jsxs("div", { className: styles.qaItem, children: [_jsx("h4", { children: "\uCEE8\uD14D\uC2A4\uD2B8" }), _jsx("p", { children: intent.context })] }))] })] }), _jsxs("div", { className: styles.section, children: [_jsxs("h3", { className: styles.sectionTitle, children: ["\uBCC0\uD615 \uC9C8\uBB38 (", intent.question_variants.length, ")"] }), _jsxs("div", { className: styles.variantInput, children: [_jsx("input", { type: "text", value: newVariant, onChange: (e) => setNewVariant(e.target.value), placeholder: "\uBCC0\uD615 \uC9C8\uBB38 \uCD94\uAC00", onKeyDown: (e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddVariant();
                                            }
                                        } }), _jsx(Button, { onClick: handleAddVariant, disabled: createVariant.isPending || !newVariant.trim(), children: "\uCD94\uAC00" })] }), intent.question_variants.length > 0 ? (_jsx("ul", { className: styles.variantList, children: intent.question_variants.map((variant) => (_jsxs("li", { children: [_jsxs("span", { children: [variant.question_text, variant.is_representative && (_jsx("span", { className: styles.repBadge, children: "\uB300\uD45C" }))] }), _jsx("button", { className: styles.deleteBtn, onClick: () => setDeleteVariantId(variant.id), children: "\u00D7" })] }, variant.id))) })) : (_jsx("p", { className: styles.emptyVariants, children: "\uB4F1\uB85D\uB41C \uBCC0\uD615 \uC9C8\uBB38\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." }))] })] }), _jsx(ConfirmModal, { isOpen: showDeleteModal, onClose: () => setShowDeleteModal(false), onConfirm: handleDelete, title: "FAQ \uC0AD\uC81C", message: `"${intent.intent_name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`, confirmText: "\uC0AD\uC81C", isLoading: deleteIntent.isPending }), _jsx(ConfirmModal, { isOpen: !!deleteVariantId, onClose: () => setDeleteVariantId(null), onConfirm: handleDeleteVariant, title: "\uBCC0\uD615 \uC9C8\uBB38 \uC0AD\uC81C", message: "\uC774 \uBCC0\uD615 \uC9C8\uBB38\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?", confirmText: "\uC0AD\uC81C", isLoading: deleteVariant.isPending })] }));
};
