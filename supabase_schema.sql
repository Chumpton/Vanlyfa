-- Supabase Database Schema for Vanlyfa
-- This file defines the tables, relationships, and Row Level Security (RLS) policies
-- required to run Vanlyfa with a Supabase backend.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. Profiles Table
-- ==========================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  handle text unique not null,
  avatar text, -- Will store avatar key (e.g. 'avatar_bob') or a public URL to an uploaded file in Supabase Storage
  bio text,
  rig text,
  solar text,
  power text,
  water text,
  gallery text[] default '{}'::text[], -- Array of image URLs
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" 
  on public.profiles for select 
  using (true);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- ==========================================
-- 2. Spots Table (Vouched Campsites/Locations)
-- ==========================================
create table public.spots (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text not null, -- 'wild-camping', 'driveway-host', 'water-station', 'service-mechanic'
  lat numeric not null,
  lng numeric not null,
  description text,
  author_id uuid references public.profiles(id) on delete cascade not null,
  vouches integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.spots enable row level security;

create policy "Spots are viewable by everyone" 
  on public.spots for select 
  using (true);

create policy "Authenticated users can create spots" 
  on public.spots for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors can update/delete their own spots" 
  on public.spots for all 
  using (auth.uid() = author_id);

-- ==========================================
-- 3. Visited Spots (Many-to-Many join table)
-- ==========================================
create table public.visited_spots (
  profile_id uuid references public.profiles(id) on delete cascade not null,
  spot_id uuid references public.spots(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (profile_id, spot_id)
);

alter table public.visited_spots enable row level security;

create policy "Visited logs are viewable by everyone" 
  on public.visited_spots for select 
  using (true);

create policy "Users can modify their own visited spots list" 
  on public.visited_spots for all 
  using (auth.uid() = profile_id);

-- ==========================================
-- 4. Meetups Table (Caravans & Campouts)
-- ==========================================
create table public.meetups (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  lat numeric not null,
  lng numeric not null,
  date date not null,
  time text not null,
  location text not null,
  description text,
  host_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.meetups enable row level security;

create policy "Meetups are viewable by everyone" 
  on public.meetups for select 
  using (true);

create policy "Authenticated users can host meetups" 
  on public.meetups for insert 
  with check (auth.role() = 'authenticated');

create policy "Hosts can update/delete their own meetups" 
  on public.meetups for all 
  using (auth.uid() = host_id);

-- ==========================================
-- 5. Meetup Attendees (Many-to-Many join table)
-- ==========================================
create table public.meetup_attendees (
  meetup_id uuid references public.meetups(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (meetup_id, profile_id)
);

alter table public.meetup_attendees enable row level security;

create policy "Attendees list is viewable by everyone" 
  on public.meetup_attendees for select 
  using (true);

create policy "Users can RSVP or cancel RSVP for themselves" 
  on public.meetup_attendees for all 
  using (auth.uid() = profile_id);

-- ==========================================
-- 6. Social Feed Posts
-- ==========================================
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  image text, -- Key referencing an SVG mockup or a public URL to uploaded storage media
  author_id uuid references public.profiles(id) on delete cascade not null,
  likes integer default 0 not null,
  liked_by uuid[] default '{}'::uuid[] not null, -- Array of user IDs who liked the post to track toggle status
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone" 
  on public.posts for select 
  using (true);

create policy "Authenticated users can create posts" 
  on public.posts for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors can delete or edit their own posts" 
  on public.posts for all 
  using (auth.uid() = author_id);

-- ==========================================
-- 7. Post Comments
-- ==========================================
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  text text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" 
  on public.comments for select 
  using (true);

create policy "Authenticated users can comment" 
  on public.comments for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors can edit or delete their own comments" 
  on public.comments for all 
  using (auth.uid() = author_id);

-- ==========================================
-- 8. Marketplace Listings
-- ==========================================
create table public.marketplace (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  price numeric not null,
  category text not null, -- 'campervan', 'electrical', 'parts', 'gear'
  location text not null,
  zip text not null,
  description text,
  image text, -- SVG mockup key or public URL
  seller_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.marketplace enable row level security;

create policy "Listings are viewable by everyone" 
  on public.marketplace for select 
  using (true);

create policy "Authenticated users can post listings" 
  on public.marketplace for insert 
  with check (auth.role() = 'authenticated');

create policy "Sellers can manage their own listings" 
  on public.marketplace for all 
  using (auth.uid() = seller_id);

-- ==========================================
-- 9. Skill Trade Directory
-- ==========================================
create table public.skills (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null, -- 'offer', 'want'
  category text not null, -- 'electrical', 'woodworking', 'mechanical', 'plumbing', 'digital'
  tags text[] default '{}'::text[],
  description text,
  author_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.skills enable row level security;

create policy "Skill trades are viewable by everyone" 
  on public.skills for select 
  using (true);

create policy "Authenticated users can post skill listings" 
  on public.skills for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors can manage their own skill listings" 
  on public.skills for all 
  using (auth.uid() = author_id);

-- ==========================================
-- 10. Forum Threads
-- ==========================================
create table public.forum_threads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text default 'General' not null,
  body text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  views_count integer default 0 not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.forum_threads enable row level security;

create policy "Threads are viewable by everyone" 
  on public.forum_threads for select 
  using (true);

create policy "Authenticated users can create threads" 
  on public.forum_threads for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors can edit or delete their own threads" 
  on public.forum_threads for all 
  using (auth.uid() = author_id);

-- ==========================================
-- 11. Forum Thread Replies
-- ==========================================
create table public.forum_replies (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.forum_threads(id) on delete cascade not null,
  body text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.forum_replies enable row level security;

create policy "Replies are viewable by everyone" 
  on public.forum_replies for select 
  using (true);

create policy "Authenticated users can write replies" 
  on public.forum_replies for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors can edit or delete their own replies" 
  on public.forum_replies for all 
  using (auth.uid() = author_id);

-- ==========================================
-- 12. Friendships (Many-to-Many symmetrical relation)
-- ==========================================
create table public.friendships (
  profile_id_1 uuid references public.profiles(id) on delete cascade not null,
  profile_id_2 uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (profile_id_1, profile_id_2),
  constraint friends_are_distinct check (profile_id_1 <> profile_id_2)
);

alter table public.friendships enable row level security;

create policy "Friendships are viewable by everyone" 
  on public.friendships for select 
  using (true);

create policy "Users can establish or end their own friendships" 
  on public.friendships for all 
  using (auth.uid() = profile_id_1 or auth.uid() = profile_id_2);

-- ==========================================
-- 13. Direct Messages Table
-- ==========================================
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  text text,
  image text, -- For sticker name (e.g. 'plant-sticker') or public attachment url
  heart_reaction boolean default false not null,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Messages are viewable by the sender or receiver" 
  on public.messages for select 
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages to other profiles" 
  on public.messages for insert 
  with check (auth.role() = 'authenticated' and auth.uid() = sender_id);

create policy "Users can update reaction states on messages they are involved in"
  on public.messages for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- =========================================================================
-- Automatically create profile records when new users sign up on Supabase
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, handle, avatar, bio)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New Nomad'),
    coalesce(new.raw_user_meta_data->>'handle', 'nomad_' || substring(md5(random()::text) from 1 for 8)),
    'avatar_bob', -- Default avatar
    'Living full time on the road.'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
