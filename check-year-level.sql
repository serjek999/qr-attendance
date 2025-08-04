-- Check and add year_level field if it doesn't exist
-- This script ensures the year_level field is available in the students table

-- Add year_level column to students table if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS year_level VARCHAR(10);

-- Add year_level column to attendance_records table if it doesn't exist
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS year_level VARCHAR(10);

-- Update existing students to have a default year_level if they don't have one
UPDATE students 
SET year_level = 'Y1' 
WHERE year_level IS NULL;

-- Show current students with their year_level
SELECT 
    school_id,
    full_name,
    year_level,
    created_at
FROM students 
ORDER BY created_at DESC 
LIMIT 10; 