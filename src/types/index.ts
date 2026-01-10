export interface BuildPrompt {
  idea: string;
  output: any;
}

export interface Project {
  id: string;
  // ... existing
}

export interface UserTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  prompt_json: any;
  tags: string[];
  is_public: boolean;
  like_count: number;
  created_at: string;
}

export type TemplateFilters = {
  search?: string;
  tags?: string[];
  publicOnly?: boolean;
};