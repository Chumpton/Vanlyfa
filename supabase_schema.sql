-- Supabase Database Schema for Vanlyfa
-- This file defines the tables, relationships, and Row Level Security (RLS) policies
-- required to run Vanlyfa with a Supabase backend.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==========================================
-- Admin / Moderation Security Helper
-- ==========================================
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
end;
$$ language plpgsql security definer;

-- ==========================================
-- 1. Profiles Table
-- ==========================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  handle text unique not null,
  avatar text, -- Will store avatar key or a public URL/base64 to an uploaded file
  bio text,
  rig text,
  solar text,
  power text,
  water text,
  instagram_handle text, -- Instagram social link
  tiktok_handle text,    -- TikTok social link
  role text default 'user' not null, -- 'admin', 'moderator', 'pro', 'user'
  avatar_crop jsonb default '{"x":0,"y":0,"zoom":1}'::jsonb not null, -- Store crop positioning
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
  using (auth.uid() = id or public.is_admin());

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
  status text default 'pending' not null, -- 'pending', 'approved', 'rejected'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.spots enable row level security;

create policy "Spots are viewable by everyone if approved, or by the owner/admin" 
  on public.spots for select 
  using (status = 'approved' or auth.uid() = author_id or public.is_admin());

create policy "Authenticated users can create spots" 
  on public.spots for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors or admins can update/delete spots" 
  on public.spots for all 
  using (auth.uid() = author_id or public.is_admin());

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
  using (auth.uid() = profile_id or public.is_admin());

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
  status text default 'pending' not null, -- 'pending', 'approved', 'rejected'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.meetups enable row level security;

create policy "Meetups are viewable by everyone if approved, or by host/admin" 
  on public.meetups for select 
  using (status = 'approved' or auth.uid() = host_id or public.is_admin());

create policy "Authenticated users can host meetups" 
  on public.meetups for insert 
  with check (auth.role() = 'authenticated');

create policy "Hosts or admins can update/delete meetups" 
  on public.meetups for all 
  using (auth.uid() = host_id or public.is_admin());

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
  using (auth.uid() = profile_id or public.is_admin());

-- ==========================================
-- 6. Social Feed Posts
-- ==========================================
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  image text, -- Key referencing an SVG mockup or a public URL to uploaded storage media
  author_id uuid references public.profiles(id) on delete cascade not null,
  likes integer default 0 not null,
  status text default 'pending' not null, -- 'pending', 'approved', 'rejected'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone if approved, or by author/admin" 
  on public.posts for select 
  using (status = 'approved' or auth.uid() = author_id or public.is_admin());

create policy "Authenticated users can create posts" 
  on public.posts for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors or admins can delete or edit posts" 
  on public.posts for all 
  using (auth.uid() = author_id or public.is_admin());

-- ==========================================
-- 7. Post Likes (Replaces old liked_by array)
-- ==========================================
create table public.post_likes (
  post_id uuid references public.posts(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (post_id, profile_id)
);

alter table public.post_likes enable row level security;

create policy "Likes are viewable by everyone" 
  on public.post_likes for select 
  using (true);

create policy "Authenticated users can toggle their own likes" 
  on public.post_likes for all 
  using (auth.uid() = profile_id);

-- ==========================================
-- 8. Post Comments
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

create policy "Authors or admins can edit or delete comments" 
  on public.comments for all 
  using (auth.uid() = author_id or public.is_admin());

-- ==========================================
-- 9. Marketplace Listings
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
  status text default 'pending' not null, -- 'pending', 'approved', 'rejected'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.marketplace enable row level security;

create policy "Listings are viewable by everyone if approved, or by seller/admin" 
  on public.marketplace for select 
  using (status = 'approved' or auth.uid() = seller_id or public.is_admin());

create policy "Authenticated users can post listings" 
  on public.marketplace for insert 
  with check (auth.role() = 'authenticated');

create policy "Sellers or admins can manage listings" 
  on public.marketplace for all 
  using (auth.uid() = seller_id or public.is_admin());

-- ==========================================
-- 10. Skill Trade Directory
-- ==========================================
create table public.skills (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null, -- 'offer', 'want'
  category text not null, -- 'electrical', 'woodworking', 'mechanical', 'plumbing', 'digital'
  tags text[] default '{}'::text[],
  description text,
  author_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' not null, -- 'pending', 'approved', 'rejected'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.skills enable row level security;

create policy "Skill trades are viewable by everyone if approved, or by author/admin" 
  on public.skills for select 
  using (status = 'approved' or auth.uid() = author_id or public.is_admin());

create policy "Authenticated users can post skill listings" 
  on public.skills for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors or admins can manage skill listings" 
  on public.skills for all 
  using (auth.uid() = author_id or public.is_admin());

-- ==========================================
-- 11. Forum Threads
-- ==========================================
create table public.forum_threads (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  category text default 'General' not null,
  body text not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  views_count integer default 0 not null,
  status text default 'approved' not null, -- 'pending', 'approved', 'rejected' (default approved for forum)
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.forum_threads enable row level security;

create policy "Threads are viewable by everyone if approved, or by author/admin" 
  on public.forum_threads for select 
  using (status = 'approved' or auth.uid() = author_id or public.is_admin());

create policy "Authenticated users can create threads" 
  on public.forum_threads for insert 
  with check (auth.role() = 'authenticated');

create policy "Authors or admins can edit or delete threads" 
  on public.forum_threads for all 
  using (auth.uid() = author_id or public.is_admin());

-- ==========================================
-- 12. Forum Thread Replies
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

create policy "Authors or admins can edit or delete replies" 
  on public.forum_replies for all 
  using (auth.uid() = author_id or public.is_admin());

-- ==========================================
-- 13. Friendships (Many-to-Many symmetrical relation)
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
  using (auth.uid() = profile_id_1 or auth.uid() = profile_id_2 or public.is_admin());

-- ==========================================
-- 14. Routes & Trips Table (Featured or Shared)
-- ==========================================
create table public.routes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  waypoints jsonb not null, -- Array of lat/lng objects
  author_id uuid references public.profiles(id) on delete cascade not null,
  is_featured boolean default false not null,
  status text default 'pending' not null, -- 'pending', 'approved', 'rejected'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.routes enable row level security;

create policy "Routes are viewable by everyone if approved/featured, or by author/admin"
  on public.routes for select
  using (status = 'approved' or is_featured = true or auth.uid() = author_id or public.is_admin());

create policy "Authenticated users can create routes"
  on public.routes for insert
  with check (auth.role() = 'authenticated');

create policy "Authors or admins can modify routes"
  on public.routes for all
  using (auth.uid() = author_id or public.is_admin());

-- ==========================================
-- 15. Direct Messages Table
-- ==========================================
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  text text,
  image text, -- Sticker name or public attachment url
  heart_reaction boolean default false not null,
  status text default 'sent' not null, -- 'sent', 'delivered', 'read'
  created_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Messages are viewable by the sender or receiver" 
  on public.messages for select 
  using (auth.uid() = sender_id or auth.uid() = receiver_id or public.is_admin());

create policy "Users can send messages to other profiles" 
  on public.messages for insert 
  with check (auth.role() = 'authenticated' and auth.uid() = sender_id);

create policy "Users can update reaction and read states on messages they are involved in"
  on public.messages for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id or public.is_admin());

-- =========================================================================
-- Automatically create profile records when new users sign up on Supabase
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, handle, avatar, bio, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'New Nomad'),
    coalesce(new.raw_user_meta_data->>'handle', 'nomad_' || substring(md5(random()::text) from 1 for 8)),
    'avatar_bob', -- Default avatar
    'Living full time on the road.',
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
