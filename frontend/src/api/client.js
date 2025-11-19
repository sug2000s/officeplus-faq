import axios from 'axios';
const API_BASE_URL = '/p/faq/apis';
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Tag API
export const tagApi = {
    list: async (isActive) => {
        const params = isActive !== undefined ? { is_active: isActive } : {};
        const { data } = await api.get('/tags', { params });
        return data;
    },
    get: async (id) => {
        const { data } = await api.get(`/tags/${id}`);
        return data;
    },
    create: async (tagData) => {
        const { data } = await api.post('/tags', tagData);
        return data;
    },
    update: async (id, tagData) => {
        const { data } = await api.put(`/tags/${id}`, tagData);
        return data;
    },
    delete: async (id) => {
        const { data } = await api.delete(`/tags/${id}`);
        return data;
    },
};
// FAQ API
export const faqApi = {
    list: async (filters = {}) => {
        const { tag_ids, ...restFilters } = filters;
        const params = { ...restFilters };
        if (tag_ids && tag_ids.length > 0) {
            params.tag_ids = tag_ids.join(',');
        }
        const { data } = await api.get('/faqs', {
            params,
        });
        return data;
    },
    get: async (id) => {
        const { data } = await api.get(`/faqs/${id}`);
        return data;
    },
    create: async (faqData) => {
        const { data } = await api.post('/faqs', faqData);
        return data;
    },
    update: async (id, faqData) => {
        const { data } = await api.put(`/faqs/${id}`, faqData);
        return data;
    },
    delete: async (id) => {
        const { data } = await api.delete(`/faqs/${id}`);
        return data;
    },
};
// Question Variant API
export const variantApi = {
    list: async (faqId) => {
        const { data } = await api.get(`/faqs/${faqId}/variants`);
        return data;
    },
    create: async (faqId, variantData) => {
        const { data } = await api.post(`/faqs/${faqId}/variants`, variantData);
        return data;
    },
    delete: async (variantId) => {
        const { data } = await api.delete(`/variants/${variantId}`);
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
