-- Migration: Add user_templates table for prompt library
-- Run: npx supabase db push

CREATE TABLE IF NOT EXISTS public.user_templates (
  id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id text NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  prompt_json jsonb NOT NULL,
  tags text[],
  is_public boolean DEFAULT false,
  like_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_templates ADD CONSTRAINT user_templates_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_templates_user_id ON public.user_templates USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_templates_public ON public.user_templates USING btree (is_public);

-- RLS
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for public templates" ON public.user_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Enable read/write access for owners" ON public.user_templates
  FOR ALL USING (auth.uid()::text = user_id);