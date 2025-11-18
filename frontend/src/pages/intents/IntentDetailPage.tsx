import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFaq, useDeleteFaq, useCreateVariant, useDeleteVariant } from '../../hooks/useFaqs';
import { Button, TagBadge, ConfirmModal } from '../../components/common';
import styles from './IntentDetailPage.module.css';

export const IntentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const faqId = Number(id);

  const { data: faq, isLoading, error } = useFaq(faqId);
  const deleteFaq = useDeleteFaq();
  const createVariant = useCreateVariant();
  const deleteVariant = useDeleteVariant();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newVariant, setNewVariant] = useState('');
  const [deleteVariantId, setDeleteVariantId] = useState<number | null>(null);

  const handleDelete = async () => {
    try {
      await deleteFaq.mutateAsync(faqId);
      navigate('/intents');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAddVariant = async () => {
    if (!newVariant.trim()) return;
    try {
      await createVariant.mutateAsync({
        faqId,
        data: { question_text: newVariant.trim(), is_representative: false },
      });
      setNewVariant('');
    } catch (error) {
      console.error('Add variant failed:', error);
    }
  };

  const handleDeleteVariant = async () => {
    if (!deleteVariantId) return;
    try {
      await deleteVariant.mutateAsync(deleteVariantId);
      setDeleteVariantId(null);
    } catch (error) {
      console.error('Delete variant failed:', error);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (error || !faq) {
    return <div className={styles.error}>FAQ를 찾을 수 없습니다.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{faq.question}</h2>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => navigate('/intents')}>
            목록
          </Button>
          <Button onClick={() => navigate(`/intents/${id}/edit`)}>수정</Button>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
            삭제
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>기본 정보</h3>
          <dl className={styles.infoList}>
            <dt>상태</dt>
            <dd>
              <span
                className={`${styles.status} ${
                  faq.is_active ? styles.active : styles.inactive
                }`}
              >
                {faq.is_active ? '활성' : '비활성'}
              </span>
            </dd>
            <dt>태그</dt>
            <dd>
              <div className={styles.tags}>
                {faq.tags.length > 0 ? (
                  faq.tags.map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                  ))
                ) : (
                  <span className={styles.empty}>-</span>
                )}
              </div>
            </dd>
            <dt>작성자</dt>
            <dd>{faq.created_by || '-'}</dd>
            <dt>생성일</dt>
            <dd>{new Date(faq.created_at).toLocaleString('ko-KR')}</dd>
            <dt>수정일</dt>
            <dd>{new Date(faq.updated_at).toLocaleString('ko-KR')}</dd>
          </dl>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>답변</h3>
          <div className={styles.qaBlock}>
            <div className={styles.qaItem}>
              <p className={styles.answer}>{faq.answer}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            변형 질문 ({faq.question_variants.length})
          </h3>
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
            <Button
              onClick={handleAddVariant}
              disabled={createVariant.isPending || !newVariant.trim()}
            >
              추가
            </Button>
          </div>
          {faq.question_variants.length > 0 ? (
            <ul className={styles.variantList}>
              {faq.question_variants.map((variant) => (
                <li key={variant.id}>
                  <span>
                    {variant.question_text}
                    {variant.is_representative && (
                      <span className={styles.repBadge}>대표</span>
                    )}
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => setDeleteVariantId(variant.id)}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.emptyVariants}>등록된 변형 질문이 없습니다.</p>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="FAQ 삭제"
        message={`"${faq.question}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        isLoading={deleteFaq.isPending}
      />

      <ConfirmModal
        isOpen={!!deleteVariantId}
        onClose={() => setDeleteVariantId(null)}
        onConfirm={handleDeleteVariant}
        title="변형 질문 삭제"
        message="이 변형 질문을 삭제하시겠습니까?"
        confirmText="삭제"
        isLoading={deleteVariant.isPending}
      />
    </div>
  );
};