-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ====================
-- TABLE: Tribes
-- ====================
create table if not exists tribes (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamp default now()
);

-- ====================
-- TABLE: Students
-- ====================
create table if not exists students (
  id uuid primary key default uuid_generate_v4(),
  school_id text not null unique,
  full_name text not null,
  birthdate date not null,
  tribe_id uuid references tribes(id) on delete set null,
  password_hash text not null,
  created_at timestamp default now()
);

-- ====================
-- TABLE: Faculty
-- ====================
create table if not exists faculty (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  created_at timestamp default now()
);

-- ====================
-- TABLE: SBO Officers
-- ====================
create table if not exists sbo_officers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  created_at timestamp default now()
);

-- ====================
-- TABLE: Admins
-- ====================
create table if not exists admins (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  created_at timestamp default now()
);

-- ====================
-- TABLE: Posts
-- ====================
create table if not exists posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references students(id) on delete cascade,
  tribe_id uuid references tribes(id) on delete set null,
  content text not null,
  approved boolean default false,
  created_at timestamp default now()
);

-- ====================
-- TABLE: Post Likes
-- ====================
create table if not exists post_likes (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references posts(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  created_at timestamp default now(),
  unique(post_id, student_id)
);

-- =========================
-- TABLE: Attendance Records
-- =========================
create table if not exists attendance_records (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references students(id) on delete cascade,
  tribe_id uuid references tribes(id) on delete set null,
  time_in timestamp,
  time_out timestamp,
  date date not null default current_date,
  created_at timestamp default now(),
  unique(student_id, date)
);

-- =========================
-- ENABLE RLS (Row-Level Security)
-- =========================
alter table students enable row level security;
alter table faculty enable row level security;
alter table sbo_officers enable row level security;
alter table admins enable row level security;
alter table posts enable row level security;
alter table post_likes enable row level security;
alter table attendance_records enable row level security;

-- =========================
-- RLS POLICIES (Students)
-- =========================

-- Students can view their own data
create policy "Students can read their own data"
on students for select
using (id = auth.uid()::uuid);

-- Students can update their own data
create policy "Students can update their own data"
on students for update
using (id = auth.uid()::uuid);

-- =========================
-- RLS POLICIES (Posts)
-- =========================

-- Students can view all approved posts or their own
create policy "View approved or own posts"
on posts for select
using (
  approved = true or
  author_id = auth.uid()::uuid
);

-- Students can insert their own posts
create policy "Students can create posts"
on posts for insert
with check (author_id = auth.uid()::uuid);

-- =========================
-- RLS POLICIES (Post Likes)
-- =========================

-- Students can view likes
create policy "Students can view likes"
on post_likes for select
using (student_id = auth.uid()::uuid);

-- Students can like/unlike posts
create policy "Students can like/unlike posts"
on post_likes for insert
with check (student_id = auth.uid()::uuid);

create policy "Students can unlike their own likes"
on post_likes for delete
using (student_id = auth.uid()::uuid);

-- =========================
-- RLS POLICIES (Attendance Records)
-- =========================

-- Students can view their own attendance
create policy "Students can read their own attendance"
on attendance_records for select
using (student_id = auth.uid()::uuid);

-- Students can check in/out
create policy "Students can add their own attendance"
on attendance_records for insert
with check (student_id = auth.uid()::uuid);

-- =========================
-- RLS for Faculty/Admins/SBO (if needed)
-- =========================
-- You can add select/update permissions for specific roles using Supabase Auth groups or JWT claims

-- Example (for Supabase Dashboard role use):
-- grant select on students to authenticated;
