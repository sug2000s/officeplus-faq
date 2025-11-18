import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '../api/client';
import type { TagCreate, TagUpdate } from '../types';

export const useTags = (isActive?: boolean) => {
  return useQuery({
    queryKey: ['tags', { isActive }],
    queryFn: () => tagApi.list(isActive),
  });
};

export const useTag = (id: number) => {
  return useQuery({
    queryKey: ['tag', id],
    queryFn: () => tagApi.get(id),
    enabled: !!id,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TagCreate) => tagApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TagUpdate }) => tagApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['tag', id] });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => tagApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};
