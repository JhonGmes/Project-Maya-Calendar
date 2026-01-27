
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
  workflow_data jsonb, -- Armazena a estrutura completa do workflow
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

-- 10. Logs de Workflow (Auditoria e Métricas)
create table if not exists public.workflow_logs (
  id uuid primary key default uuid_generate_v4(),
  workflow_id text not null, -- ID dentro do JSONB da task ou ID externo
  step_id text not null,
  user_id uuid references auth.users not null,
  task_id uuid references public.tasks(id) on delete cascade,
  action text not null, -- 'started', 'completed'
  metadata jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar Segurança (RLS) - Seguro rodar várias vezes
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

-- Limpar policies antigas para recriar (evita erro "policy already exists")
drop policy if exists "Users can see own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can see own events" on public.events;
drop policy if exists "Users can insert own events" on public.events;
drop policy if exists "Users can update own events" on public.events;
drop policy if exists "Users can delete own events" on public.events;
drop policy if exists "Users can see own tasks or team tasks" on public.tasks;
drop policy if exists "Users can insert own tasks" on public.tasks;
drop policy if exists "Users can update own tasks" on public.tasks;
drop policy if exists "Users can see own notifications" on public.notifications;
drop policy if exists "Users can insert own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Users can see own history" on public.productivity_history;
drop policy if exists "Users can insert own history" on public.productivity_history;
drop policy if exists "Users can see teams they belong to" on public.teams;
drop policy if exists "Users can see own goals" on public.quarterly_goals;
drop policy if exists "Users can insert own goals" on public.quarterly_goals;
drop policy if exists "Users can see related workflow logs" on public.workflow_logs;
drop policy if exists "Users can insert workflow logs" on public.workflow_logs;

-- Recriar Policies

-- Profiles
create policy "Users can see own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Events
create policy "Users can see own events" on public.events for select using (auth.uid() = user_id);
create policy "Users can insert own events" on public.events for insert with check (auth.uid() = user_id);
create policy "Users can update own events" on public.events for update using (auth.uid() = user_id);
create policy "Users can delete own events" on public.events for delete using (auth.uid() = user_id);

-- Tasks
create policy "Users can see own tasks or team tasks" on public.tasks for select using (
  auth.uid() = user_id OR 
  team_id IN (select team_id from public.team_members where user_id = auth.uid())
);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);

-- Notifications
create policy "Users can see own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Users can insert own notifications" on public.notifications for insert with check (auth.uid() = user_id);
create policy "Users can update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- History
create policy "Users can see own history" on public.productivity_history for select using (auth.uid() = user_id);
create policy "Users can insert own history" on public.productivity_history for insert with check (auth.uid() = user_id);

-- Teams
create policy "Users can see teams they belong to" on public.teams for select using (
  id IN (select team_id from public.team_members where user_id = auth.uid())
);

-- Goals
create policy "Users can see own goals" on public.quarterly_goals for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on public.quarterly_goals for insert with check (auth.uid() = user_id);

-- Workflow Logs
create policy "Users can see related workflow logs" on public.workflow_logs for select using (
  user_id = auth.uid() OR
  task_id IN (select id from public.tasks where team_id IN (select team_id from public.team_members where user_id = auth.uid()))
);
create policy "Users can insert workflow logs" on public.workflow_logs for insert with check (auth.uid() = user_id);
