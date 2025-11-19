import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import styles from './MultiSelect.module.css';
export const MultiSelect = ({ options, selectedIds, onChange, placeholder = '선택하세요', className = '', allowCreate = false, onCreateNew, }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // 포커스를 검색 입력창에
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 0);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);
    const filteredOptions = options.filter((option) => option.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const selectedOptions = options.filter((option) => selectedIds.includes(option.id));
    const handleToggle = (optionId) => {
        if (selectedIds.includes(optionId)) {
            onChange(selectedIds.filter((id) => id !== optionId));
        }
        else {
            onChange([...selectedIds, optionId]);
        }
    };
    const handleRemove = (e, optionId) => {
        e.stopPropagation();
        onChange(selectedIds.filter((id) => id !== optionId));
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (allowCreate && onCreateNew && searchTerm.trim() && filteredOptions.length === 0) {
                onCreateNew(searchTerm.trim());
                setSearchTerm('');
            }
        }
    };
    const displayText = selectedOptions.length === 0
        ? placeholder
        : selectedOptions.length === 1
            ? selectedOptions[0].name
            : `${selectedOptions.length}개 선택됨`;
    return (_jsxs("div", { ref: containerRef, className: `${styles.multiSelect} ${className}`, children: [_jsxs("div", { className: `${styles.selectInput} ${isOpen ? styles.open : ''}`, onClick: () => setIsOpen(!isOpen), children: [_jsx("span", { className: styles.selectText, children: displayText }), _jsx("i", { className: styles.arrow })] }), isOpen && (_jsxs("div", { className: styles.dropdown, children: [_jsxs("div", { className: styles.searchInput, children: [_jsx("i", { className: styles.searchIcon }), _jsx("input", { ref: searchInputRef, type: "text", placeholder: "\uAC80\uC0C9...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), onClick: (e) => e.stopPropagation(), onKeyDown: handleKeyDown })] }), _jsx("ul", { className: styles.optionsList, children: filteredOptions.length === 0 ? (_jsx("li", { className: styles.noData, children: allowCreate && searchTerm.trim()
                                ? `Enter를 눌러 '${searchTerm.trim()}' 추가`
                                : '검색 결과가 없습니다' })) : (filteredOptions.map((option) => {
                            const isSelected = selectedIds.includes(option.id);
                            return (_jsxs("li", { className: `${styles.option} ${isSelected ? styles.selected : ''}`, onClick: () => handleToggle(option.id), children: [_jsxs("label", { className: styles.checkbox, children: [_jsx("input", { type: "checkbox", checked: isSelected, onChange: () => handleToggle(option.id), onClick: (e) => e.stopPropagation() }), _jsx("span", { className: styles.checkmark })] }), _jsx("span", { className: styles.optionText, children: option.name })] }, option.id));
                        })) }), selectedOptions.length > 0 && (_jsxs("div", { className: styles.selectedTags, children: [_jsx("div", { className: styles.selectedTagsLabel, children: "\uC120\uD0DD\uB41C \uD56D\uBAA9:" }), _jsx("div", { className: styles.selectedTagsList, children: selectedOptions.map((option) => (_jsxs("span", { className: styles.selectedTag, children: [option.name, _jsx("button", { type: "button", className: styles.removeBtn, onClick: (e) => handleRemove(e, option.id), children: "\u00D7" })] }, option.id))) })] }))] }))] }));
};
