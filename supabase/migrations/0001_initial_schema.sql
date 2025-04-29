-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create a table for user profiles
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade not null primary key,
    email text unique not null,
    full_name text,
    avatar_url text,
    is_demo boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create RLS policies
alter table public.profiles enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'profiles' 
        and policyname = 'Public profiles are viewable by everyone'
    ) then
        create policy "Public profiles are viewable by everyone"
            on profiles for select
            using ( true );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'profiles' 
        and policyname = 'Users can insert their own profile'
    ) then
        create policy "Users can insert their own profile"
            on profiles for insert
            with check ( auth.uid() = id );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'profiles' 
        and policyname = 'Users can update own profile'
    ) then
        create policy "Users can update own profile"
            on profiles for update
            using ( auth.uid() = id );
    end if;
end $$;

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, is_demo)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'name', new.email),
        coalesce((new.raw_user_meta_data->>'is_demo')::boolean, false)
    );
    return new;
end;
$$;

-- Trigger to automatically create profile for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Create a table for user settings
create table if not exists public.user_settings (
    user_id uuid references auth.users on delete cascade not null primary key,
    theme text default 'light',
    notifications_enabled boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS for user settings
alter table public.user_settings enable row level security;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'user_settings' 
        and policyname = 'Users can view own settings'
    ) then
        create policy "Users can view own settings"
            on user_settings for select
            using ( auth.uid() = user_id );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'user_settings' 
        and policyname = 'Users can update own settings'
    ) then
        create policy "Users can update own settings"
            on user_settings for update
            using ( auth.uid() = user_id );
    end if;
end $$;

do $$
begin
    if not exists (
        select 1 from pg_policies 
        where schemaname = 'public' 
        and tablename = 'user_settings' 
        and policyname = 'Users can insert own settings'
    ) then
        create policy "Users can insert own settings"
            on user_settings for insert
            with check ( auth.uid() = user_id );
    end if;
end $$;

-- Function to handle user settings creation
create or replace function public.handle_new_user_settings()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.user_settings (user_id)
    values (new.id);
    return new;
end;
$$;

-- Trigger to automatically create settings for new users
drop trigger if exists on_auth_user_created_settings on auth.users;
create trigger on_auth_user_created_settings
    after insert on auth.users
    for each row execute procedure public.handle_new_user_settings();

-- Update function for updated_at timestamp
create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- Add updated_at triggers
drop trigger if exists update_profiles_updated_at on profiles;
create trigger update_profiles_updated_at
    before update on profiles
    for each row execute procedure update_updated_at_column();

drop trigger if exists update_user_settings_updated_at on user_settings;
create trigger update_user_settings_updated_at
    before update on user_settings
    for each row execute procedure update_updated_at_column(); 