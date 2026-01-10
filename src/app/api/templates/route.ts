import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getUser } from '@/lib/auth';
import { getUserTemplates, createTemplate, updateTemplate, deleteTemplate } from '@/lib/queries';
import type { UserTemplate, TemplateFilters } from '@/types';

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    await getUser(supabase); // Auth check

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const publicOnly = searchParams.get('publicOnly') === 'true';

    const filters: TemplateFilters = { search, publicOnly };
    const templates = await getUserTemplates(filters);

    return NextResponse.json(templates);
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    await getUser(supabase);

    const body = await req.json() as Omit<UserTemplate, 'id' | 'like_count' | 'created_at'>;
    const template = await createTemplate(body);

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}

// TODO: Add PUT/DELETE for /[id] in catch-all route if needed