-- Add test student for QR scanner testing
-- This student can be used with the test QR code "STU001"

-- First, ensure we have a tribe to assign the student to
INSERT INTO tribes (name, description) 
VALUES ('Test Tribe', 'Test tribe for QR scanner testing');

-- Add test student
INSERT INTO students (
    school_id,
    first_name,
    last_name,
    full_name,
    email,
    year_level,
    tribe_id,
    created_at,
    updated_at
) 
SELECT 
    'STU001',
    'Test',
    'Student',
    'Test Student',
    'test.student@test.com',
    'Y1',
    t.id,
    NOW(),
    NOW()
FROM tribes t 
WHERE t.name = 'Test Tribe';

-- Verify the test student was added
SELECT 'Test student added:' as info;
SELECT 
    s.school_id,
    s.full_name,
    s.email,
    s.year_level,
    t.name as tribe_name
FROM students s
LEFT JOIN tribes t ON s.tribe_id = t.id
WHERE s.school_id = 'STU001'; 