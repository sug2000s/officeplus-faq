import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '../api/client';
export const useTags = (isActive) => {
    return useQuery({
        queryKey: ['tags', { isActive }],
        queryFn: () => tagApi.list(isActive),
    });
};
export const useTag = (id) => {
    return useQuery({
        queryKey: ['tag', id],
        queryFn: () => tagApi.get(id),
        enabled: !!id,
    });
};
export const useCreateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => tagApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
};
export const useUpdateTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => tagApi.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
            queryClient.invalidateQueries({ queryKey: ['tag', id] });
        },
    });
};
export const useDeleteTag = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => tagApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tags'] });
        },
    });
};
