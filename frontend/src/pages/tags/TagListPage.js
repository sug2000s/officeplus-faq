import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../../hooks/useTags';
import { Button, Modal, ConfirmModal } from '../../components/common';
import styles from './TagListPage.module.css';
const defaultFormData = {
    name: '',
    description: '',
    color: '#108294',
    display_order: 0,
    is_active: true,
};
const colorPresets = [
    '#108294',
    '#26B9D1',
    '#A669F0',
    '#34BC6F',
    '#FFB941',
    '#F7504F',
    '#4B82EF',
    '#FC68D0',
    '#383838',
    '#8F8F8F',
];
export const TagListPage = () => {
    const { data: tags, isLoading, error } = useTags();
    const createTag = useCreateTag();
    const updateTag = useUpdateTag();
    const deleteTag = useDeleteTag();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData] = useState(defaultFormData);
    const handleOpenCreate = () => {
        setEditingTag(null);
        setFormData(defaultFormData);
        setIsModalOpen(true);
    };
    const handleOpenEdit = (tag) => {
        setEditingTag(tag);
        setFormData({
            name: tag.name,
            description: tag.description || '',
            color: tag.color || '#108294',
            display_order: tag.display_order,
            is_active: tag.is_active,
        });
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingTag(null);
        setFormData(defaultFormData);
    };
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox'
                ? e.target.checked
                : type === 'number'
                    ? Number(value)
                    : value,
        }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingTag) {
                const updateData = {
                    name: formData.name,
                    description: formData.description || null,
                    color: formData.color,
                    display_order: formData.display_order,
                    is_active: formData.is_active,
                };
                await updateTag.mutateAsync({ id: editingTag.id, data: updateData });
            }
            else {
                const createData = {
                    name: formData.name,
                    description: formData.description || null,
                    color: formData.color,
                    display_order: formData.display_order,
                    is_active: formData.is_active,
                };
                await createTag.mutateAsync(createData);
            }
            handleCloseModal();
        }
        catch (error) {
            console.error('Save failed:', error);
        }
    };
    const handleDelete = async () => {
        if (!deleteTarget)
            return;
        try {
            await deleteTag.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
        }
        catch (error) {
            console.error('Delete failed:', error);
        }
    };
    if (error) {
        return _jsx("div", { className: styles.error, children: "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." });
    }
    return (_jsxs("div", { className: styles.container, children: [_jsxs("div", { className: styles.header, children: [_jsx("h2", { className: styles.title, children: "\uD0DC\uADF8 \uAD00\uB9AC" }), _jsx(Button, { onClick: handleOpenCreate, children: "\uC0C8 \uD0DC\uADF8 \uB4F1\uB85D" })] }), isLoading ? (_jsx("div", { className: styles.loading, children: "\uB85C\uB529 \uC911..." })) : (_jsx("div", { className: styles.tagGrid, children: tags?.length === 0 ? (_jsx("div", { className: styles.empty, children: "\uB4F1\uB85D\uB41C \uD0DC\uADF8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." })) : (tags?.map((tag) => (_jsxs("div", { className: styles.tagCard, children: [_jsxs("div", { className: styles.tagHeader, children: [_jsx("div", { className: styles.colorDot, style: { backgroundColor: tag.color || '#108294' } }), _jsx("h3", { className: styles.tagName, children: tag.name }), _jsx("span", { className: `${styles.status} ${tag.is_active ? styles.active : styles.inactive}`, children: tag.is_active ? '활성' : '비활성' })] }), tag.description && (_jsx("p", { className: styles.tagDescription, children: tag.description })), _jsxs("div", { className: styles.tagFooter, children: [_jsxs("span", { className: styles.order, children: ["\uC21C\uC11C: ", tag.display_order] }), _jsxs("div", { className: styles.actions, children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleOpenEdit(tag), children: "\uC218\uC815" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => setDeleteTarget(tag), children: "\uC0AD\uC81C" })] })] })] }, tag.id)))) })), _jsx(Modal, { isOpen: isModalOpen, onClose: handleCloseModal, title: editingTag ? '태그 수정' : '새 태그 등록', footer: _jsxs("div", { className: styles.modalFooter, children: [_jsx(Button, { variant: "secondary", onClick: handleCloseModal, children: "\uCDE8\uC18C" }), _jsx(Button, { onClick: handleSubmit, disabled: createTag.isPending || updateTag.isPending || !formData.name.trim(), children: createTag.isPending || updateTag.isPending ? '저장 중...' : '저장' })] }), children: _jsxs("form", { onSubmit: handleSubmit, className: styles.form, children: [_jsxs("div", { className: styles.formGroup, children: [_jsxs("label", { className: styles.label, children: ["\uD0DC\uADF8\uBA85 ", _jsx("span", { className: styles.required, children: "*" })] }), _jsx("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, placeholder: "\uD0DC\uADF8\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694", required: true })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uC124\uBA85" }), _jsx("textarea", { name: "description", value: formData.description, onChange: handleChange, placeholder: "\uD0DC\uADF8 \uC124\uBA85", rows: 3 })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uC0C9\uC0C1" }), _jsxs("div", { className: styles.colorPicker, children: [_jsx("input", { type: "color", name: "color", value: formData.color, onChange: handleChange }), _jsx("div", { className: styles.colorPresets, children: colorPresets.map((color) => (_jsx("button", { type: "button", className: `${styles.colorPreset} ${formData.color === color ? styles.selected : ''}`, style: { backgroundColor: color }, onClick: () => setFormData((prev) => ({ ...prev, color })) }, color))) })] })] }), _jsxs("div", { className: styles.formGroup, children: [_jsx("label", { className: styles.label, children: "\uD45C\uC2DC \uC21C\uC11C" }), _jsx("input", { type: "number", name: "display_order", value: formData.display_order, onChange: handleChange, min: 0 })] }), _jsx("div", { className: styles.formGroup, children: _jsxs("label", { className: styles.checkboxLabel, children: [_jsx("input", { type: "checkbox", name: "is_active", checked: formData.is_active, onChange: handleChange }), "\uD65C\uC131\uD654"] }) })] }) }), _jsx(ConfirmModal, { isOpen: !!deleteTarget, onClose: () => setDeleteTarget(null), onConfirm: handleDelete, title: "\uD0DC\uADF8 \uC0AD\uC81C", message: `"${deleteTarget?.name}" 태그를 삭제하시겠습니까?`, confirmText: "\uC0AD\uC81C", isLoading: deleteTag.isPending })] }));
};
