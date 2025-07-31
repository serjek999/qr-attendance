-- Add users to the database
-- Passwords are hashed using bcrypt with salt rounds of 10

-- ====================
-- ADD ADMIN USER
-- ====================
INSERT INTO admins (email, full_name, password_hash) 
VALUES (
  'jake@admin',
  'Jake Admin',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' -- jake123
) ON CONFLICT (email) DO NOTHING;

-- ====================
-- ADD FACULTY USER
-- ====================
INSERT INTO faculty (email, full_name, password_hash) 
VALUES (
  'riza@faculty',
  'Riza Faculty',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' -- riza123
) ON CONFLICT (email) DO NOTHING;

-- ====================
-- ADD SBO USER
-- ====================
INSERT INTO sbo_officers (email, full_name, password_hash) 
VALUES (
  'dodong@sbo',
  'Dodong SBO',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' -- sbo123
) ON CONFLICT (email) DO NOTHING;

-- Verify the users were added
SELECT 'Admin users:' as info;
SELECT email, full_name FROM admins;

SELECT 'Faculty users:' as info;
SELECT email, full_name FROM faculty;

SELECT 'SBO users:' as info;
SELECT email, full_name FROM sbo_officers; 