-- QR Attendance System Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birthdate DATE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create faculty table
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

-- Create sbo_officers table
CREATE TABLE IF NOT EXISTS sbo_officers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    position VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    school_id VARCHAR(20) NOT NULL,
    student_name VARCHAR(200) NOT NULL,
    date DATE NOT NULL,
    time_in TIME,
    time_out TIME,
    status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present', 'partial', 'absent')),
    recorded_by UUID REFERENCES sbo_officers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_school_id ON attendance_records(school_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_faculty_updated_at BEFORE UPDATE ON faculty FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sbo_officers_updated_at BEFORE UPDATE ON sbo_officers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample faculty data
INSERT INTO faculty (username, password_hash, full_name, email, role) VALUES
('faculty', '$2a$10$rQZ8K9mN2pL1vX3yU7wE4t', 'Faculty Member', 'faculty@school.edu', 'faculty')
ON CONFLICT (username) DO NOTHING;

-- Insert sample SBO officer data
INSERT INTO sbo_officers (username, password_hash, full_name, position) VALUES
('sbo', '$2a$10$rQZ8K9mN2pL1vX3yU7wE4t', 'SBO Officer', 'General Secretary')
ON CONFLICT (username) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Students can view their own data
CREATE POLICY "Students can view own data" ON students
    FOR SELECT USING (school_id = current_setting('app.school_id', true));

-- Faculty can view all students
CREATE POLICY "Faculty can view all students" ON students
    FOR SELECT USING (true);

-- Anyone can insert students (for registration)
CREATE POLICY "Anyone can insert students" ON students
    FOR INSERT WITH CHECK (true);

-- Faculty can view all attendance records
CREATE POLICY "Faculty can view all attendance records" ON attendance_records
    FOR SELECT USING (true);

-- SBO officers can insert attendance records
CREATE POLICY "SBO officers can insert attendance records" ON attendance_records
    FOR INSERT WITH CHECK (true);

-- SBO officers can update attendance records
CREATE POLICY "SBO officers can update attendance records" ON attendance_records
    FOR UPDATE USING (true);

-- Faculty can view faculty data
CREATE POLICY "Faculty can view faculty data" ON faculty
    FOR SELECT USING (true);

-- SBO officers can view SBO data
CREATE POLICY "SBO officers can view SBO data" ON sbo_officers
    FOR SELECT USING (true); 