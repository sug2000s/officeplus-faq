import React, { useState, useRef, useEffect } from 'react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../../hooks/useTags';
import { Button, Modal, ConfirmModal } from '../../components/common';
import type { Tag, TagCreate, TagUpdate } from '../../types';
import styles from './TagListPage.module.css';

interface TagFormData {
  name: string;
  description: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

interface EditingState {
  id: number;
  name: string;
  color: string;
  is_active: boolean;
}

const defaultFormData: TagFormData = {
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

export const TagListPage: React.FC = () => {
  const { data: tags, isLoading, error } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [formData, setFormData] = useState<TagFormData>(defaultFormData);

  // 검색 및 인라인 편집 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [inlineEditing, setInlineEditing] = useState<EditingState | null>(null);
  const [showColorPicker, setShowColorPicker] = useState<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // 필터링된 태그 목록
  const filteredTags = tags?.filter((tag) =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 외부 클릭 시 컬러피커 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(null);
      }
    };

    if (showColorPicker !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // 인라인 편집 자동 저장 ref
  const cardRef = useRef<HTMLDivElement>(null);
  const inlineEditingRef = useRef<EditingState | null>(null);

  // inlineEditing 상태를 ref에 동기화
  useEffect(() => {
    inlineEditingRef.current = inlineEditing;
  }, [inlineEditing]);

  // 외부 클릭 시 자동 저장
  useEffect(() => {
    const handleClickOutside = async (event: MouseEvent) => {
      const currentEditing = inlineEditingRef.current;
      if (currentEditing && cardRef.current && !cardRef.current.contains(event.target as Node)) {
        // 자동 저장
        if (currentEditing.name.trim()) {
          try {
            const updateData: TagUpdate = {
              name: currentEditing.name,
              color: currentEditing.color,
              is_active: currentEditing.is_active,
            };
            await updateTag.mutateAsync({ id: currentEditing.id, data: updateData });
          } catch (error) {
            console.error('Update failed:', error);
          }
        }
        setInlineEditing(null);
        setShowColorPicker(null);
      }
    };

    if (inlineEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [inlineEditing?.id, updateTag]);

  // 인라인 편집 시작 시 포커스
  useEffect(() => {
    if (inlineEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [inlineEditing]);

  const handleOpenCreate = () => {
    setEditingTag(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag) => {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : type === 'number'
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingTag) {
        const updateData: TagUpdate = {
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
          display_order: formData.display_order,
          is_active: formData.is_active,
        };
        await updateTag.mutateAsync({ id: editingTag.id, data: updateData });
      } else {
        const createData: TagCreate = {
          name: formData.name,
          description: formData.description || null,
          color: formData.color,
          display_order: formData.display_order,
          is_active: formData.is_active,
        };
        await createTag.mutateAsync(createData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTag.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // 인라인 편집 시작
  const handleStartInlineEdit = (tag: Tag) => {
    setInlineEditing({
      id: tag.id,
      name: tag.name,
      color: tag.color || '#108294',
      is_active: tag.is_active,
    });
  };

  // 키보드 이벤트 처리 (Enter로 저장)
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inlineEditing && inlineEditing.name.trim()) {
        try {
          const updateData: TagUpdate = {
            name: inlineEditing.name,
            color: inlineEditing.color,
            is_active: inlineEditing.is_active,
          };
          await updateTag.mutateAsync({ id: inlineEditing.id, data: updateData });
          setInlineEditing(null);
          setShowColorPicker(null);
        } catch (error) {
          console.error('Update failed:', error);
        }
      }
    } else if (e.key === 'Escape') {
      setInlineEditing(null);
      setShowColorPicker(null);
    }
  };

  // 활성화 토글
  const handleToggleActive = () => {
    if (!inlineEditing) return;
    setInlineEditing({
      ...inlineEditing,
      is_active: !inlineEditing.is_active,
    });
  };

  // 색상 선택
  const handleSelectColor = (color: string) => {
    if (!inlineEditing) return;
    setInlineEditing({
      ...inlineEditing,
      color,
    });
    setShowColorPicker(null);
  };

  if (error) {
    return <div className={styles.error}>데이터를 불러오는데 실패했습니다.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>태그 관리</h2>
          <div className={styles.searchInput}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="태그 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleOpenCreate}>새 태그 등록</Button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <div className={styles.tagGrid}>
          {filteredTags?.length === 0 ? (
            <div className={styles.empty}>
              {searchTerm ? '검색 결과가 없습니다.' : '등록된 태그가 없습니다.'}
            </div>
          ) : (
            filteredTags?.map((tag) => {
              const isEditing = inlineEditing?.id === tag.id;

              return (
                <div
                  key={tag.id}
                  ref={isEditing ? cardRef : null}
                  className={`${styles.tagCard} ${isEditing ? styles.editing : ''}`}
                  onClick={() => !isEditing && handleStartInlineEdit(tag)}
                >
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(tag);
                    }}
                  >
                    ×
                  </button>
                  <div className={styles.tagHeader}>
                    {isEditing ? (
                      <>
                        <div style={{ position: 'relative' }}>
                          <div
                            className={styles.colorDot}
                            style={{ backgroundColor: inlineEditing.color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowColorPicker(showColorPicker === tag.id ? null : tag.id);
                            }}
                          />
                          {showColorPicker === tag.id && (
                            <div
                              ref={colorPickerRef}
                              className={styles.colorPickerPopup}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className={styles.colorPresets}>
                                {colorPresets.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`${styles.colorPreset} ${
                                      inlineEditing.color === color ? styles.selected : ''
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => handleSelectColor(color)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <input
                          ref={editInputRef}
                          type="text"
                          className={styles.tagNameInput}
                          value={inlineEditing.name}
                          onChange={(e) =>
                            setInlineEditing({ ...inlineEditing, name: e.target.value })
                          }
                          onKeyDown={handleKeyDown}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span
                          className={`${styles.status} ${
                            inlineEditing.is_active ? styles.active : styles.inactive
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive();
                          }}
                        >
                          {inlineEditing.is_active ? '활성' : '비활성'}
                        </span>
                      </>
                    ) : (
                      <>
                        <div
                          className={styles.colorDot}
                          style={{ backgroundColor: tag.color || '#108294' }}
                        />
                        <h3 className={styles.tagName}>{tag.name}</h3>
                        <span
                          className={`${styles.status} ${
                            tag.is_active ? styles.active : styles.inactive
                          }`}
                        >
                          {tag.is_active ? '활성' : '비활성'}
                        </span>
                      </>
                    )}
                  </div>
                  {tag.description && !isEditing && (
                    <p className={styles.tagDescription} title={tag.description}>
                      {tag.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTag ? '태그 수정' : '새 태그 등록'}
        footer={
          <div className={styles.modalFooter}>
            <Button variant="secondary" onClick={handleCloseModal}>
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTag.isPending || updateTag.isPending || !formData.name.trim()}
            >
              {createTag.isPending || updateTag.isPending ? '저장 중...' : '저장'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              태그명 <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="태그명을 입력하세요"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="태그 설명"
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>색상</label>
            <div className={styles.colorPicker}>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
              <div className={styles.colorPresets}>
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`${styles.colorPreset} ${
                      formData.color === color ? styles.selected : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>표시 순서</label>
            <input
              type="number"
              name="display_order"
              value={formData.display_order}
              onChange={handleChange}
              min={0}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              활성화
            </label>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="태그 삭제"
        message={`"${deleteTarget?.name}" 태그를 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteTag.isPending}
      />
    </div>
  );
};
