-- Fix RLS Policies for QR Attendance System
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to check if that's the issue
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own data" ON students;
DROP POLICY IF EXISTS "Faculty can view all students" ON students;
DROP POLICY IF EXISTS "Anyone can insert students" ON students;
DROP POLICY IF EXISTS "Faculty can view all attendance records" ON attendance_records;
DROP POLICY IF EXISTS "SBO officers can insert attendance records" ON attendance_records;
DROP POLICY IF EXISTS "SBO officers can update attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Faculty can view faculty data" ON faculty;
DROP POLICY IF EXISTS "SBO officers can view SBO data" ON sbo_officers;

-- Create simple, permissive policies for testing
CREATE POLICY "Allow all operations on students" ON students
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on faculty" ON faculty
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on sbo_officers" ON sbo_officers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on attendance_records" ON attendance_records
    FOR ALL USING (true) WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('students', 'faculty', 'sbo_officers', 'attendance_records'); 