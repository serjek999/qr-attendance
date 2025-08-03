-- Simple Events Migration for QR Attendance System
-- Run this in your Supabase SQL Editor

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255),
    max_participants INTEGER,
    tribe_id UUID REFERENCES tribes(id) ON DELETE SET NULL,
    event_type VARCHAR(50) DEFAULT 'general' CHECK (event_type IN ('general', 'competition', 'workshop', 'meeting')),
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tribe_scores table
CREATE TABLE IF NOT EXISTS tribe_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'academic', 'sports', 'cultural', 'leadership')),
    description TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    sbo_officer_id UUID REFERENCES sbo_officers(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    attended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_tribe_id ON events(tribe_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_tribe_scores_tribe_id ON tribe_scores(tribe_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
CREATE POLICY "Everyone can view events" ON events FOR SELECT USING (true);
CREATE POLICY "Admins can manage events" ON events FOR ALL USING (true);
CREATE POLICY "Faculty can manage events" ON events FOR ALL USING (true);
CREATE POLICY "SBO Officers can manage events" ON events FOR ALL USING (true);

-- RLS Policies for tribe_scores table
CREATE POLICY "Everyone can view tribe scores" ON tribe_scores FOR SELECT USING (true);
CREATE POLICY "Admins can manage tribe scores" ON tribe_scores FOR ALL USING (true);
CREATE POLICY "Faculty can manage tribe scores" ON tribe_scores FOR ALL USING (true);
CREATE POLICY "SBO Officers can manage tribe scores" ON tribe_scores FOR ALL USING (true);

-- RLS Policies for event_participants table
CREATE POLICY "Everyone can view event participants" ON event_participants FOR SELECT USING (true);
CREATE POLICY "Admins can manage event participants" ON event_participants FOR ALL USING (true);
CREATE POLICY "Faculty can manage event participants" ON event_participants FOR ALL USING (true);
CREATE POLICY "SBO Officers can manage event participants" ON event_participants FOR ALL USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_events_updated_at_trigger
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

-- Insert sample data for testing
INSERT INTO events (title, description, date, time, location, event_type, status, created_by) VALUES
('Welcome Back Assembly', 'Annual welcome back assembly for all students', '2024-01-15', '08:00:00', 'Main Auditorium', 'general', 'completed', 'Admin'),
('Science Fair 2024', 'Annual science fair showcasing student projects', '2024-02-20', '14:00:00', 'Gymnasium', 'competition', 'upcoming', 'Admin'),
('Leadership Workshop', 'Workshop on developing leadership skills', '2024-01-25', '15:30:00', 'Room 101', 'workshop', 'upcoming', 'Admin')
ON CONFLICT DO NOTHING;

-- Insert sample tribe scores
INSERT INTO tribe_scores (tribe_id, event_name, points, category, description, created_by) VALUES
((SELECT id FROM tribes LIMIT 1), 'Welcome Back Assembly', 50, 'general', 'Perfect attendance', 'Admin'),
((SELECT id FROM tribes LIMIT 1), 'Science Fair 2024', 100, 'academic', 'First place winner', 'Admin')
ON CONFLICT DO NOTHING; 