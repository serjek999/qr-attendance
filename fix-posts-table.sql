-- Fix Posts Table to Support All User Types
-- This migration updates the posts table to support posts from all user types

-- Step 1: Add new columns for different user types
ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_type VARCHAR(20) DEFAULT 'student';
ALTER TABLE posts ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS sbo_officer_id UUID REFERENCES sbo_officers(id) ON DELETE CASCADE;

-- Step 2: Update existing posts to have the correct author_type
UPDATE posts SET author_type = 'student' WHERE author_id IS NOT NULL;

-- Step 3: Create a function to get author information
CREATE OR REPLACE FUNCTION get_post_author_info(post_row posts)
RETURNS JSON AS $$
DECLARE
    author_info JSON;
BEGIN
    CASE post_row.author_type
        WHEN 'student' THEN
            SELECT json_build_object(
                'id', s.id,
                'name', s.full_name,
                'type', 'student'
            ) INTO author_info
            FROM students s
            WHERE s.id = post_row.author_id;
        WHEN 'admin' THEN
            SELECT json_build_object(
                'id', a.id,
                'name', a.full_name,
                'type', 'admin'
            ) INTO author_info
            FROM admins a
            WHERE a.id = post_row.admin_id;
        WHEN 'faculty' THEN
            SELECT json_build_object(
                'id', f.id,
                'name', f.full_name,
                'type', 'faculty'
            ) INTO author_info
            FROM faculty f
            WHERE f.id = post_row.faculty_id;
        WHEN 'sbo' THEN
            SELECT json_build_object(
                'id', sbo.id,
                'name', sbo.full_name,
                'type', 'sbo'
            ) INTO author_info
            FROM sbo_officers sbo
            WHERE sbo.id = post_row.sbo_officer_id;
        ELSE
            author_info := json_build_object('name', 'Unknown', 'type', 'unknown');
    END CASE;
    
    RETURN author_info;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Update RLS policies to allow all user types to create posts
DROP POLICY IF EXISTS "Students can create posts" ON posts;
CREATE POLICY "Users can create posts"
ON posts FOR INSERT
WITH CHECK (true);

-- Step 5: Update RLS policies to allow all user types to view posts
DROP POLICY IF EXISTS "View approved or own posts" ON posts;
CREATE POLICY "View approved posts"
ON posts FOR SELECT
USING (approved = true);

-- Step 6: Add policy for users to view their own posts
CREATE POLICY "Users can view own posts"
ON posts FOR SELECT
USING (
    (author_type = 'student' AND author_id = auth.uid()::uuid) OR
    (author_type = 'admin' AND admin_id = auth.uid()::uuid) OR
    (author_type = 'faculty' AND faculty_id = auth.uid()::uuid) OR
    (author_type = 'sbo' AND sbo_officer_id = auth.uid()::uuid)
);

-- Step 7: Add policy for users to update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (
    (author_type = 'student' AND author_id = auth.uid()::uuid) OR
    (author_type = 'admin' AND admin_id = auth.uid()::uuid) OR
    (author_type = 'faculty' AND faculty_id = auth.uid()::uuid) OR
    (author_type = 'sbo' AND sbo_officer_id = auth.uid()::uuid)
);

-- Step 8: Add policy for users to delete their own posts
CREATE POLICY "Users can delete own posts"
ON posts FOR DELETE
USING (
    (author_type = 'student' AND author_id = auth.uid()::uuid) OR
    (author_type = 'admin' AND admin_id = auth.uid()::uuid) OR
    (author_type = 'faculty' AND faculty_id = auth.uid()::uuid) OR
    (author_type = 'sbo' AND sbo_officer_id = auth.uid()::uuid)
); 