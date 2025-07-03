-- Migration: Create profiles table
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table profiles enable row level security;

-- Policy: Users can manage their own profile
create policy "Users can manage own profile" on profiles
  for all
  using (auth.uid() = id); 