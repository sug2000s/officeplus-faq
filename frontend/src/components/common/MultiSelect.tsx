import React, { useState, useRef, useEffect } from 'react';
import styles from './MultiSelect.module.css';

export interface MultiSelectOption {
  id: number;
  name: string;
  color?: string | null;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedIds: number[];
  onChange: (selectedIds: number[]) => void;
  placeholder?: string;
  className?: string;
  allowCreate?: boolean;
  onCreateNew?: (name: string) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selectedIds,
  onChange,
  placeholder = '선택하세요',
  className = '',
  allowCreate = false,
  onCreateNew,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOptions = options.filter((option) => selectedIds.includes(option.id));

  const handleToggle = (optionId: number) => {
    if (selectedIds.includes(optionId)) {
      onChange(selectedIds.filter((id) => id !== optionId));
    } else {
      onChange([...selectedIds, optionId]);
    }
  };

  const handleRemove = (e: React.MouseEvent, optionId: number) => {
    e.stopPropagation();
    onChange(selectedIds.filter((id) => id !== optionId));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (allowCreate && onCreateNew && searchTerm.trim() && filteredOptions.length === 0) {
        onCreateNew(searchTerm.trim());
        setSearchTerm('');
      }
    }
  };

  const displayText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
      ? selectedOptions[0].name
      : `${selectedOptions.length}개 선택됨`;

  return (
    <div ref={containerRef} className={`${styles.multiSelect} ${className}`}>
      <div
        className={`${styles.selectInput} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.selectText}>{displayText}</span>
        <i className={styles.arrow}></i>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchInput}>
            <i className={styles.searchIcon}></i>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
            />
          </div>
          <ul className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <li className={styles.noData}>
                {allowCreate && searchTerm.trim()
                  ? `Enter를 눌러 '${searchTerm.trim()}' 추가`
                  : '검색 결과가 없습니다'}
              </li>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selectedIds.includes(option.id);
                return (
                  <li
                    key={option.id}
                    className={`${styles.option} ${isSelected ? styles.selected : ''}`}
                    onClick={() => handleToggle(option.id)}
                  >
                    <label className={styles.checkbox}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(option.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className={styles.checkmark}></span>
                    </label>
                    <span className={styles.optionText}>{option.name}</span>
                  </li>
                );
              })
            )}
          </ul>
          {selectedOptions.length > 0 && (
            <div className={styles.selectedTags}>
              <div className={styles.selectedTagsLabel}>선택된 항목:</div>
              <div className={styles.selectedTagsList}>
                {selectedOptions.map((option) => (
                  <span key={option.id} className={styles.selectedTag}>
                    {option.name}
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={(e) => handleRemove(e, option.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

