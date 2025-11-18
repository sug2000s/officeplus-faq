import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntent, useDeleteIntent, useCreateVariant, useDeleteVariant } from '../../hooks/useIntents';
import { Button, TagBadge, ConfirmModal } from '../../components/common';
import styles from './IntentDetailPage.module.css';

export const IntentDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const intentId = Number(id);

  const { data: intent, isLoading, error } = useIntent(intentId);
  const deleteIntent = useDeleteIntent();
  const createVariant = useCreateVariant();
  const deleteVariant = useDeleteVariant();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newVariant, setNewVariant] = useState('');
  const [deleteVariantId, setDeleteVariantId] = useState<number | null>(null);

  const handleDelete = async () => {
    try {
      await deleteIntent.mutateAsync(intentId);
      navigate('/intents');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAddVariant = async () => {
    if (!newVariant.trim()) return;
    try {
      await createVariant.mutateAsync({
        intentId,
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

  if (error || !intent) {
    return <div className={styles.error}>FAQ를 찾을 수 없습니다.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{intent.intent_name}</h2>
          <span className={styles.intentId}>{intent.intent_id}</span>
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
            <dt>의도 유형</dt>
            <dd>{intent.intent_type || '-'}</dd>
            <dt>상태</dt>
            <dd>
              <span
                className={`${styles.status} ${
                  intent.is_active ? styles.active : styles.inactive
                }`}
              >
                {intent.is_active ? '활성' : '비활성'}
              </span>
            </dd>
            <dt>태그</dt>
            <dd>
              <div className={styles.tags}>
                {intent.tags.length > 0 ? (
                  intent.tags.map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                  ))
                ) : (
                  <span className={styles.empty}>-</span>
                )}
              </div>
            </dd>
            <dt>작성자</dt>
            <dd>{intent.created_by || '-'}</dd>
            <dt>생성일</dt>
            <dd>{new Date(intent.created_at).toLocaleString('ko-KR')}</dd>
            <dt>수정일</dt>
            <dd>{new Date(intent.updated_at).toLocaleString('ko-KR')}</dd>
          </dl>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>질의응답</h3>
          <div className={styles.qaBlock}>
            <div className={styles.qaItem}>
              <h4>화면 표시용 질의문</h4>
              <p>{intent.display_question}</p>
            </div>
            <div className={styles.qaItem}>
              <h4>대표 질의문</h4>
              <p>{intent.representative_question}</p>
            </div>
            <div className={styles.qaItem}>
              <h4>답변</h4>
              <p className={styles.answer}>{intent.answer}</p>
            </div>
            {intent.context && (
              <div className={styles.qaItem}>
                <h4>컨텍스트</h4>
                <p>{intent.context}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            변형 질문 ({intent.question_variants.length})
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
          {intent.question_variants.length > 0 ? (
            <ul className={styles.variantList}>
              {intent.question_variants.map((variant) => (
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
        message={`"${intent.intent_name}"을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        isLoading={deleteIntent.isPending}
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
