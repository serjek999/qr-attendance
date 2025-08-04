-- Create scan_history table to persist QR scan history
CREATE TABLE IF NOT EXISTS scan_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_school_id TEXT,
    student_name TEXT,
    scan_status TEXT NOT NULL, -- 'success' or 'failed'
    scan_data TEXT, -- The raw QR code data that was scanned
    error_message TEXT, -- Error message if scan failed
    scanned_by UUID, -- ID of the SBO officer who performed the scan
    scanned_at TIMESTAMP DEFAULT NOW(),
    attendance_recorded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_history_student_id ON scan_history(student_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON scan_history(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_history_status ON scan_history(scan_status);

-- Enable RLS
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for scan_history
CREATE POLICY "SBO can insert scan history"
ON scan_history FOR INSERT
WITH CHECK (true);

CREATE POLICY "SBO can read scan history"
ON scan_history FOR SELECT
USING (true);

CREATE POLICY "SBO can update scan history"
ON scan_history FOR UPDATE
USING (true);

-- Show the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'scan_history'
ORDER BY ordinal_position; 