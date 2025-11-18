import axios from 'axios';
import type {
  Tag,
  TagCreate,
  TagUpdate,
  IntentListItem,
  IntentDetail,
  IntentCreate,
  IntentUpdate,
  QuestionVariant,
  QuestionVariantCreate,
  PaginatedResponse,
  DeleteResponse,
  IntentFilters,
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

// Intent API
export const intentApi = {
  list: async (filters: IntentFilters = {}): Promise<PaginatedResponse<IntentListItem>> => {
    const { data } = await api.get<PaginatedResponse<IntentListItem>>('/intents', {
      params: filters,
    });
    return data;
  },

  get: async (id: number): Promise<IntentDetail> => {
    const { data } = await api.get<IntentDetail>(`/intents/${id}`);
    return data;
  },

  create: async (intentData: IntentCreate): Promise<IntentDetail> => {
    const { data } = await api.post<IntentDetail>('/intents', intentData);
    return data;
  },

  update: async (id: number, intentData: IntentUpdate): Promise<IntentDetail> => {
    const { data } = await api.put<IntentDetail>(`/intents/${id}`, intentData);
    return data;
  },

  delete: async (id: number): Promise<DeleteResponse> => {
    const { data } = await api.delete<DeleteResponse>(`/intents/${id}`);
    return data;
  },
};

// Question Variant API
export const variantApi = {
  list: async (intentId: number): Promise<QuestionVariant[]> => {
    const { data } = await api.get<QuestionVariant[]>(`/intents/${intentId}/variants`);
    return data;
  },

  create: async (intentId: number, variantData: QuestionVariantCreate): Promise<QuestionVariant> => {
    const { data } = await api.post<QuestionVariant>(`/intents/${intentId}/variants`, variantData);
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
