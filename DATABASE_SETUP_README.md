# Database Setup Guide

## 🗄️ Supabase Database Setup

### **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### **Step 2: Run Database Setup**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `database-setup.sql`
4. Click **Run** to execute the script

### **Step 3: Verify Setup**

After running the script, you should see:

- ✅ **14 tables created** (tribes, students, faculty, sbo_officers, admins, posts, post_likes, attendance_records, events)
- ✅ **Default tribes inserted** (Alpha, Beta, Gamma, Delta, Epsilon)
- ✅ **RLS policies enabled** for all tables
- ✅ **Indexes created** for performance
- ✅ **Foreign key constraints** properly set

### **Step 4: Environment Variables**

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Database Schema Overview

### **Core Tables:**

- **`tribes`** - Student tribes with colors
- **`students`** - Student information with tribe association
- **`faculty`** - Faculty member accounts
- **`sbo_officers`** - SBO officer accounts
- **`admins`** - Administrator accounts

### **Feature Tables:**

- **`posts`** - Social media posts with moderation
- **`post_likes`** - Post like tracking
- **`attendance_records`** - Student attendance tracking
- **`events`** - Tribe and school events

### **Key Features:**

- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Role-based access control** with policies
- ✅ **Foreign key relationships** for data integrity
- ✅ **Performance indexes** for fast queries
- ✅ **Auto-updating timestamps** on all tables

## 🚨 Troubleshooting

### **Error: "column tribe_id does not exist"**

- **Solution**: Run the `database-setup.sql` script in order
- **Cause**: Tables created before foreign key constraints

### **Error: "relation tribes does not exist"**

- **Solution**: Ensure tribes table is created first
- **Cause**: Foreign key references non-existent table

### **Error: "duplicate key value violates unique constraint"**

- **Solution**: Use `ON CONFLICT DO NOTHING` in inserts
- **Cause**: Trying to insert duplicate data

## 📊 Sample Data (Optional)

After setup, you can add sample data for testing:

```sql
-- Add sample faculty
INSERT INTO faculty (username, password_hash, full_name, email) VALUES
('faculty', '$2a$10$hash', 'Faculty Member', 'faculty@school.edu');

-- Add sample SBO
INSERT INTO sbo_officers (username, password_hash, full_name, position) VALUES
('sbo', '$2a$10$hash', 'SBO Officer', 'General Secretary');

-- Add sample admin
INSERT INTO admins (username, password_hash, full_name, email) VALUES
('admin', '$2a$10$hash', 'System Admin', 'admin@school.edu');
```

## 🔐 Security Notes

- All tables have **Row Level Security (RLS)** enabled
- **Policies** control access based on user roles
- **Foreign keys** ensure data integrity
- **Unique constraints** prevent duplicate data

## 📈 Performance

- **Indexes** on frequently queried columns
- **Composite indexes** for complex queries
- **Optimized** for attendance tracking and social features

---

**Next Steps**: After database setup, configure your Next.js app to connect to Supabase and implement the API calls to replace the TODO comments in the dashboard files.
