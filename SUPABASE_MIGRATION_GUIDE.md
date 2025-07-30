# Supabase Migration Guide

## Overview

This guide will help you migrate your QR Attendance System from PHP/MySQL to Supabase.

## Prerequisites

1. Supabase account (free tier available)
2. Node.js and npm installed
3. Your existing QR Attendance project

## Step 1: Set Up Supabase Project

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Note down your project URL and anon key

### 1.2 Configure Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Set Up Database Schema

### 2.1 Run the SQL Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Execute the script

### 2.2 Verify Tables Created

You should see these tables:

- `students` - Student registration data
- `faculty` - Faculty login credentials
- `sbo_officers` - SBO officer credentials
- `attendance_records` - Attendance tracking data

## Step 3: Install Dependencies

```bash
npm install @supabase/supabase-js bcryptjs
```

## Step 4: Update Your Application

### 4.1 Files Already Updated

The following files have been updated to use Supabase:

- ✅ `app/lib/supabaseClient.js` - Supabase client configuration
- ✅ `app/lib/auth.js` - Authentication utilities
- ✅ `app/pages/Student.js` - Student registration
- ✅ `app/pages/Faculty.js` - Faculty dashboard
- ✅ `app/pages/Scan.js` - QR scanning functionality

### 4.2 Key Changes Made

#### Authentication

- Replaced PHP API calls with Supabase client
- Added bcrypt password hashing
- Implemented proper error handling

#### Database Operations

- Student registration now uses Supabase
- Faculty login uses Supabase authentication
- Attendance recording uses Supabase
- CSV export functionality preserved

#### Security

- Row Level Security (RLS) enabled
- Environment variables for credentials
- Proper password hashing

## Step 5: Test Your Application

### 5.1 Test Student Registration

1. Navigate to Student registration page
2. Fill in student details
3. Verify registration works
4. Check QR code generation

### 5.2 Test Faculty Login

1. Navigate to Faculty page
2. Use demo credentials:
   - Username: `faculty`
   - Password: `password`
3. Verify dashboard loads
4. Test attendance record viewing

### 5.3 Test QR Scanning

1. Navigate to Scan page
2. Use demo credentials:
   - Username: `sbo`
   - Password: `password`
3. Test QR code scanning
4. Verify attendance recording

## Step 6: Data Migration (Optional)

If you have existing data in your MySQL database:

### 6.1 Export MySQL Data

```sql
-- Export students
SELECT * FROM students;

-- Export faculty
SELECT * FROM faculty;

-- Export attendance records
SELECT * FROM attendance_records;
```

### 6.2 Import to Supabase

1. Go to Supabase Table Editor
2. Import CSV files or use the SQL editor
3. Update password hashes to bcrypt format

## Step 7: Deployment

### 7.1 Environment Variables

Make sure to set environment variables in your deployment platform:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 7.2 Build and Deploy

```bash
npm run build
npm start
```

## Troubleshooting

### Common Issues

#### 1. Connection Errors

- Verify your Supabase URL and anon key
- Check if your project is active
- Ensure RLS policies are configured

#### 2. Authentication Issues

- Verify password hashing is working
- Check if users exist in the database
- Ensure proper table permissions

#### 3. CORS Issues

- Supabase handles CORS automatically
- No additional configuration needed

### Debug Mode

Enable debug logging in your Supabase client:

```javascript
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    debug: true,
  },
});
```

## Benefits of Supabase Migration

### 1. Performance

- Real-time subscriptions
- Automatic caching
- CDN distribution

### 2. Security

- Row Level Security
- Built-in authentication
- Automatic backups

### 3. Scalability

- Automatic scaling
- No server management
- Global distribution

### 4. Developer Experience

- TypeScript support
- Real-time subscriptions
- Built-in API generation

## Support

If you encounter issues:

1. Check Supabase documentation
2. Review error logs in browser console
3. Verify database schema is correct
4. Test with sample data first

## Next Steps

After successful migration:

1. Set up real-time subscriptions for live updates
2. Implement user roles and permissions
3. Add audit logging
4. Set up automated backups
5. Configure monitoring and alerts
