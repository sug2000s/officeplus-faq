import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntent, useCreateIntent, useUpdateIntent } from '../../hooks/useIntents';
import { useTags } from '../../hooks/useTags';
import { Button, TagBadge } from '../../components/common';
import styles from './IntentFormPage.module.css';
export const IntentFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    const { data: intent, isLoading: intentLoading } = useIntent(Number(id));
    const { data: tags } = useTags(true);
    const createIntent = useCreateIntent();
    const updateIntent = useUpdateIntent();
    const [formData, setFormData] = useState({
        intent_id: '',
        intent_name: '',
        intent_type: '질의응답',
        representative_question: '',
        display_question: '',
        answer: '',
        context: '',
        is_active: true,
    });
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [variants, setVariants] = useState([]);
    const [newVariant, setNewVariant] = useState('');
    useEffect(() => {
        if (intent) {
            setFormData({
                intent_id: intent.intent_id,
                intent_name: intent.intent_name,
                intent_type: intent.intent_type || '질의응답',
                representative_question: intent.representative_question,
                display_question: intent.display_question,
                answer: intent.answer,
                context: intent.context || '',
                is_active: intent.is_active,
            });
            setSelectedTagIds(intent.tags.map((t) => t.id));
            setVariants(intent.question_variants.map((v) => ({
                question_text: v.question_text,
                is_representative: v.is_representative,
            })));
        }
    }, [intent]);
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? e.target.checked : value,
        }));
    };
    const handleTagToggle = (tagId) => {
        setSelectedTagIds((prev) => prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]);
    };
    const handleAddVariant = () => {
        if (newVariant.trim()) {
            setVariants((prev) => [
                ...prev,
                { question_text: newVariant.trim(), is_representative: false },
            ]);
            setNewVariant('');
        }
    };
    const handleRemoveVariant = (index) => {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                const updateData = {
                    intent_name: formData.intent_name,
                    intent_type: formData.intent_type,
                    representative_question: formData.representative_question,
                    display_question: formData.display_question,
                    answer: formData.answer,
                    context: formData.context || null,
                    is_active: formData.is_active,
                    tag_ids: selectedTagIds,
                };
                await updateIntent.mutateAsync({ id: Number(id), data: updateData });
            }
            else {
                const createData = {
                    ...formData,
                    context: formData.context || null,
                    tag_ids: selectedTagIds,
                    question_variants: variants,
                };
                await createIntent.mutateAsync(createData);
            }
            navigate('/intents');
        }
        catch (error) {
            console.error('Save failed:', error);
        }
    };
    if (isEdit && intentLoading) {
        return _jsx("div", { className: styles.loading, children: "\uB85C\uB529 \uC911..." });
    }
    return (_jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.header, children: _jsx("h2", { className: styles.title, children: isEdit ? 'FAQ 수정' : '새 FAQ 등록' }) }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { className: styles.label, children: ["\uC758\uB3C4 ID ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("input", { type: "text", name: "intent_id", value: formData.intent_id, onChange: handleChange, placeholder: "\uC608: INT001", required: true, disabled: isEdit })] }), _jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { className: styles.label, children: ["\uC758\uB3C4\uBA85 ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("input", { type: "text", name: "intent_name", value: formData.intent_name, onChange: handleChange, placeholder: "\uC758\uB3C4\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694", required: true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uC758\uB3C4 \uC720\uD615" }), _jsxs("select", { name: "intent_type", value: formData.intent_type, onChange: handleChange, children: [_jsx("option", { value: "\uC9C8\uC758\uC751\uB2F5", children: "\uC9C8\uC758\uC751\uB2F5" }), _jsx("option", { value: "\uC548\uB0B4", children: "\uC548\uB0B4" }), _jsx("option", { value: "\uBB38\uC758", children: "\uBB38\uC758" })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { className: styles.label, children: ["\uB300\uD45C \uC9C8\uC758\uBB38 ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("textarea", { name: "representative_question", value: formData.representative_question, onChange: handleChange, placeholder: "\uB300\uD45C \uC9C8\uC758\uBB38\uC744 \uC785\uB825\uD558\uC138\uC694", required: true, rows: 3 })] }), _jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { className: styles.label, children: ["\uD654\uBA74 \uD45C\uC2DC\uC6A9 \uC9C8\uC758\uBB38 ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("input", { type: "text", name: "display_question", value: formData.display_question, onChange: handleChange, placeholder: "\uD654\uBA74\uC5D0 \uD45C\uC2DC\uB420 \uC9C8\uC758\uBB38", required: true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { className: styles.label, children: ["\uB2F5\uBCC0 ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("textarea", { name: "answer", value: formData.answer, onChange: handleChange, placeholder: "\uB2F5\uBCC0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uC138\uC694", required: true, rows: 6 })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uCEE8\uD14D\uC2A4\uD2B8" }), _jsx("input", { type: "text", name: "context", value: formData.context, onChange: handleChange, placeholder: "\uCD94\uAC00 \uD0DC\uADF8/\uD0A4\uC6CC\uB4DC" })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uD0DC\uADF8" }), _jsx("div", { className: styles.tagList, children: tags?.map((tag) => (_jsxs("label", { className: styles.tagCheckbox, children: [_jsx("input", { type: "checkbox", checked: selectedTagIds.includes(tag.id), onChange: () => handleTagToggle(tag.id) }), _jsx(TagBadge, { name: tag.name, color: tag.color })] }, tag.id))) })] }), !isEdit && (_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uBCC0\uD615 \uC9C8\uBB38" }), _jsxs("div", { className: styles.variantInput, children: [_jsx("input", { type: "text", value: newVariant, onChange: (e) => setNewVariant(e.target.value), placeholder: "\uBCC0\uD615 \uC9C8\uBB38 \uCD94\uAC00", onKeyDown: (e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddVariant();
                                            }
                                        } }), _jsx(Button, { type: "button", variant: "secondary", onClick: handleAddVariant, children: "\uCD94\uAC00" })] }), variants.length > 0 && (_jsx("ul", { className: styles.variantList, children: variants.map((v, idx) => (_jsxs("li", { children: [_jsx("span", { children: v.question_text }), _jsx("button", { type: "button", onClick: () => handleRemoveVariant(idx), className: styles.removeBtn, children: "\u00D7" })] }, idx))) }))] })), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", name: "is_active", checked: formData.is_active, onChange: handleChange }), "\uD65C\uC131\uD654"] }) }), _jsxs("div", { className: styles.buttonGroup, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate('/intents'), children: "\uCDE8\uC18C" }), _jsx(Button, { type: "submit", disabled: createIntent.isPending || updateIntent.isPending, children: createIntent.isPending || updateIntent.isPending ? '저장 중...' : '저장' })] })] })] }));
};
