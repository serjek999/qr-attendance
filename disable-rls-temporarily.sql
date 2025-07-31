-- Temporarily disable RLS to add users
-- Run this in your Supabase SQL Editor

-- Step 1: Disable RLS temporarily
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;

-- Step 2: Add users (you'll need to run this separately with proper password hashes)
-- INSERT INTO admins (email, full_name, password_hash) VALUES ('jake@admin', 'Jake Admin', 'hashed_password');
-- INSERT INTO faculty (email, full_name, password_hash) VALUES ('riza@faculty', 'Riza Faculty', 'hashed_password');
-- INSERT INTO sbo_officers (email, full_name, password_hash) VALUES ('dodong@sbo', 'Dodong SBO', 'hashed_password');

-- Step 3: Re-enable RLS with proper policies
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Step 4: Add basic policies for authentication
CREATE POLICY "Allow faculty auth" ON faculty FOR SELECT USING (true);
CREATE POLICY "Allow faculty insert" ON faculty FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin auth" ON admins FOR SELECT USING (true);
CREATE POLICY "Allow admin insert" ON admins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow SBO auth" ON sbo_officers FOR SELECT USING (true);
CREATE POLICY "Allow SBO insert" ON sbo_officers FOR INSERT WITH CHECK (true); 