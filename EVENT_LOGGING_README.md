# Event Logging System Documentation

## Overview

The QR Attendance System now includes a comprehensive event logging system that tracks all system activities, user actions, errors, and performance metrics. This system provides complete audit trails and monitoring capabilities for administrators.

## 🗄️ Database Schema

### Core Tables

#### 1. `event_types`

- **Purpose**: Categorizes different types of events
- **Key Fields**: `name`, `description`, `severity_level`, `is_active`
- **Default Types**: attendance_scan, user_authentication, system_error, performance_monitoring, data_modification, security_event, qr_code_generation, report_generation, tribe_management, user_management

#### 2. `system_events`

- **Purpose**: Main table storing all system events
- **Key Fields**: `event_name`, `event_description`, `severity_level`, `user_id`, `user_type`, `event_data`, `metadata`, `ip_address`, `user_agent`
- **Features**: JSONB storage for flexible data, IP tracking, user agent logging

#### 3. `attendance_events`

- **Purpose**: Specific events related to attendance and QR scanning
- **Key Fields**: `event_type`, `student_id`, `tribe_id`, `attendance_record_id`, `scan_data`, `qr_code_content`, `time_window`, `is_successful`, `error_message`
- **Event Types**: qr_scan_attempt, qr_scan_success, qr_scan_failed, attendance_recorded, attendance_updated, attendance_duplicate_handled, time_in_recorded, time_out_recorded, outside_scanning_hours, student_not_found, invalid_qr_code

#### 4. `auth_events`

- **Purpose**: Authentication and authorization events
- **Key Fields**: `event_type`, `user_id`, `user_type`, `user_email`, `is_successful`, `failure_reason`, `attempts_count`
- **Event Types**: login_attempt, login_success, login_failed, logout, password_reset_requested, password_reset_completed, account_locked, session_expired, invalid_credentials

#### 5. `performance_events`

- **Purpose**: System performance monitoring
- **Key Fields**: `event_type`, `response_time_ms`, `request_size_bytes`, `response_size_bytes`, `memory_usage_mb`, `cpu_usage_percent`, `endpoint`, `method`, `status_code`
- **Event Types**: api_request, database_query, qr_scan_processing, attendance_calculation, report_generation, system_startup, system_shutdown, memory_usage, cpu_usage, disk_usage

#### 6. `error_logs`

- **Purpose**: Detailed error tracking and debugging
- **Key Fields**: `error_type`, `error_message`, `error_stack`, `error_code`, `component`, `function_name`, `line_number`, `file_name`, `severity`, `is_resolved`
- **Features**: Stack trace storage, resolution tracking, severity classification

#### 7. `audit_trail`

- **Purpose**: Data modification audit trail
- **Key Fields**: `table_name`, `record_id`, `operation`, `old_values`, `new_values`, `changed_fields`, `changed_by_user_id`, `changed_by_user_type`
- **Operations**: INSERT, UPDATE, DELETE, SELECT
- **Features**: JSONB storage for before/after values, automatic trigger-based logging

## 🔧 Database Functions

### Core Logging Functions

#### `log_system_event()`

```sql
log_system_event(
    p_event_name VARCHAR(200),
    p_event_description TEXT DEFAULT NULL,
    p_severity_level VARCHAR(20) DEFAULT 'medium',
    p_user_id UUID DEFAULT NULL,
    p_user_type VARCHAR(50) DEFAULT NULL,
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_user_name VARCHAR(255) DEFAULT NULL,
    p_event_data JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID
```

#### `log_attendance_event()`

```sql
log_attendance_event(
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
) RETURNS UUID
```

#### `log_auth_event()`

```sql
log_auth_event(
    p_event_type VARCHAR(50),
    p_user_id UUID,
    p_user_type VARCHAR(50),
    p_user_email VARCHAR(255),
    p_is_successful BOOLEAN,
    p_failure_reason TEXT DEFAULT NULL,
    p_attempts_count INTEGER DEFAULT 1
) RETURNS UUID
```

#### `log_error()`

```sql
log_error(
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
) RETURNS UUID
```

## 🚀 Frontend Integration

### Event Logger Service (`lib/eventLogger.js`)

The frontend includes a comprehensive JavaScript service for logging events:

```javascript
import eventLogger from "@/lib/eventLogger";

// Log QR scan attempt
await eventLogger.logQRScanAttempt(qrData, isSuccessful, errorMessage);

// Log QR scan success
await eventLogger.logQRScanSuccess(qrData, studentId, tribeId);

// Log QR scan failure
await eventLogger.logQRScanFailure(qrData, errorMessage, errorCode);

// Log attendance recording
await eventLogger.logAttendanceRecorded(
  studentId,
  tribeId,
  attendanceRecordId,
  isNewRecord
);

// Log duplicate key handling
await eventLogger.logDuplicateKeyHandled(
  studentId,
  tribeId,
  attendanceRecordId
);

// Log student not found
await eventLogger.logStudentNotFound(qrData);

// Log outside scanning hours
await eventLogger.logOutsideScanningHours(qrData);

// Log authentication events
await eventLogger.logLoginAttempt(email, isSuccessful, failureReason);
await eventLogger.logLogout();

// Log performance metrics
await eventLogger.logPerformanceEvent(
  eventType,
  responseTimeMs,
  endpoint,
  method,
  statusCode
);

// Log errors
await eventLogger.logError(
  errorType,
  errorMessage,
  errorStack,
  errorCode,
  component,
  functionName,
  lineNumber,
  fileName,
  severity
);
```

### Admin Dashboard Integration

The admin dashboard includes an `EventLogs` component (`app/admin/components/EventLogs.js`) that provides:

- **Real-time Event Monitoring**: View all system events with filtering and search
- **Severity-based Filtering**: Filter by critical, high, medium, or low severity
- **Event Type Filtering**: Filter by QR scans, authentication, attendance, errors
- **Search Functionality**: Search across event names, descriptions, and user information
- **Export Capabilities**: Export logs to CSV format
- **Detailed Event View**: Expandable event details with JSON data

## 🔒 Security Features

### Row Level Security (RLS)

All logging tables have RLS policies:

- **Admins**: Can view all events and logs
- **SBO Officers**: Can view attendance events
- **Users**: Can view their own authentication events
- **System**: Can insert all types of events

### Data Privacy

- **IP Address Tracking**: Logs client IP addresses for security monitoring
- **User Agent Logging**: Tracks browser/client information
- **Session Management**: Unique session IDs for tracking user sessions
- **Audit Trail**: Complete data modification history

## 📊 Monitoring and Analytics

### Event Categories

1. **QR Scanning Events**

   - Scan attempts, successes, failures
   - Time window validation
   - Student identification
   - Duplicate handling

2. **Authentication Events**

   - Login attempts and successes
   - Failed authentication
   - Session management
   - Account security

3. **Attendance Events**

   - Record creation and updates
   - Time-in/time-out recording
   - Duplicate key handling
   - Student validation

4. **System Performance**

   - API response times
   - Database query performance
   - Memory and CPU usage
   - System health metrics

5. **Error Tracking**
   - Application errors
   - Database errors
   - Network issues
   - User-reported problems

### Severity Levels

- **Critical**: System failures, security breaches
- **High**: Important errors, authentication failures
- **Medium**: Warnings, duplicate attempts, validation failures
- **Low**: Successful operations, performance metrics

## 🛠️ Setup Instructions

### 1. Database Setup

Run the event logging schema:

```bash
# Execute the SQL schema
psql -d your_database -f event-logging-schema.sql
```

### 2. Frontend Integration

The event logger is automatically imported and used in:

- **SBO Home Page**: QR scanning and attendance recording
- **Admin Dashboard**: System monitoring and event viewing
- **Authentication**: Login/logout tracking
- **Error Handling**: Automatic error logging

### 3. Admin Access

Admins can access the event logs through:

1. Navigate to Admin Dashboard
2. Go to "Reports" section
3. View "System Event Logs"

## 📈 Usage Examples

### QR Scan Logging

```javascript
// In SBO scanner component
try {
  // Log scan attempt
  await eventLogger.logQRScanAttempt(qrData, false);

  // Process QR code
  const student = await findStudent(qrData);

  // Log successful scan
  await eventLogger.logQRScanSuccess(qrData, student.id, student.tribe_id);
} catch (error) {
  // Log scan failure
  await eventLogger.logQRScanFailure(qrData, error.message);
}
```

### Attendance Recording

```javascript
// In attendance recording function
try {
  const result = await recordAttendance(studentId, timeData);

  // Log successful recording
  await eventLogger.logAttendanceRecorded(
    studentId,
    tribeId,
    result.id,
    isNewRecord
  );
} catch (error) {
  if (error.code === "23505") {
    // Duplicate key
    await eventLogger.logDuplicateKeyHandled(studentId, tribeId, recordId);
  }
}
```

### Error Logging

```javascript
// Automatic error logging
try {
  // Some operation
} catch (error) {
  await eventLogger.logError(
    "DATABASE_ERROR",
    error.message,
    error.stack,
    error.code,
    "AttendanceService",
    "recordAttendance",
    45,
    "attendance.js",
    "high"
  );
}
```

## 🔍 Querying and Analysis

### Common Queries

#### Get Recent QR Scan Events

```sql
SELECT * FROM attendance_events
WHERE event_type LIKE '%qr_scan%'
ORDER BY created_at DESC
LIMIT 50;
```

#### Get Failed Authentication Attempts

```sql
SELECT * FROM auth_events
WHERE is_successful = false
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

#### Get System Errors by Severity

```sql
SELECT * FROM error_logs
WHERE severity = 'high'
AND is_resolved = false
ORDER BY created_at DESC;
```

#### Get Performance Issues

```sql
SELECT * FROM performance_events
WHERE response_time_ms > 1000
ORDER BY created_at DESC;
```

## 📋 Maintenance

### Regular Tasks

1. **Clean Old Logs**: Archive or delete logs older than 90 days
2. **Monitor Storage**: Check database size and performance
3. **Review Errors**: Regularly review unresolved errors
4. **Update Policies**: Adjust RLS policies as needed

### Performance Optimization

- **Indexes**: All tables have appropriate indexes for common queries
- **Partitioning**: Consider partitioning for high-volume deployments
- **Archiving**: Implement log archiving for long-term storage

## 🚨 Troubleshooting

### Common Issues

1. **Logging Not Working**

   - Check RLS policies
   - Verify function permissions
   - Check network connectivity

2. **Performance Issues**

   - Monitor query performance
   - Check index usage
   - Consider log rotation

3. **Storage Issues**
   - Implement log retention policies
   - Monitor database size
   - Archive old logs

## 📞 Support

For issues with the event logging system:

1. Check the error logs table for system errors
2. Review RLS policies and permissions
3. Verify database function availability
4. Check frontend console for JavaScript errors

---

**Note**: This event logging system provides comprehensive monitoring and audit capabilities for the QR Attendance System. All events are automatically logged and can be viewed by administrators for system monitoring, debugging, and compliance purposes.
