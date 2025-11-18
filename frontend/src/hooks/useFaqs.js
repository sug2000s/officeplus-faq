import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faqApi, variantApi } from '../api/client';
export const useFaqs = (filters = {}) => {
    return useQuery({
        queryKey: ['faqs', filters],
        queryFn: () => faqApi.list(filters),
    });
};
export const useFaq = (id) => {
    return useQuery({
        queryKey: ['faq', id],
        queryFn: () => faqApi.get(id),
        enabled: !!id,
    });
};
export const useCreateFaq = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => faqApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
        },
    });
};
export const useUpdateFaq = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => faqApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
            queryClient.invalidateQueries({ queryKey: ['faq', id] });
        },
    });
};
export const useDeleteFaq = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => faqApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
        },
    });
};
// Question Variant hooks
export const useVariants = (faqId) => {
    return useQuery({
        queryKey: ['variants', faqId],
        queryFn: () => variantApi.list(faqId),
        enabled: !!faqId,
    });
};
export const useCreateVariant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ faqId, data }) => variantApi.create(faqId, data),
        onSuccess: (_, { faqId }) => {
            queryClient.invalidateQueries({ queryKey: ['variants', faqId] });
            queryClient.invalidateQueries({ queryKey: ['faq', faqId] });
        },
    });
};
export const useDeleteVariant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variantId) => variantApi.delete(variantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['variants'] });
            queryClient.invalidateQueries({ queryKey: ['faqs'] });
        },
    });
};
