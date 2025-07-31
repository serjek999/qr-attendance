-- Migration script to add year_level column to existing tables
-- Run this in your Supabase SQL editor

-- Add year_level column to students table if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS year_level VARCHAR(10) CHECK (year_level IN ('Y1', 'Y2', 'YEAR3', 'YEAR4'));

-- Make year_level nullable for existing installations
ALTER TABLE students ALTER COLUMN year_level DROP NOT NULL;

-- Add year_level column to attendance_records table if it doesn't exist
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS year_level VARCHAR(10);

-- Update existing attendance records to include year_level from students table
UPDATE attendance_records 
SET year_level = students.year_level 
FROM students 
WHERE attendance_records.student_id = students.id 
AND attendance_records.year_level IS NULL;

-- Set a default value for any remaining NULL year_level values
UPDATE attendance_records 
SET year_level = 'N/A' 
WHERE year_level IS NULL; 