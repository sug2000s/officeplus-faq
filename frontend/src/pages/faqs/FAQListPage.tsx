import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFaqs, useDeleteFaq } from '../../hooks/useFaqs';
import { useTags } from '../../hooks/useTags';
import { Button, SearchInput, Pagination, TagBadge, ConfirmModal } from '../../components/common';
import type { FaqListItem } from '../../types';
import styles from './FAQListPage.module.css';

export const FAQListPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<boolean | undefined>(true);
  const [deleteTarget, setDeleteTarget] = useState<FaqListItem | null>(null);

  const { data, isLoading, error } = useFaqs({
    page,
    page_size: 20,
    search: searchQuery || undefined,
    tag_id: selectedTagId,
    is_active: selectedStatus,
  });

  const { data: tags } = useTags(true);
  const deleteFaq = useDeleteFaq();

  const handleSearch = () => {
    setSearchQuery(search);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteFaq.mutateAsync(deleteTarget.id);
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
        <h2 className={styles.title}>FAQ 관리</h2>
        <Button onClick={() => navigate('/faqs/new')}>새 FAQ 등록</Button>
      </div>

      <div className={styles.filters}>
        <SearchInput
          placeholder="질문, 답변 검색"
          value={search}
          onChange={setSearch}
          onSearch={handleSearch}
        />
        <select
          className={styles.tagFilter}
          value={selectedTagId || ''}
          onChange={(e) => {
            setSelectedTagId(e.target.value ? Number(e.target.value) : undefined);
            setPage(1);
          }}
        >
          <option value="">전체 태그</option>
          {tags?.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>
        <select
          className={styles.tagFilter}
          value={selectedStatus === undefined ? '' : selectedStatus ? 'true' : 'false'}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedStatus(value === '' ? undefined : value === 'true');
            setPage(1);
          }}
        >
          <option value="">전체 상태</option>
          <option value="true">활성</option>
          <option value="false">비활성</option>
        </select>
      </div>

      {isLoading ? (
        <div className={styles.loading}>로딩 중...</div>
      ) : (
        <>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>질문</th>
                  <th>태그</th>
                  <th>상태</th>
                  <th>수정일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.empty}>
                      등록된 FAQ가 없습니다.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((faq) => (
                    <tr key={faq.id}>
                      <td>{faq.id}</td>
                      <td>
                        <Link to={`/faqs/${faq.id}`} className={styles.link}>
                          {faq.question}
                        </Link>
                      </td>
                      <td>
                        <div className={styles.tags}>
                          {faq.tags.map((tag) => (
                            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.status} ${
                            faq.is_active ? styles.active : styles.inactive
                          }`}
                        >
                          {faq.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td>{new Date(faq.updated_at).toLocaleDateString('ko-KR')}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/faqs/${faq.id}/edit`)}
                          >
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget(faq)}
                          >
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.total_pages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={data.total_pages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="FAQ 삭제"
        message={`"${deleteTarget?.question}"을(를) 삭제하시겠습니까?`}
        confirmText="삭제"
        isLoading={deleteFaq.isPending}
      />
    </div>
  );
};