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
  intent_id: number;
  question_text: string;
  is_representative: boolean;
  created_at: string;
}

export interface QuestionVariantCreate {
  question_text: string;
  is_representative?: boolean;
}

// Intent Types
export interface IntentListItem {
  id: number;
  intent_id: string;
  intent_type: string | null;
  intent_name: string;
  display_question: string;
  usage_frequency: number;
  question_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface IntentDetail extends IntentListItem {
  representative_question: string;
  answer: string;
  context: string | null;
  created_by: string | null;
  updated_by: string | null;
  question_variants: QuestionVariant[];
}

export interface IntentCreate {
  intent_id: string;
  intent_type?: string | null;
  intent_name: string;
  representative_question: string;
  display_question: string;
  answer: string;
  context?: string | null;
  is_active?: boolean;
  tag_ids?: number[];
  question_variants?: QuestionVariantCreate[];
}

export interface IntentUpdate {
  intent_type?: string | null;
  intent_name?: string;
  representative_question?: string;
  display_question?: string;
  answer?: string;
  context?: string | null;
  is_active?: boolean;
  tag_ids?: number[];
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
export interface IntentFilters {
  page?: number;
  page_size?: number;
  search?: string;
  tag_id?: number;
  is_active?: boolean;
}
