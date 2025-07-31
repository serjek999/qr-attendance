# Supabase Setup Guide for QR Attendance System

This guide will help you set up the Supabase database and integrate it with the frontend.

## Prerequisites

1. A Supabase project (create one at https://supabase.com)
2. Node.js and npm installed
3. The project dependencies installed (`npm install`)

## Step 1: Database Schema Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-schema.sql` into the editor
4. Run the SQL script to create all tables, indexes, and policies

## Step 2: Initial Data Setup

1. In the Supabase SQL Editor, run the following SQL to insert initial test data:

```sql
-- Insert default tribes
INSERT INTO tribes (name, color) VALUES
('Alpha', 'bg-blue-500'),
('Beta', 'bg-green-500'),
('Gamma', 'bg-purple-500'),
('Delta', 'bg-orange-500'),
('Epsilon', 'bg-red-500')
ON CONFLICT (name) DO NOTHING;

-- Insert admin user (password: admin123)
INSERT INTO admins (username, password_hash, full_name, email, role) VALUES
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin@school.edu', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert faculty user (password: faculty123)
INSERT INTO faculty (username, password_hash, full_name, email, role) VALUES
('faculty', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Faculty Member', 'faculty@school.edu', 'faculty')
ON CONFLICT (username) DO NOTHING;

-- Insert SBO officer (password: sbo123)
INSERT INTO sbo_officers (username, password_hash, full_name, position) VALUES
('sbo', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'SBO Officer', 'President')
ON CONFLICT (username) DO NOTHING;

-- Insert sample students
INSERT INTO students (school_id, first_name, last_name, middle_name, year_level, tribe_id, password_hash) VALUES
('2023123456', 'John', 'Smith', 'Michael', 'y1', (SELECT id FROM tribes WHERE name = 'Alpha' LIMIT 1), '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('2023987654', 'Jane', 'Doe', 'Elizabeth', 'y2', (SELECT id FROM tribes WHERE name = 'Beta' LIMIT 1), '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (school_id) DO NOTHING;
```

## Step 3: Environment Variables

1. Create a `.env.local` file in your project root
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

You can find these values in your Supabase project settings under "API".

## Step 4: Test the Setup

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Test the login with these credentials:

### Staff Login (use username@domain format):

- **Admin**: `admin@admin` / `admin123`
- **Faculty**: `faculty@faculty` / `faculty123`
- **SBO**: `sbo@sbo` / `sbo123`

### Student Login (use school ID):

- **Student 1**: `2023123456` / `Smith2023-01-15`
- **Student 2**: `2023987654` / `Doe2023-01-15`

## Step 5: Features Available

### For Students:

- ✅ Login with school ID and password
- ✅ View tribe feed with posts
- ✅ Create posts (requires approval)
- ✅ View attendance status and QR code
- ✅ Download QR code for attendance

### For SBO Officers:

- ✅ Login with username@sbo format
- ✅ QR code scanning for attendance
- ✅ Record time-in and time-out
- ✅ View recent attendance records

### For Faculty:

- ✅ Login with username@faculty format
- ✅ View attendance reports (coming soon)

### For Admins:

- ✅ Login with username@admin format
- ✅ Full system management (coming soon)

## Database Schema Overview

### Tables:

- **tribes**: School tribes/houses
- **students**: Student information
- **faculty**: Faculty members
- **sbo_officers**: SBO officers
- **admins**: System administrators
- **posts**: Social media posts
- **post_likes**: Post likes
- **attendance_records**: Daily attendance
- **events**: School events (coming soon)

### Key Features:

- Row Level Security (RLS) enabled
- Automatic timestamps
- Foreign key relationships
- Password hashing with bcrypt
- QR code generation for attendance

## Troubleshooting

### RLS Policy Issues

If you encounter RLS policy errors, you may need to temporarily disable RLS for setup:

```sql
-- Temporarily disable RLS (run in SQL editor)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE faculty DISABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Re-enable after setup
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
```

### Password Issues

The test passwords are hashed with bcrypt. If you need to create new users, use the setup script or hash passwords manually.

### QR Code Issues

QR codes are generated client-side using the `qrcode` library. Make sure the library is installed:

```bash
npm install qrcode
```

## Next Steps

1. **Customize the UI**: Modify the components to match your school's branding
2. **Add more features**: Implement events, leaderboards, and analytics
3. **Security**: Review and customize RLS policies for your needs
4. **Deployment**: Deploy to Vercel or your preferred hosting platform

## Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify your Supabase credentials
3. Ensure all tables are created correctly
4. Check that RLS policies are working as expected
