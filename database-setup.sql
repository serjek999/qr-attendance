-- QR Attendance System Database Setup
-- Run this in your Supabase SQL editor

-- Step 1: Create tribes table first
CREATE TABLE IF NOT EXISTS tribes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50) DEFAULT 'bg-blue-500',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    year_level VARCHAR(10) CHECK (year_level IN ('y1', 'y2', 'y3', 'y4')),
    tribe_id UUID,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create faculty table
CREATE TABLE IF NOT EXISTS faculty (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'faculty',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create sbo_officers table
CREATE TABLE IF NOT EXISTS sbo_officers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    position VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create admin table
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID NOT NULL,
    author_type VARCHAR(20) NOT NULL CHECK (author_type IN ('student', 'sbo', 'faculty', 'admin')),
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    tribe_id UUID,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 7: Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'sbo', 'faculty', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id, user_type)
);

-- Step 8: Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    school_id VARCHAR(20) NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    year_level VARCHAR(10),
    tribe_id UUID,
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present', 'partial', 'absent')),
    recorded_by UUID REFERENCES sbo_officers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Step 9: Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME,
    location VARCHAR(200),
    event_type VARCHAR(50) CHECK (event_type IN ('sports', 'service', 'meeting', 'academic')),
    attendance_required BOOLEAN DEFAULT false,
    tribe_id UUID,
    created_by UUID NOT NULL,
    created_by_type VARCHAR(20) NOT NULL CHECK (created_by_type IN ('sbo', 'faculty', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 10: Add foreign key constraints
ALTER TABLE students ADD CONSTRAINT fk_students_tribe_id FOREIGN KEY (tribe_id) REFERENCES tribes(id);
ALTER TABLE attendance_records ADD CONSTRAINT fk_attendance_records_tribe_id FOREIGN KEY (tribe_id) REFERENCES tribes(id);
ALTER TABLE posts ADD CONSTRAINT fk_posts_tribe_id FOREIGN KEY (tribe_id) REFERENCES tribes(id);
ALTER TABLE events ADD CONSTRAINT fk_events_tribe_id FOREIGN KEY (tribe_id) REFERENCES tribes(id);

-- Step 11: Insert default tribes
INSERT INTO tribes (name, color) VALUES
('Alpha', 'bg-blue-500'),
('Beta', 'bg-green-500'),
('Gamma', 'bg-purple-500'),
('Delta', 'bg-orange-500'),
('Epsilon', 'bg-red-500')
ON CONFLICT (name) DO NOTHING;

-- Step 12: Enable RLS
ALTER TABLE tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Step 13: Create basic RLS policies
CREATE POLICY "Anyone can view tribes" ON tribes FOR SELECT USING (true);
CREATE POLICY "Anyone can view approved posts" ON posts FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert students" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Faculty can view all students" ON students FOR SELECT USING (true);
CREATE POLICY "Faculty can view all attendance records" ON attendance_records FOR SELECT USING (true);
CREATE POLICY "SBO officers can manage attendance records" ON attendance_records FOR ALL USING (true);

-- Step 14: Create indexes
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_tribe_id ON students(tribe_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_tribe_id ON posts(tribe_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_tribe_id ON events(tribe_id);

-- Success message
SELECT 'Database setup completed successfully!' as status; 