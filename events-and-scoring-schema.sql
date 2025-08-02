-- Events and Tribe Scoring Database Schema
-- This migration adds events management and tribe scoring functionality

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

-- Create event_participants table for tracking who attends events
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    sbo_officer_id UUID REFERENCES sbo_officers(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    attended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one user type is set
    CONSTRAINT event_participants_single_user_type CHECK (
        (student_id IS NOT NULL AND faculty_id IS NULL AND sbo_officer_id IS NULL AND admin_id IS NULL) OR
        (student_id IS NULL AND faculty_id IS NOT NULL AND sbo_officer_id IS NULL AND admin_id IS NULL) OR
        (student_id IS NULL AND faculty_id IS NULL AND sbo_officer_id IS NOT NULL AND admin_id IS NULL) OR
        (student_id IS NULL AND faculty_id IS NULL AND sbo_officer_id IS NULL AND admin_id IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_tribe_id ON events(tribe_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_tribe_scores_tribe_id ON tribe_scores(tribe_id);
CREATE INDEX IF NOT EXISTS idx_tribe_scores_category ON tribe_scores(category);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_student_id ON event_participants(student_id);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tribe_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
-- Everyone can view events
CREATE POLICY "Everyone can view events" ON events
    FOR SELECT USING (true);

-- Admins can create, update, delete events
CREATE POLICY "Admins can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.email = auth.jwt() ->> 'email'
        )
    );

-- Faculty can create, update, delete events
CREATE POLICY "Faculty can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM faculty
            WHERE faculty.email = auth.jwt() ->> 'email'
        )
    );

-- SBO Officers can create, update, delete events
CREATE POLICY "SBO Officers can manage events" ON events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sbo_officers
            WHERE sbo_officers.email = auth.jwt() ->> 'email'
        )
    );

-- RLS Policies for tribe_scores table
-- Everyone can view tribe scores
CREATE POLICY "Everyone can view tribe scores" ON tribe_scores
    FOR SELECT USING (true);

-- Admins can manage tribe scores
CREATE POLICY "Admins can manage tribe scores" ON tribe_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins
            WHERE admins.email = auth.jwt() ->> 'email'
        )
    );

-- Faculty can manage tribe scores
CREATE POLICY "Faculty can manage tribe scores" ON tribe_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM faculty
            WHERE faculty.email = auth.jwt() ->> 'email'
        )
    );

-- SBO Officers can manage tribe scores
CREATE POLICY "SBO Officers can manage tribe scores" ON tribe_scores
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sbo_officers
            WHERE sbo_officers.email = auth.jwt() ->> 'email'
        )
    );

-- RLS Policies for event_participants table
-- Everyone can view event participants
CREATE POLICY "Everyone can view event participants" ON event_participants
    FOR SELECT USING (true);

-- Students can register for events
CREATE POLICY "Students can register for events" ON event_participants
    FOR INSERT WITH CHECK (
        student_id = auth.uid()::uuid
    );

-- Students can update their own registrations
CREATE POLICY "Students can update own registrations" ON event_participants
    FOR UPDATE USING (
        student_id = auth.uid()::uuid
    );

-- Admins, Faculty, SBO can manage all registrations
CREATE POLICY "Staff can manage event participants" ON event_participants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins WHERE admins.email = auth.jwt() ->> 'email'
        ) OR
        EXISTS (
            SELECT 1 FROM faculty WHERE faculty.email = auth.jwt() ->> 'email'
        ) OR
        EXISTS (
            SELECT 1 FROM sbo_officers WHERE sbo_officers.email = auth.jwt() ->> 'email'
        )
    );

-- Create function to update event updated_at timestamp
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for events updated_at
CREATE TRIGGER update_events_updated_at_trigger
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_events_updated_at();

-- Create function to calculate tribe total score
CREATE OR REPLACE FUNCTION get_tribe_total_score(tribe_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT SUM(points) FROM tribe_scores WHERE tribe_id = tribe_uuid),
        0
    );
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data for testing
INSERT INTO events (title, description, date, time, location, event_type, status, created_by) VALUES
('Annual Sports Day', 'School-wide sports competition with various events', '2024-12-15', '08:00:00', 'School Grounds', 'competition', 'upcoming', 'admin'),
('Science Fair', 'Student science project exhibition', '2024-12-20', '14:00:00', 'School Auditorium', 'academic', 'upcoming', 'admin'),
('Cultural Festival', 'Traditional dance and music performances', '2024-12-25', '18:00:00', 'School Hall', 'cultural', 'upcoming', 'admin')
ON CONFLICT DO NOTHING;

-- Insert sample tribe scores
INSERT INTO tribe_scores (tribe_id, event_name, points, category, description, created_by) VALUES
((SELECT id FROM tribes LIMIT 1), 'Basketball Tournament', 50, 'sports', 'First place in basketball tournament', 'admin'),
((SELECT id FROM tribes LIMIT 1), 'Science Quiz', 30, 'academic', 'Second place in science quiz', 'admin'),
((SELECT id FROM tribes LIMIT 1), 'Dance Competition', 40, 'cultural', 'Best performance award', 'admin')
ON CONFLICT DO NOTHING;



