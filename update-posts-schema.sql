-- Migration to add images field to posts and update post_likes for all user types

-- Add images field to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Update post_likes table to support all user types
-- First, drop existing constraints and policies
DROP POLICY IF EXISTS "Students can view likes" ON post_likes;
DROP POLICY IF EXISTS "Students can like/unlike posts" ON post_likes;
DROP POLICY IF EXISTS "Students can unlike their own likes" ON post_likes;

-- Add new columns for different user types
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE;
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS sbo_officer_id UUID REFERENCES sbo_officers(id) ON DELETE CASCADE;
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id) ON DELETE CASCADE;

-- Update unique constraint to include all user types
ALTER TABLE post_likes DROP CONSTRAINT IF EXISTS post_likes_post_id_student_id_key;
ALTER TABLE post_likes ADD CONSTRAINT post_likes_unique_user 
    UNIQUE (post_id, COALESCE(student_id, faculty_id, sbo_officer_id, admin_id));

-- Add check constraint to ensure only one user type is set
ALTER TABLE post_likes ADD CONSTRAINT post_likes_single_user_type 
    CHECK (
        (student_id IS NOT NULL AND faculty_id IS NULL AND sbo_officer_id IS NULL AND admin_id IS NULL) OR
        (student_id IS NULL AND faculty_id IS NOT NULL AND sbo_officer_id IS NULL AND admin_id IS NULL) OR
        (student_id IS NULL AND faculty_id IS NULL AND sbo_officer_id IS NOT NULL AND admin_id IS NULL) OR
        (student_id IS NULL AND faculty_id IS NULL AND sbo_officer_id IS NULL AND admin_id IS NOT NULL)
    );

-- Create new RLS policies for all user types
-- Students can view all likes
CREATE POLICY "All users can view likes" ON post_likes
FOR SELECT USING (true);

-- Students can like/unlike posts
CREATE POLICY "Students can like/unlike posts" ON post_likes
FOR INSERT WITH CHECK (student_id = auth.uid()::uuid);

CREATE POLICY "Students can unlike their own likes" ON post_likes
FOR DELETE USING (student_id = auth.uid()::uuid);

-- Faculty can like/unlike posts
CREATE POLICY "Faculty can like/unlike posts" ON post_likes
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM faculty 
        WHERE faculty.id = faculty_id 
        AND faculty.email = auth.jwt() ->> 'email'
    )
);

CREATE POLICY "Faculty can unlike their own likes" ON post_likes
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM faculty 
        WHERE faculty.id = faculty_id 
        AND faculty.email = auth.jwt() ->> 'email'
    )
);

-- SBO Officers can like/unlike posts
CREATE POLICY "SBO Officers can like/unlike posts" ON post_likes
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM sbo_officers 
        WHERE sbo_officers.id = sbo_officer_id 
        AND sbo_officers.email = auth.jwt() ->> 'email'
    )
);

CREATE POLICY "SBO Officers can unlike their own likes" ON post_likes
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM sbo_officers 
        WHERE sbo_officers.id = sbo_officer_id 
        AND sbo_officers.email = auth.jwt() ->> 'email'
    )
);

-- Admins can like/unlike posts
CREATE POLICY "Admins can like/unlike posts" ON post_likes
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.id = admin_id 
        AND admins.email = auth.jwt() ->> 'email'
    )
);

CREATE POLICY "Admins can unlike their own likes" ON post_likes
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.id = admin_id 
        AND admins.email = auth.jwt() ->> 'email'
    )
);

-- Add likes_count to posts table for performance
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create function to update likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update likes count
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON post_likes;
CREATE TRIGGER update_post_likes_count_trigger
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();

-- Update existing posts to have correct likes count
UPDATE posts SET likes_count = (
    SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = posts.id
); 