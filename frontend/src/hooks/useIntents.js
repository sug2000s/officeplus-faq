import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { intentApi, variantApi } from '../api/client';
export const useIntents = (filters = {}) => {
    return useQuery({
        queryKey: ['intents', filters],
        queryFn: () => intentApi.list(filters),
    });
};
export const useIntent = (id) => {
    return useQuery({
        queryKey: ['intent', id],
        queryFn: () => intentApi.get(id),
        enabled: !!id,
    });
};
export const useCreateIntent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => intentApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['intents'] });
        },
    });
};
export const useUpdateIntent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => intentApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['intents'] });
            queryClient.invalidateQueries({ queryKey: ['intent', id] });
        },
    });
};
export const useDeleteIntent = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => intentApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['intents'] });
        },
    });
};
// Question Variant hooks
export const useVariants = (intentId) => {
    return useQuery({
        queryKey: ['variants', intentId],
        queryFn: () => variantApi.list(intentId),
        enabled: !!intentId,
    });
};
export const useCreateVariant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ intentId, data }) => variantApi.create(intentId, data),
        onSuccess: (_, { intentId }) => {
            queryClient.invalidateQueries({ queryKey: ['variants', intentId] });
            queryClient.invalidateQueries({ queryKey: ['intent', intentId] });
        },
    });
};
export const useDeleteVariant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (variantId) => variantApi.delete(variantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['variants'] });
            queryClient.invalidateQueries({ queryKey: ['intents'] });
        },
    });
};
