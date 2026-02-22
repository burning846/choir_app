-- Enable RLS (Row Level Security)
alter table auth.users enable row level security;

-- 1. Profiles Table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'singer', -- 'singer' or 'conductor'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- 2. Songs Table
create table songs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  composer text,
  pdf_url text, -- Storage URL
  cover_url text, -- Storage URL
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users
);

alter table songs enable row level security;
create policy "Songs are viewable by everyone." on songs for select using (true);
create policy "Only conductors can insert songs." on songs for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'conductor')
);

-- 3. Stems (Audio Tracks) Table
create table stems (
  id uuid default uuid_generate_v4() primary key,
  song_id uuid references songs on delete cascade not null,
  name text not null, -- e.g., "Accompaniment", "Soprano"
  file_url text not null, -- Storage URL
  type text not null, -- 'backing' or 'vocal'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table stems enable row level security;
create policy "Stems are viewable by everyone." on stems for select using (true);
create policy "Only conductors can insert stems." on stems for insert with check (
  exists (select 1 from profiles where id = auth.uid() and role = 'conductor')
);

-- 4. Recordings Table
create table recordings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  song_id uuid references songs not null,
  file_url text not null,
  duration integer, -- in seconds
  
  -- Evaluation Fields
  rating integer check (rating >= 1 and rating <= 5),
  user_notes text,
  conductor_comments text,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table recordings enable row level security;
create policy "Users can view own recordings." on recordings for select using (auth.uid() = user_id);
create policy "Conductors can view all recordings." on recordings for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'conductor')
);
create policy "Users can insert own recordings." on recordings for insert with check (auth.uid() = user_id);
create policy "Conductors can update recordings (add comments)." on recordings for update using (
  exists (select 1 from profiles where id = auth.uid() and role = 'conductor')
);

-- Trigger to create profile on signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Storage Buckets Setup (Execute in SQL Editor or via UI)
-- Bucket: 'sheet-music' (Public)
-- Bucket: 'audio-stems' (Public)
-- Bucket: 'user-recordings' (Private/Authenticated)
