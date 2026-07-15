-- Datos operativos para demo. No ingresar pacientes ni profesionales reales.
create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id),
  name text not null,
  address_label text,
  unique (clinic_id, name)
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations(id),
  name text not null,
  unique (location_id, name)
);

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  specialty_id uuid not null references public.specialties(id),
  location_id uuid not null references public.locations(id),
  is_active boolean not null default true,
  unique (display_name, location_id)
);

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  demo_code text not null unique,
  display_name text not null,
  is_demo boolean not null default true,
  created_at timestamptz not null default now(),
  check (is_demo = true)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id),
  provider_id uuid not null references public.providers(id),
  room_id uuid references public.rooms(id),
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'checked_in', 'completed', 'cancelled')),
  reason text
);

alter table public.consultations
  add column patient_id uuid references public.patients(id),
  add column clinic_id uuid references public.clinics(id),
  add column location_id uuid references public.locations(id),
  add column room_id uuid references public.rooms(id),
  add column specialty_id uuid references public.specialties(id),
  add column provider_id uuid references public.providers(id),
  add column appointment_id uuid references public.appointments(id),
  add column context_snapshot jsonb not null default '{}'::jsonb;

create table public.escalations (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null unique references public.consultations(id) on delete cascade,
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'assigned', 'resolved')),
  assigned_provider_id uuid references public.providers(id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index consultations_patient_created_idx on public.consultations(patient_id, created_at desc);
create index escalations_status_created_idx on public.escalations(status, created_at desc);

alter table public.clinics enable row level security;
alter table public.locations enable row level security;
alter table public.rooms enable row level security;
alter table public.specialties enable row level security;
alter table public.providers enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.escalations enable row level security;

revoke all on table public.clinics, public.locations, public.rooms, public.specialties, public.providers, public.patients, public.appointments, public.escalations from anon, authenticated;
grant all on table public.clinics, public.locations, public.rooms, public.specialties, public.providers, public.patients, public.appointments, public.escalations to service_role;

insert into public.clinics (name) values ('Clínica Manta Demo') on conflict (name) do nothing;
insert into public.locations (clinic_id, name, address_label)
select id, 'Sede Centro', 'Manta · entorno de demostración' from public.clinics where name = 'Clínica Manta Demo'
on conflict (clinic_id, name) do nothing;
insert into public.rooms (location_id, name)
select id, 'Sala de triaje 01' from public.locations where name = 'Sede Centro'
on conflict (location_id, name) do nothing;
insert into public.specialties (name) values ('Medicina familiar'), ('Medicina interna') on conflict (name) do nothing;
insert into public.providers (display_name, specialty_id, location_id)
select 'Dra. Rivera (demo)', s.id, l.id from public.specialties s cross join public.locations l where s.name = 'Medicina familiar' and l.name = 'Sede Centro'
on conflict (display_name, location_id) do nothing;
insert into public.patients (demo_code, display_name) values ('P-DEMO-001', 'Paciente de demostración') on conflict (demo_code) do nothing;
