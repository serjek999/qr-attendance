-- Create competitive_events table for tribe competition scoring with 1st, 2nd, 3rd place winners
CREATE TABLE IF NOT EXISTS competitive_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255),
    first_place_tribe_id INTEGER REFERENCES tribes(id) ON DELETE SET NULL,
    second_place_tribe_id INTEGER REFERENCES tribes(id) ON DELETE SET NULL,
    third_place_tribe_id INTEGER REFERENCES tribes(id) ON DELETE SET NULL,
    first_place_points INTEGER DEFAULT 10,
    second_place_points INTEGER DEFAULT 5,
    third_place_points INTEGER DEFAULT 3,
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_competitive_events_first_place ON competitive_events(first_place_tribe_id);
CREATE INDEX IF NOT EXISTS idx_competitive_events_second_place ON competitive_events(second_place_tribe_id);
CREATE INDEX IF NOT EXISTS idx_competitive_events_third_place ON competitive_events(third_place_tribe_id);
CREATE INDEX IF NOT EXISTS idx_competitive_events_status ON competitive_events(status);
CREATE INDEX IF NOT EXISTS idx_competitive_events_date ON competitive_events(date);

-- Add RLS policies for competitive_events table
ALTER TABLE competitive_events ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all competitive events
CREATE POLICY "Admins can manage all competitive events" ON competitive_events
    FOR ALL USING (auth.role() = 'admin');

-- Policy for faculty to view competitive events
CREATE POLICY "Faculty can view competitive events" ON competitive_events
    FOR SELECT USING (auth.role() = 'faculty');

-- Policy for SBO officers to view competitive events
CREATE POLICY "SBO officers can view competitive events" ON competitive_events
    FOR SELECT USING (auth.role() = 'sbo_officer');

-- Policy for students to view competitive events
CREATE POLICY "Students can view competitive events" ON competitive_events
    FOR SELECT USING (auth.role() = 'student');

-- Insert some sample competitive events (optional)
INSERT INTO competitive_events (title, description, date, time, location, first_place_points, second_place_points, third_place_points, status) VALUES
('Cultural Festival Game', 'Traditional cultural games competition between tribes', '2024-01-20', '14:00:00', 'Main Hall', 10, 5, 3, 'upcoming'),
('Sports Competition', 'Annual sports tournament with multiple events', '2024-01-25', '09:00:00', 'Sports Complex', 15, 8, 4, 'upcoming'),
('Academic Quiz Bowl', 'Knowledge competition testing various subjects', '2024-02-01', '15:30:00', 'Library', 12, 6, 3, 'upcoming'),
('Talent Show', 'Creative performance competition', '2024-02-05', '18:00:00', 'Auditorium', 8, 4, 2, 'upcoming'),
('Cooking Challenge', 'Culinary skills competition', '2024-02-10', '16:00:00', 'Cafeteria', 10, 5, 3, 'upcoming');

-- Update function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for competitive_events table
CREATE TRIGGER update_competitive_events_updated_at 
    BEFORE UPDATE ON competitive_events 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON competitive_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE competitive_events_id_seq TO authenticated; 