-- Create Profiles Table
create table public.profiles (
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

-- Create Events Table
create table public.events (
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

-- Create Tasks Table
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users not null,
  title text not null,
  completed boolean default false,
  due_date timestamp with time zone,
  priority text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.tasks enable row level security;

-- Policies (Simplified for demo)
create policy "Users can see own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can see own events" on public.events for select using (auth.uid() = user_id);
create policy "Users can insert own events" on public.events for insert with check (auth.uid() = user_id);
create policy "Users can update own events" on public.events for update using (auth.uid() = user_id);
create policy "Users can delete own events" on public.events for delete using (auth.uid() = user_id);

create policy "Users can see own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);