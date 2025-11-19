import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFaq, useCreateFaq, useUpdateFaq } from '../../hooks/useFaqs';
import { useTags } from '../../hooks/useTags';
import { Button, MultiSelect } from '../../components/common';
import styles from './FAQFormPage.module.css';
export const FAQFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    const { data: faq, isLoading: faqLoading } = useFaq(Number(id));
    const { data: tags } = useTags(true);
    const createFaq = useCreateFaq();
    const updateFaq = useUpdateFaq();
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        is_active: true,
    });
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [newTagNames, setNewTagNames] = useState([]);
    const [tempTagCounter, setTempTagCounter] = useState(-1);
    const [variants, setVariants] = useState([]);
    const [newVariant, setNewVariant] = useState('');
    useEffect(() => {
        if (faq) {
            setFormData({
                question: faq.question,
                answer: faq.answer,
                is_active: faq.is_active,
            });
            setSelectedTagIds(faq.tags.map((t) => t.id));
            setVariants(faq.question_variants.map((v) => ({
                question_text: v.question_text,
                is_representative: v.is_representative,
            })));
        }
    }, [faq]);
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? e.target.checked : value,
        }));
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
    const handleCreateTag = (name) => {
        // 이미 존재하는 태그인지 확인
        const existingTag = tags?.find((t) => t.name.toLowerCase() === name.toLowerCase());
        if (existingTag) {
            if (!selectedTagIds.includes(existingTag.id)) {
                setSelectedTagIds((prev) => [...prev, existingTag.id]);
            }
            return;
        }
        // 이미 추가된 임시 태그인지 확인
        if (newTagNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
            return;
        }
        // 임시 태그 추가
        setNewTagNames((prev) => [...prev, name]);
        setSelectedTagIds((prev) => [...prev, tempTagCounter]);
        setTempTagCounter((prev) => prev - 1);
    };
    // 임시 태그를 포함한 전체 옵션 목록
    const allTagOptions = [
        ...(tags || []),
        ...newTagNames.map((name, index) => ({
            id: -1 - index,
            name,
            color: null,
        })),
    ];
    const handleSubmit = async (e) => {
        e.preventDefault();
        // 기존 태그 ID만 필터링 (양수 ID)
        const existingTagIds = selectedTagIds.filter((id) => id > 0);
        try {
            if (isEdit) {
                const updateData = {
                    question: formData.question,
                    answer: formData.answer,
                    is_active: formData.is_active,
                    tag_ids: existingTagIds,
                    new_tag_names: newTagNames,
                };
                await updateFaq.mutateAsync({ id: Number(id), data: updateData });
            }
            else {
                const createData = {
                    ...formData,
                    tag_ids: existingTagIds,
                    new_tag_names: newTagNames,
                    question_variants: variants,
                };
                await createFaq.mutateAsync(createData);
            }
            navigate('/faqs');
        }
        catch (error) {
            console.error('Save failed:', error);
        }
    };
    if (isEdit && faqLoading) {
        return _jsx("div", { className: styles.loading, children: "\uB85C\uB529 \uC911..." });
    }
    return (_jsxs("div", { className: styles.container, children: [_jsx("div", { className: styles.header, children: _jsx("h2", { className: styles.title, children: isEdit ? 'FAQ 수정' : '새 FAQ 등록' }) }), _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { className: styles.label, children: ["\uC9C8\uBB38 ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("input", { type: "text", name: "question", value: formData.question, onChange: handleChange, placeholder: "\uC9C8\uBB38\uC744 \uC785\uB825\uD558\uC138\uC694", required: true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { className: styles.label, children: ["\uB2F5\uBCC0 ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("textarea", { name: "answer", value: formData.answer, onChange: handleChange, placeholder: "\uB2F5\uBCC0 \uB0B4\uC6A9\uC744 \uC785\uB825\uD558\uC138\uC694", required: true, rows: 6 })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uD0DC\uADF8" }), _jsx(MultiSelect, { options: allTagOptions, selectedIds: selectedTagIds, onChange: setSelectedTagIds, placeholder: "\uD0DC\uADF8\uB97C \uC120\uD0DD\uD558\uC138\uC694", allowCreate: true, onCreateNew: handleCreateTag })] }), !isEdit && (_jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uBCC0\uD615 \uC9C8\uBB38" }), _jsxs("div", { className: styles.variantInput, children: [_jsx("input", { type: "text", value: newVariant, onChange: (e) => setNewVariant(e.target.value), placeholder: "\uBCC0\uD615 \uC9C8\uBB38 \uCD94\uAC00", onKeyDown: (e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddVariant();
                                            }
                                        } }), _jsx(Button, { type: "button", variant: "secondary", onClick: handleAddVariant, children: "\uCD94\uAC00" })] }), variants.length > 0 && (_jsx("ul", { className: styles.variantList, children: variants.map((v, idx) => (_jsxs("li", { children: [_jsx("span", { children: v.question_text }), _jsx("button", { type: "button", onClick: () => handleRemoveVariant(idx), className: styles.removeBtn, children: "\u00D7" })] }, idx))) }))] })), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", name: "is_active", checked: formData.is_active, onChange: handleChange }), "\uD65C\uC131\uD654"] }) }), _jsxs("div", { className: styles.buttonGroup, children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => navigate('/faqs'), children: "\uCDE8\uC18C" }), _jsx(Button, { type: "submit", disabled: createFaq.isPending || updateFaq.isPending, children: createFaq.isPending || updateFaq.isPending ? '저장 중...' : '저장' })] })] })] }));
};
