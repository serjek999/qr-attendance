-- Simple migration to add year_level columns
-- Run this in your Supabase SQL editor

-- Add year_level column to students table
ALTER TABLE students ADD COLUMN year_level VARCHAR(10);

-- Add year_level column to attendance_records table  
ALTER TABLE attendance_records ADD COLUMN year_level VARCHAR(10);

-- Add constraint to students table
ALTER TABLE students ADD CONSTRAINT check_year_level CHECK (year_level IN ('Y1', 'Y2', 'YEAR3', 'YEAR4') OR year_level IS NULL); 