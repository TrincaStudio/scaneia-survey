create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  company_name text not null,
  source text default 'scaneia-survey',
  status text default 'new',
  created_at timestamp with time zone default now()
);

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  answers jsonb not null,
  diagnosis jsonb,
  created_at timestamp with time zone default now()
);
