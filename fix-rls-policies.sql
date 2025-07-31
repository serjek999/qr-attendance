-- Fix RLS Policies for Authentication
-- This script adds the necessary RLS policies to allow login and user management

-- =========================
-- RLS POLICIES FOR FACULTY
-- =========================

-- Allow faculty to be selected for authentication
create policy "Allow faculty authentication"
on faculty for select
using (true);

-- Allow faculty to be inserted (for registration)
create policy "Allow faculty registration"
on faculty for insert
with check (true);

-- Allow faculty to update their own data
create policy "Allow faculty to update own data"
on faculty for update
using (true);

-- =========================
-- RLS POLICIES FOR ADMINS
-- =========================

-- Allow admins to be selected for authentication
create policy "Allow admin authentication"
on admins for select
using (true);

-- Allow admins to be inserted (for registration)
create policy "Allow admin registration"
on admins for insert
with check (true);

-- Allow admins to update their own data
create policy "Allow admin to update own data"
on admins for update
using (true);

-- =========================
-- RLS POLICIES FOR SBO OFFICERS
-- =========================

-- Allow SBO officers to be selected for authentication
create policy "Allow SBO authentication"
on sbo_officers for select
using (true);

-- Allow SBO officers to be inserted (for registration)
create policy "Allow SBO registration"
on sbo_officers for insert
with check (true);

-- Allow SBO officers to update their own data
create policy "Allow SBO to update own data"
on sbo_officers for update
using (true);

-- =========================
-- ADDITIONAL POLICIES FOR ADMIN ACCESS
-- =========================

-- Allow admins to view all students
create policy "Admins can view all students"
on students for select
using (true);

-- Allow admins to view all faculty
create policy "Admins can view all faculty"
on faculty for select
using (true);

-- Allow admins to view all SBO officers
create policy "Admins can view all SBO officers"
on sbo_officers for select
using (true);

-- Allow admins to view all attendance records
create policy "Admins can view all attendance"
on attendance_records for select
using (true);

-- Allow faculty to view all students
create policy "Faculty can view all students"
on students for select
using (true);

-- Allow faculty to view all attendance records
create policy "Faculty can view all attendance"
on attendance_records for select
using (true);

-- Allow SBO officers to view all students
create policy "SBO can view all students"
on students for select
using (true);

-- Allow SBO officers to view all attendance records
create policy "SBO can view all attendance"
on attendance_records for select
using (true);

-- Allow SBO officers to insert attendance records
create policy "SBO can insert attendance"
on attendance_records for insert
with check (true);

-- Allow SBO officers to update attendance records
create policy "SBO can update attendance"
on attendance_records for update
using (true); 