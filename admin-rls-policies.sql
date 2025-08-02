-- RLS Policies for Admin access to Faculty and SBO Officers tables

-- Enable RLS on faculty and sbo_officers tables (if not already enabled)
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbo_officers ENABLE ROW LEVEL SECURITY;

-- Admin policies for faculty table
-- Admins can view all faculty
CREATE POLICY "Admins can view all faculty" ON faculty
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.email = auth.jwt() ->> 'email'
    )
);

-- Admins can insert faculty
CREATE POLICY "Admins can insert faculty" ON faculty
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.email = auth.jwt() ->> 'email'
    )
);

-- Admins can update faculty
CREATE POLICY "Admins can update faculty" ON faculty
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.email = auth.jwt() ->> 'email'
    )
);

-- Admins can delete faculty
CREATE POLICY "Admins can delete faculty" ON faculty
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.email = auth.jwt() ->> 'email'
    )
);

-- Admin policies for sbo_officers table
-- Admins can view all SBO officers
CREATE POLICY "Admins can view all sbo_officers" ON sbo_officers
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.email = auth.jwt() ->> 'email'
    )
);

-- Admins can insert SBO officers
CREATE POLICY "Admins can insert sbo_officers" ON sbo_officers
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.email = auth.jwt() ->> 'email'
    )
);

-- Admins can update SBO officers
CREATE POLICY "Admins can update sbo_officers" ON sbo_officers
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.email = auth.jwt() ->> 'email'
    )
);

-- Admins can delete SBO officers
CREATE POLICY "Admins can delete sbo_officers" ON sbo_officers
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM admins 
        WHERE admins.email = auth.jwt() ->> 'email'
    )
);

-- Faculty can view their own data
CREATE POLICY "Faculty can view own data" ON faculty
FOR SELECT USING (
    faculty.email = auth.jwt() ->> 'email'
);

-- SBO officers can view their own data
CREATE POLICY "SBO officers can view own data" ON sbo_officers
FOR SELECT USING (
    sbo_officers.email = auth.jwt() ->> 'email'
); 