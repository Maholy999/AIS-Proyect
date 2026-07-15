create extension if not exists vector with schema extensions;

create table public.medical_chunks (
  id uuid primary key default gen_random_uuid(),
  source_title text not null,
  source_url text not null check (source_url like 'https://%'),
  page_number integer,
  content text not null check (char_length(content) >= 40),
  embedding extensions.vector(1536) not null,
  created_at timestamptz not null default now()
);

create index medical_chunks_embedding_idx on public.medical_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 10);

create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  category text not null check (category in ('síntomas', 'medicamentos', 'citas', 'resultados')),
  urgency text not null check (urgency in ('baja', 'media', 'alta')),
  status text not null check (status in ('answered', 'escalated')),
  escalation_reason text,
  created_at timestamptz not null default now()
);

alter table public.medical_chunks enable row level security;
alter table public.consultations enable row level security;

create or replace function public.match_medical_chunks(query_embedding extensions.vector(1536), match_threshold float, match_count int)
returns table(source_title text, source_url text, page_number integer, content text, similarity float)
language sql stable security definer set search_path = public, extensions
as $$
  select source_title, source_url, page_number, content, 1 - (embedding <=> query_embedding) as similarity
  from public.medical_chunks
  where 1 - (embedding <=> query_embedding) >= match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

revoke all on table public.medical_chunks, public.consultations from anon, authenticated;
revoke all on function public.match_medical_chunks(extensions.vector(1536), float, int) from public, anon, authenticated;
grant all on table public.medical_chunks, public.consultations to service_role;
grant execute on function public.match_medical_chunks(extensions.vector(1536), float, int) to service_role;
