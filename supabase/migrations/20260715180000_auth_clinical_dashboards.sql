create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('doctor', 'patient')),
  display_name text not null,
  patient_id uuid unique references public.patients(id) on delete cascade,
  provider_id uuid unique references public.providers(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((role = 'patient' and patient_id is not null and provider_id is null) or (role = 'doctor' and provider_id is not null and patient_id is null))
);

alter table public.patients
  add column priority text not null default 'media' check (priority in ('baja', 'media', 'alta')),
  add column care_status text not null default 'En seguimiento' check (care_status in ('En seguimiento', 'En atención', 'Pendiente de revisión')),
  add column updated_at timestamptz not null default now();

create table public.patient_assignments (
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (patient_id, provider_id)
);

create index patient_assignments_provider_idx on public.patient_assignments(provider_id);
create index patients_priority_idx on public.patients(priority, updated_at desc);

alter table public.profiles enable row level security;
alter table public.patient_assignments enable row level security;

revoke all on table public.profiles, public.patient_assignments from anon, authenticated;
grant all on table public.profiles, public.patient_assignments to service_role;
