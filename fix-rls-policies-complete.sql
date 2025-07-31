-- Fix RLS Policies Complete
-- This script fixes all RLS policies to make the system fully functional

-- =========================
-- TEMPORARILY DISABLE RLS FOR SETUP
-- =========================
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE tribes DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;

-- =========================
-- DROP EXISTING POLICIES
-- =========================
DROP POLICY IF EXISTS "Students can read their own data" ON students;
DROP POLICY IF EXISTS "Students can update their own data" ON students;
DROP POLICY IF EXISTS "View approved or own posts" ON posts;
DROP POLICY IF EXISTS "Students can create posts" ON posts;
DROP POLICY IF EXISTS "Students can view likes" ON post_likes;
DROP POLICY IF EXISTS "Students can like/unlike posts" ON post_likes;
DROP POLICY IF EXISTS "Students can unlike their own likes" ON post_likes;
DROP POLICY IF EXISTS "Students can read their own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Students can add their own attendance" ON attendance_records;

-- =========================
-- RE-ENABLE RLS
-- =========================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officERS ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- =========================
-- CREATE PERMISSIVE POLICIES FOR ALL TABLES
-- =========================

-- Students table policies
CREATE POLICY "Allow all operations on students" ON students
    FOR ALL USING (true) WITH CHECK (true);

-- Faculty table policies
CREATE POLICY "Allow all operations on faculty" ON faculty
    FOR ALL USING (true) WITH CHECK (true);

-- SBO Officers table policies
CREATE POLICY "Allow all operations on sbo_officers" ON sbo_officers
    FOR ALL USING (true) WITH CHECK (true);

-- Admins table policies
CREATE POLICY "Allow all operations on admins" ON admins
    FOR ALL USING (true) WITH CHECK (true);

-- Tribes table policies
CREATE POLICY "Allow all operations on tribes" ON tribes
    FOR ALL USING (true) WITH CHECK (true);

-- Posts table policies
CREATE POLICY "Allow all operations on posts" ON posts
    FOR ALL USING (true) WITH CHECK (true);

-- Attendance records table policies
CREATE POLICY "Allow all operations on attendance_records" ON attendance_records
    FOR ALL USING (true) WITH CHECK (true);

-- Post likes table policies (if it exists)
CREATE POLICY "Allow all operations on post_likes" ON post_likes
    FOR ALL USING (true) WITH CHECK (true);

-- =========================
-- VERIFY POLICIES WERE CREATED
-- =========================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('students', 'faculty', 'sbo_officers', 'admins', 'tribes', 'posts', 'attendance_records', 'post_likes'); 