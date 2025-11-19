// Tag Types
export interface Tag {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TagCreate {
  name: string;
  description?: string | null;
  color?: string | null;
  display_order?: number;
  is_active?: boolean;
}

export interface TagUpdate {
  name?: string;
  description?: string | null;
  color?: string | null;
  display_order?: number;
  is_active?: boolean;
}

// Question Variant Types
export interface QuestionVariant {
  id: number;
  faq_id: number;
  question_text: string;
  is_representative: boolean;
  created_at: string;
}

export interface QuestionVariantCreate {
  question_text: string;
  is_representative?: boolean;
}

// FAQ Types
export interface FaqListItem {
  id: number;
  question: string;
  usage_frequency: number;
  question_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface FaqDetail extends FaqListItem {
  answer: string;
  created_by: string | null;
  updated_by: string | null;
  question_variants: QuestionVariant[];
}

export interface FaqCreate {
  question: string;
  answer: string;
  is_active?: boolean;
  tag_ids?: number[];
  new_tag_names?: string[];
  question_variants?: QuestionVariantCreate[];
}

export interface FaqUpdate {
  question?: string;
  answer?: string;
  is_active?: boolean;
  tag_ids?: number[];
  new_tag_names?: string[];
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// Filter Types
export interface FaqFilters {
  page?: number;
  page_size?: number;
  search?: string;
  tag_ids?: number[];
  is_active?: boolean;
}