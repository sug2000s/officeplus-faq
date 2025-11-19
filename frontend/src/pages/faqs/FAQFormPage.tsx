import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFaq, useCreateFaq, useUpdateFaq } from '../../hooks/useFaqs';
import { useTags } from '../../hooks/useTags';
import { Button, MultiSelect } from '../../components/common';
import type { FaqCreate, FaqUpdate, QuestionVariantCreate } from '../../types';
import styles from './FAQFormPage.module.css';

export const FAQFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagNames, setNewTagNames] = useState<string[]>([]);
  const [tempTagCounter, setTempTagCounter] = useState(-1);
  const [variants, setVariants] = useState<QuestionVariantCreate[]>([]);
  const [newVariant, setNewVariant] = useState('');

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        is_active: faq.is_active,
      });
      setSelectedTagIds(faq.tags.map((t) => t.id));
      setVariants(
        faq.question_variants.map((v) => ({
          question_text: v.question_text,
          is_representative: v.is_representative,
        }))
      );
    }
  }, [faq]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
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

  const handleRemoveVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateTag = (name: string) => {
    // 이미 존재하는 태그인지 확인
    const existingTag = tags?.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 기존 태그 ID만 필터링 (양수 ID)
    const existingTagIds = selectedTagIds.filter((id) => id > 0);

    try {
      if (isEdit) {
        const updateData: FaqUpdate = {
          question: formData.question,
          answer: formData.answer,
          is_active: formData.is_active,
          tag_ids: existingTagIds,
          new_tag_names: newTagNames,
        };
        await updateFaq.mutateAsync({ id: Number(id), data: updateData });
      } else {
        const createData: FaqCreate = {
          ...formData,
          tag_ids: existingTagIds,
          new_tag_names: newTagNames,
          question_variants: variants,
        };
        await createFaq.mutateAsync(createData);
      }
      navigate('/faqs');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  if (isEdit && faqLoading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{isEdit ? 'FAQ 수정' : '새 FAQ 등록'}</h2>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>
            질문 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="question"
            value={formData.question}
            onChange={handleChange}
            placeholder="질문을 입력하세요"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            답변 <span className={styles.required}>*</span>
          </label>
          <textarea
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            placeholder="답변 내용을 입력하세요"
            required
            rows={6}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>태그</label>
          <MultiSelect
            options={allTagOptions}
            selectedIds={selectedTagIds}
            onChange={setSelectedTagIds}
            placeholder="태그를 선택하세요"
            allowCreate
            onCreateNew={handleCreateTag}
          />
        </div>

        {!isEdit && (
          <div className={styles.formGroup}>
            <label className={styles.label}>변형 질문</label>
            <div className={styles.variantInput}>
              <input
                type="text"
                value={newVariant}
                onChange={(e) => setNewVariant(e.target.value)}
                placeholder="변형 질문 추가"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariant();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddVariant}>
                추가
              </Button>
            </div>
            {variants.length > 0 && (
              <ul className={styles.variantList}>
                {variants.map((v, idx) => (
                  <li key={idx}>
                    <span>{v.question_text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className={styles.removeBtn}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

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

        <div className={styles.buttonGroup}>
          <Button type="button" variant="secondary" onClick={() => navigate('/faqs')}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={createFaq.isPending || updateFaq.isPending}
          >
            {createFaq.isPending || updateFaq.isPending ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  );
};