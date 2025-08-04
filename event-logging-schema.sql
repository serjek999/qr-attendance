-- Event Logging System Schema
-- This creates dedicated tables for storing various types of system events and logs

-- 1. Event Types Table (for categorizing different types of events)
CREATE TABLE IF NOT EXISTS event_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    severity_level VARCHAR(20) CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Main Events Table (stores all system events)
CREATE TABLE IF NOT EXISTS system_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
    event_name VARCHAR(200) NOT NULL,
    event_description TEXT,
    severity_level VARCHAR(20) CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- User information
    user_id UUID,
    user_type VARCHAR(50) CHECK (user_type IN ('student', 'admin', 'faculty', 'sbo_officer', 'system')),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    
    -- Event details
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    
    -- Event data (JSON for flexible storage)
    event_data JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    CONSTRAINT idx_system_events_created_at UNIQUE (id, created_at)
);

-- 3. Attendance Events Table (specific to attendance-related events)
CREATE TABLE IF NOT EXISTS attendance_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_event_id UUID REFERENCES system_events(id) ON DELETE CASCADE,
    
    -- Attendance details
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    tribe_id UUID REFERENCES tribes(id) ON DELETE SET NULL,
    attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE CASCADE,
    
    -- Event type
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'qr_scan_attempt',
        'qr_scan_success',
        'qr_scan_failed',
        'attendance_recorded',
        'attendance_updated',
        'attendance_duplicate_handled',
        'time_in_recorded',
        'time_out_recorded',
        'outside_scanning_hours',
        'student_not_found',
        'invalid_qr_code'
    )),
    
    -- Event details
    scan_data TEXT,
    qr_code_content TEXT,
    time_window VARCHAR(20) CHECK (time_window IN ('time_in', 'time_out', 'outside_hours')),
    scan_location VARCHAR(255),
    
    -- Success/failure info
    is_successful BOOLEAN NOT NULL,
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT idx_attendance_events_student_date UNIQUE (student_id, DATE(created_at))
);

-- 4. Authentication Events Table (for login/logout events)
CREATE TABLE IF NOT EXISTS auth_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_event_id UUID REFERENCES system_events(id) ON DELETE CASCADE,
    
    -- Auth details
    user_id UUID,
    user_type VARCHAR(50) CHECK (user_type IN ('student', 'admin', 'faculty', 'sbo_officer')),
    user_email VARCHAR(255),
    
    -- Event type
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'login_attempt',
        'login_success',
        'login_failed',
        'logout',
        'password_reset_requested',
        'password_reset_completed',
        'account_locked',
        'session_expired',
        'invalid_credentials'
    )),
    
    -- Auth details
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    auth_method VARCHAR(50) DEFAULT 'email_password',
    
    -- Success/failure info
    is_successful BOOLEAN NOT NULL,
    failure_reason TEXT,
    attempts_count INTEGER DEFAULT 1,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. System Performance Events Table (for monitoring system health)
CREATE TABLE IF NOT EXISTS performance_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_event_id UUID REFERENCES system_events(id) ON DELETE CASCADE,
    
    -- Performance metrics
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'api_request',
        'database_query',
        'qr_scan_processing',
        'attendance_calculation',
        'report_generation',
        'system_startup',
        'system_shutdown',
        'memory_usage',
        'cpu_usage',
        'disk_usage'
    )),
    
    -- Performance data
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    
    -- Request details
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Error Logs Table (for storing detailed error information)
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_event_id UUID REFERENCES system_events(id) ON DELETE CASCADE,
    
    -- Error details
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_code VARCHAR(100),
    
    -- Context
    component VARCHAR(100),
    function_name VARCHAR(100),
    line_number INTEGER,
    file_name VARCHAR(255),
    
    -- Error severity
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Audit Trail Table (for tracking data changes)
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    system_event_id UUID REFERENCES system_events(id) ON DELETE CASCADE,
    
    -- Change details
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    operation VARCHAR(20) CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    
    -- Change data
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- User who made the change
    changed_by_user_id UUID,
    changed_by_user_type VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default event types
INSERT INTO event_types (name, description, severity_level) VALUES
('attendance_scan', 'QR code scanning for attendance', 'medium'),
('user_authentication', 'User login/logout events', 'medium'),
('system_error', 'System errors and exceptions', 'high'),
('performance_monitoring', 'System performance metrics', 'low'),
('data_modification', 'Data changes and updates', 'medium'),
('security_event', 'Security-related events', 'high'),
('qr_code_generation', 'QR code generation events', 'low'),
('report_generation', 'Report generation events', 'low'),
('tribe_management', 'Tribe creation/modification events', 'medium'),
('user_management', 'User account management events', 'high')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_events_created_at ON system_events(created_at);
CREATE INDEX IF NOT EXISTS idx_system_events_user_id ON system_events(user_id);
CREATE INDEX IF NOT EXISTS idx_system_events_event_type_id ON system_events(event_type_id);
CREATE INDEX IF NOT EXISTS idx_system_events_severity ON system_events(severity_level);

CREATE INDEX IF NOT EXISTS idx_attendance_events_student_id ON attendance_events(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_events_created_at ON attendance_events(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_events_event_type ON attendance_events(event_type);

CREATE INDEX IF NOT EXISTS idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at ON auth_events(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_events_event_type ON auth_events(event_type);

CREATE INDEX IF NOT EXISTS idx_performance_events_created_at ON performance_events(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_events_event_type ON performance_events(event_type);

CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);

CREATE INDEX IF NOT EXISTS idx_audit_trail_table_name ON audit_trail(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_operation ON audit_trail(operation);

-- Create RLS policies for security
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_events
CREATE POLICY "Admins can view all system events" ON system_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    );

CREATE POLICY "System can insert events" ON system_events
    FOR INSERT WITH CHECK (true);

-- RLS Policies for attendance_events
CREATE POLICY "Admins can view all attendance events" ON attendance_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    );

CREATE POLICY "SBO officers can view attendance events" ON attendance_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sbo_officers 
            WHERE sbo_officers.id = auth.uid()
        )
    );

CREATE POLICY "System can insert attendance events" ON attendance_events
    FOR INSERT WITH CHECK (true);

-- RLS Policies for auth_events
CREATE POLICY "Admins can view all auth events" ON auth_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own auth events" ON auth_events
    FOR SELECT USING (
        user_id = auth.uid()
    );

CREATE POLICY "System can insert auth events" ON auth_events
    FOR INSERT WITH CHECK (true);

-- RLS Policies for performance_events
CREATE POLICY "Admins can view all performance events" ON performance_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    );

CREATE POLICY "System can insert performance events" ON performance_events
    FOR INSERT WITH CHECK (true);

-- RLS Policies for error_logs
CREATE POLICY "Admins can view all error logs" ON error_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    );

CREATE POLICY "System can insert error logs" ON error_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for audit_trail
CREATE POLICY "Admins can view all audit trail" ON audit_trail
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE admins.id = auth.uid()
        )
    );

CREATE POLICY "System can insert audit trail" ON audit_trail
    FOR INSERT WITH CHECK (true);

-- Create functions for automatic logging
CREATE OR REPLACE FUNCTION log_system_event(
    p_event_name VARCHAR(200),
    p_event_description TEXT DEFAULT NULL,
    p_severity_level VARCHAR(20) DEFAULT 'medium',
    p_user_id UUID DEFAULT NULL,
    p_user_type VARCHAR(50) DEFAULT NULL,
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_user_name VARCHAR(255) DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO system_events (
        event_name,
        event_description,
        severity_level,
        user_id,
        user_type,
        user_email,
        user_name,
        event_data,
        metadata,
        ip_address,
        user_agent
    ) VALUES (
        p_event_name,
        p_event_description,
        p_severity_level,
        p_user_id,
        p_user_type,
        p_user_email,
        p_user_name,
        p_event_data,
        p_metadata,
        inet_client_addr(),
        JSON_EXTRACT(current_setting('request.headers', true), '$.user-agent')
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log attendance events
CREATE OR REPLACE FUNCTION log_attendance_event(
    p_event_type VARCHAR(50),
    p_student_id UUID,
    p_tribe_id UUID DEFAULT NULL,
    p_attendance_record_id UUID DEFAULT NULL,
    p_scan_data TEXT DEFAULT NULL,
    p_qr_code_content TEXT DEFAULT NULL,
    p_time_window VARCHAR(20) DEFAULT NULL,
    p_is_successful BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_error_code VARCHAR(100) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_user_type VARCHAR(50) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_system_event_id UUID;
    v_attendance_event_id UUID;
BEGIN
    -- Log system event first
    v_system_event_id := log_system_event(
        'attendance_' || p_event_type,
        'Attendance event: ' || p_event_type,
        CASE 
            WHEN p_is_successful THEN 'low'
            ELSE 'medium'
        END,
        p_user_id,
        p_user_type
    );
    
    -- Log attendance event
    INSERT INTO attendance_events (
        system_event_id,
        student_id,
        tribe_id,
        attendance_record_id,
        event_type,
        scan_data,
        qr_code_content,
        time_window,
        is_successful,
        error_message,
        error_code
    ) VALUES (
        v_system_event_id,
        p_student_id,
        p_tribe_id,
        p_attendance_record_id,
        p_event_type,
        p_scan_data,
        p_qr_code_content,
        p_time_window,
        p_is_successful,
        p_error_message,
        p_error_code
    ) RETURNING id INTO v_attendance_event_id;
    
    RETURN v_attendance_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log authentication events
CREATE OR REPLACE FUNCTION log_auth_event(
    p_event_type VARCHAR(50),
    p_user_id UUID,
    p_user_type VARCHAR(50),
    p_user_email VARCHAR(255),
    p_is_successful BOOLEAN,
    p_failure_reason TEXT DEFAULT NULL,
    p_attempts_count INTEGER DEFAULT 1
) RETURNS UUID AS $$
DECLARE
    v_system_event_id UUID;
    v_auth_event_id UUID;
BEGIN
    -- Log system event first
    v_system_event_id := log_system_event(
        'auth_' || p_event_type,
        'Authentication event: ' || p_event_type,
        CASE 
            WHEN p_is_successful THEN 'low'
            ELSE 'medium'
        END,
        p_user_id,
        p_user_type,
        p_user_email
    );
    
    -- Log auth event
    INSERT INTO auth_events (
        system_event_id,
        user_id,
        user_type,
        user_email,
        event_type,
        is_successful,
        failure_reason,
        attempts_count
    ) VALUES (
        v_system_event_id,
        p_user_id,
        p_user_type,
        p_user_email,
        p_event_type,
        p_is_successful,
        p_failure_reason,
        p_attempts_count
    ) RETURNING id INTO v_auth_event_id;
    
    RETURN v_auth_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
    p_error_type VARCHAR(100),
    p_error_message TEXT,
    p_error_stack TEXT DEFAULT NULL,
    p_error_code VARCHAR(100) DEFAULT NULL,
    p_component VARCHAR(100) DEFAULT NULL,
    p_function_name VARCHAR(100) DEFAULT NULL,
    p_line_number INTEGER DEFAULT NULL,
    p_file_name VARCHAR(255) DEFAULT NULL,
    p_severity VARCHAR(20) DEFAULT 'medium',
    p_user_id UUID DEFAULT NULL,
    p_user_type VARCHAR(50) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_system_event_id UUID;
    v_error_log_id UUID;
BEGIN
    -- Log system event first
    v_system_event_id := log_system_event(
        'error_' || p_error_type,
        p_error_message,
        p_severity,
        p_user_id,
        p_user_type
    );
    
    -- Log error
    INSERT INTO error_logs (
        system_event_id,
        error_type,
        error_message,
        error_stack,
        error_code,
        component,
        function_name,
        line_number,
        file_name,
        severity
    ) VALUES (
        v_system_event_id,
        p_error_type,
        p_error_message,
        p_error_stack,
        p_error_code,
        p_component,
        p_function_name,
        p_line_number,
        p_file_name,
        p_severity
    ) RETURNING id INTO v_error_log_id;
    
    RETURN v_error_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit trail
CREATE OR REPLACE FUNCTION create_audit_trail(
    p_table_name VARCHAR(100),
    p_record_id UUID,
    p_operation VARCHAR(20),
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_changed_fields TEXT[] DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_user_type VARCHAR(50) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_system_event_id UUID;
    v_audit_trail_id UUID;
BEGIN
    -- Log system event first
    v_system_event_id := log_system_event(
        'audit_' || p_operation,
        'Data modification: ' || p_operation || ' on ' || p_table_name,
        'medium',
        p_user_id,
        p_user_type
    );
    
    -- Create audit trail
    INSERT INTO audit_trail (
        system_event_id,
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        changed_fields,
        changed_by_user_id,
        changed_by_user_type
    ) VALUES (
        v_system_event_id,
        p_table_name,
        p_record_id,
        p_operation,
        p_old_values,
        p_new_values,
        p_changed_fields,
        p_user_id,
        p_user_type
    ) RETURNING id INTO v_audit_trail_id;
    
    RETURN v_audit_trail_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic audit trail
CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields TEXT[];
    v_user_id UUID;
    v_user_type VARCHAR(50);
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    
    -- Determine user type
    IF EXISTS (SELECT 1 FROM admins WHERE id = v_user_id) THEN
        v_user_type := 'admin';
    ELSIF EXISTS (SELECT 1 FROM faculty WHERE id = v_user_id) THEN
        v_user_type := 'faculty';
    ELSIF EXISTS (SELECT 1 FROM sbo_officers WHERE id = v_user_id) THEN
        v_user_type := 'sbo_officer';
    ELSIF EXISTS (SELECT 1 FROM students WHERE id = v_user_id) THEN
        v_user_type := 'student';
    ELSE
        v_user_type := 'system';
    END IF;
    
    -- Handle different operations
    IF TG_OP = 'INSERT' THEN
        v_new_values := to_jsonb(NEW);
        PERFORM create_audit_trail(
            TG_TABLE_NAME,
            NEW.id,
            'INSERT',
            NULL,
            v_new_values,
            NULL,
            v_user_id,
            v_user_type
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        
        -- Get changed fields
        SELECT array_agg(key) INTO v_changed_fields
        FROM (
            SELECT key FROM jsonb_object_keys(v_new_values)
            EXCEPT
            SELECT key FROM jsonb_object_keys(v_old_values)
        ) AS changed_keys;
        
        PERFORM create_audit_trail(
            TG_TABLE_NAME,
            NEW.id,
            'UPDATE',
            v_old_values,
            v_new_values,
            v_changed_fields,
            v_user_id,
            v_user_type
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        v_old_values := to_jsonb(OLD);
        PERFORM create_audit_trail(
            TG_TABLE_NAME,
            OLD.id,
            'DELETE',
            v_old_values,
            NULL,
            NULL,
            v_user_id,
            v_user_type
        );
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_attendance_records_trigger
    AFTER INSERT OR UPDATE OR DELETE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_students_trigger
    AFTER INSERT OR UPDATE OR DELETE ON students
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_tribes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tribes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_posts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON posts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Comments for documentation
COMMENT ON TABLE system_events IS 'Main table for storing all system events and logs';
COMMENT ON TABLE attendance_events IS 'Specific events related to attendance and QR scanning';
COMMENT ON TABLE auth_events IS 'Authentication and authorization events';
COMMENT ON TABLE performance_events IS 'System performance monitoring events';
COMMENT ON TABLE error_logs IS 'Detailed error logging and tracking';
COMMENT ON TABLE audit_trail IS 'Data modification audit trail';
COMMENT ON TABLE event_types IS 'Categories and types of events';

COMMENT ON FUNCTION log_system_event IS 'Log a general system event';
COMMENT ON FUNCTION log_attendance_event IS 'Log attendance-related events';
COMMENT ON FUNCTION log_auth_event IS 'Log authentication events';
COMMENT ON FUNCTION log_error IS 'Log error events with details';
COMMENT ON FUNCTION create_audit_trail IS 'Create audit trail entries';
COMMENT ON FUNCTION audit_trigger_function IS 'Trigger function for automatic audit trail'; 