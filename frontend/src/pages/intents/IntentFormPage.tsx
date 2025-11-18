import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntent, useCreateIntent, useUpdateIntent } from '../../hooks/useIntents';
import { useTags } from '../../hooks/useTags';
import { Button, TagBadge } from '../../components/common';
import type { IntentCreate, IntentUpdate, QuestionVariantCreate } from '../../types';
import styles from './IntentFormPage.module.css';

export const IntentFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
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

  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [variants, setVariants] = useState<QuestionVariantCreate[]>([]);
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
      setVariants(
        intent.question_variants.map((v) => ({
          question_text: v.question_text,
          is_representative: v.is_representative,
        }))
      );
    }
  }, [intent]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleTagToggle = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEdit) {
        const updateData: IntentUpdate = {
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
      } else {
        const createData: IntentCreate = {
          ...formData,
          context: formData.context || null,
          tag_ids: selectedTagIds,
          question_variants: variants,
        };
        await createIntent.mutateAsync(createData);
      }
      navigate('/intents');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  if (isEdit && intentLoading) {
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
            의도 ID <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="intent_id"
            value={formData.intent_id}
            onChange={handleChange}
            placeholder="예: INT001"
            required
            disabled={isEdit}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            의도명 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="intent_name"
            value={formData.intent_name}
            onChange={handleChange}
            placeholder="의도명을 입력하세요"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>의도 유형</label>
          <select name="intent_type" value={formData.intent_type} onChange={handleChange}>
            <option value="질의응답">질의응답</option>
            <option value="안내">안내</option>
            <option value="문의">문의</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            대표 질의문 <span className={styles.required}>*</span>
          </label>
          <textarea
            name="representative_question"
            value={formData.representative_question}
            onChange={handleChange}
            placeholder="대표 질의문을 입력하세요"
            required
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>
            화면 표시용 질의문 <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            name="display_question"
            value={formData.display_question}
            onChange={handleChange}
            placeholder="화면에 표시될 질의문"
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
          <label className={styles.label}>컨텍스트</label>
          <input
            type="text"
            name="context"
            value={formData.context}
            onChange={handleChange}
            placeholder="추가 태그/키워드"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>태그</label>
          <div className={styles.tagList}>
            {tags?.map((tag) => (
              <label key={tag.id} className={styles.tagCheckbox}>
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => handleTagToggle(tag.id)}
                />
                <TagBadge name={tag.name} color={tag.color} />
              </label>
            ))}
          </div>
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
          <Button type="button" variant="secondary" onClick={() => navigate('/intents')}>
            취소
          </Button>
          <Button
            type="submit"
            disabled={createIntent.isPending || updateIntent.isPending}
          >
            {createIntent.isPending || updateIntent.isPending ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  );
};
