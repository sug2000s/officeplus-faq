import axios from 'axios';
import type {
  Tag,
  TagCreate,
  TagUpdate,
  FaqListItem,
  FaqDetail,
  FaqCreate,
  FaqUpdate,
  QuestionVariant,
  QuestionVariantCreate,
  PaginatedResponse,
  DeleteResponse,
  FaqFilters,
} from '../types';

const API_BASE_URL = '/p/faq/apis';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tag API
export const tagApi = {
  list: async (isActive?: boolean): Promise<Tag[]> => {
    const params = isActive !== undefined ? { is_active: isActive } : {};
    const { data } = await api.get<Tag[]>('/tags', { params });
    return data;
  },

  get: async (id: number): Promise<Tag> => {
    const { data } = await api.get<Tag>(`/tags/${id}`);
    return data;
  },

  create: async (tagData: TagCreate): Promise<Tag> => {
    const { data } = await api.post<Tag>('/tags', tagData);
    return data;
  },

  update: async (id: number, tagData: TagUpdate): Promise<Tag> => {
    const { data } = await api.put<Tag>(`/tags/${id}`, tagData);
    return data;
  },

  delete: async (id: number): Promise<DeleteResponse> => {
    const { data } = await api.delete<DeleteResponse>(`/tags/${id}`);
    return data;
  },
};

// FAQ API
export const faqApi = {
  list: async (filters: FaqFilters = {}): Promise<PaginatedResponse<FaqListItem>> => {
    const { data } = await api.get<PaginatedResponse<FaqListItem>>('/faqs', {
      params: filters,
    });
    return data;
  },

  get: async (id: number): Promise<FaqDetail> => {
    const { data } = await api.get<FaqDetail>(`/faqs/${id}`);
    return data;
  },

  create: async (faqData: FaqCreate): Promise<FaqDetail> => {
    const { data } = await api.post<FaqDetail>('/faqs', faqData);
    return data;
  },

  update: async (id: number, faqData: FaqUpdate): Promise<FaqDetail> => {
    const { data } = await api.put<FaqDetail>(`/faqs/${id}`, faqData);
    return data;
  },

  delete: async (id: number): Promise<DeleteResponse> => {
    const { data } = await api.delete<DeleteResponse>(`/faqs/${id}`);
    return data;
  },
};

// Question Variant API
export const variantApi = {
  list: async (faqId: number): Promise<QuestionVariant[]> => {
    const { data } = await api.get<QuestionVariant[]>(`/faqs/${faqId}/variants`);
    return data;
  },

  create: async (faqId: number, variantData: QuestionVariantCreate): Promise<QuestionVariant> => {
    const { data } = await api.post<QuestionVariant>(`/faqs/${faqId}/variants`, variantData);
    return data;
  },

  delete: async (variantId: number): Promise<DeleteResponse> => {
    const { data } = await api.delete<DeleteResponse>(`/variants/${variantId}`);
    return data;
  },
};

// Stats API
export const statsApi = {
  overview: async () => {
    const { data } = await api.get('/stats/overview');
    return data;
  },
};

export default api;