import React, { useState } from 'react';
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

  if (error) {
    return <div className={styles.error}>데이터를 불러오는데 실패했습니다.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>태그 관리</h2>
        <Button onClick={handleOpenCreate}>새 태그 등록</Button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <div className={styles.tagGrid}>
          {tags?.length === 0 ? (
            <div className={styles.empty}>등록된 태그가 없습니다.</div>
          ) : (
            tags?.map((tag) => (
              <div key={tag.id} className={styles.tagCard}>
                <div className={styles.tagHeader}>
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
                </div>
                {tag.description && (
                  <p className={styles.tagDescription}>{tag.description}</p>
                )}
                <div className={styles.tagFooter}>
                  <span className={styles.order}>순서: {tag.display_order}</span>
                  <div className={styles.actions}>
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(tag)}>
                      수정
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(tag)}>
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            ))
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
