import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faqApi, variantApi } from '../api/client';
import type { FaqFilters, FaqCreate, FaqUpdate, QuestionVariantCreate } from '../types';

export const useFaqs = (filters: FaqFilters = {}) => {
  return useQuery({
    queryKey: ['faqs', filters],
    queryFn: () => faqApi.list(filters),
  });
};

export const useFaq = (id: number) => {
  return useQuery({
    queryKey: ['faq', id],
    queryFn: () => faqApi.get(id),
    enabled: !!id,
  });
};

export const useCreateFaq = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FaqCreate) => faqApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
};

export const useUpdateFaq = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FaqUpdate }) => faqApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      queryClient.invalidateQueries({ queryKey: ['faq', id] });
    },
  });
};

export const useDeleteFaq = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => faqApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
};

// Question Variant hooks
export const useVariants = (faqId: number) => {
  return useQuery({
    queryKey: ['variants', faqId],
    queryFn: () => variantApi.list(faqId),
    enabled: !!faqId,
  });
};

export const useCreateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ faqId, data }: { faqId: number; data: QuestionVariantCreate }) =>
      variantApi.create(faqId, data),
    onSuccess: (_, { faqId }) => {
      queryClient.invalidateQueries({ queryKey: ['variants', faqId] });
      queryClient.invalidateQueries({ queryKey: ['faq', faqId] });
    },
  });
};

export const useDeleteVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variantId: number) => variantApi.delete(variantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
};