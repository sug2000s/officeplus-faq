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
// Intent API
export const intentApi = {
    list: async (filters = {}) => {
        const { data } = await api.get('/intents', {
            params: filters,
        });
        return data;
    },
    get: async (id) => {
        const { data } = await api.get(`/intents/${id}`);
        return data;
    },
    create: async (intentData) => {
        const { data } = await api.post('/intents', intentData);
        return data;
    },
    update: async (id, intentData) => {
        const { data } = await api.put(`/intents/${id}`, intentData);
        return data;
    },
    delete: async (id) => {
        const { data } = await api.delete(`/intents/${id}`);
        return data;
    },
};
// Question Variant API
export const variantApi = {
    list: async (intentId) => {
        const { data } = await api.get(`/intents/${intentId}/variants`);
        return data;
    },
    create: async (intentId, variantData) => {
        const { data } = await api.post(`/intents/${intentId}/variants`, variantData);
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
