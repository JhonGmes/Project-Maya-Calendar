
-- Habilita extensão para gerar IDs únicos (UUID)
create extension if not exists "uuid-ossp";

-- 1. Tabela de Perfis
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  name text,
  avatar_url text,
  phone text,
  role text,
  bio text,
  working_hours jsonb default '{"start": "09:00", "end": "18:00"}',
  theme text default 'light',
  notifications boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Empresas (Companies)
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Times (Teams)
create table if not exists public.teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid references auth.users not null,
  company_id uuid references public.companies(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Membros do Time
create table if not exists public.team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid references public.teams on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Eventos (Calendário)
create table if not exists public.events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  color text,
  category text,
  completed boolean default false,
  is_all_day boolean default false,
  description text,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. Tarefas (Tasks)
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  team_id uuid references public.teams(id),
  title text not null,
  completed boolean default false,
  due_date timestamp with time zone,
  priority text,
  description text,
  workflow_data jsonb, -- Armazena a estrutura completa do workflow (Legacy/Simples)
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Notificações
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  message text not null,
  read boolean default false,
  sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 8. Histórico de Produtividade
create table if not exists public.productivity_history (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  score integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 9. Metas Trimestrais
create table if not exists public.quarterly_goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  achieved boolean default false,
  quarter text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 10. Workflows (Professional Structure)
create table if not exists public.workflows (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  owner_id uuid references auth.users not null,
  team_id uuid references public.teams(id),
  status text default 'in_progress',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 11. Workflow Steps
create table if not exists public.workflow_steps (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid references public.workflows(id) on delete cascade,
  title text not null,
  step_order integer not null,
  status text default 'locked', -- locked, available, completed
  responsible_id uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 12. IA Action History (Audit Log)
create table if not exists public.ia_action_history (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid references public.workflows(id), -- Optional link
  action_type text not null,
  confirmed boolean default false,
  details text,
  user_id uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 13. Logs de Workflow (Old table for JSONB tasks - kept for compatibility)
create table if not exists public.workflow_logs (
  id uuid primary key default uuid_generate_v4(),
  workflow_id text not null, 
  step_id text not null,
  user_id uuid references auth.users not null,
  task_id uuid references public.tasks(id) on delete cascade,
  action text not null, 
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar Segurança (RLS)
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;
alter table public.productivity_history enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.companies enable row level security;
alter table public.quarterly_goals enable row level security;
alter table public.workflow_logs enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_steps enable row level security;
alter table public.ia_action_history enable row level security;

-- Policies (Re-run safe)
drop policy if exists "Users can see own profile" on public.profiles;
create policy "Users can see own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Workflows Policies
create policy "Users can see own or team workflows" on public.workflows for select using (
  owner_id = auth.uid() OR
  team_id IN (select team_id from public.team_members where user_id = auth.uid())
);
create policy "Users can insert workflows" on public.workflows for insert with check (auth.uid() = owner_id);
create policy "Users can update own workflows" on public.workflows for update using (auth.uid() = owner_id);

-- Steps Policies
create policy "Users can see steps of visible workflows" on public.workflow_steps for select using (
  workflow_id IN (select id from public.workflows) -- Simplified, relies on Workflow RLS logic if joined
);
create policy "Users can insert steps" on public.workflow_steps for insert with check (
  workflow_id IN (select id from public.workflows where owner_id = auth.uid())
);
