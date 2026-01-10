import { supabase } from './supabase';
import type { UserTemplate, TemplateFilters } from '@/types';

export async function getUserTemplates(filters?: TemplateFilters): Promise<UserTemplate[]> {
  let query = supabase.from('user_templates').select('*');

  if (filters?.publicOnly) {
    query = query.eq('is_public', true);
  }

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  if (filters?.tags?.length) {
    query = query.contains('tags', filters.tags);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createTemplate(template: Omit<UserTemplate, 'id' | 'like_count' | 'created_at'>) {
  const { data, error } = await supabase.from('user_templates').insert(template).select().single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(id: string, updates: Partial<UserTemplate>) {
  const { data, error } = await supabase.from('user_templates').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('user_templates').delete().eq('id', id);
  if (error) throw error;
}