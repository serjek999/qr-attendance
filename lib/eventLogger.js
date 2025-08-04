import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Event Logger Service
 * Provides comprehensive logging functionality for the QR Attendance System
 */
class EventLogger {
    constructor() {
        this.isEnabled = true;
        this.userInfo = null;
        this.sessionId = this.generateSessionId();
        this.initializeUserInfo();
    }

    /**
     * Initialize user information from localStorage
     */
    initializeUserInfo() {
        try {
            const userData = localStorage.getItem("currentUser");
            if (userData) {
                this.userInfo = JSON.parse(userData);
            }
        } catch (error) {
            console.warn('Failed to initialize user info for logging:', error);
        }
    }

    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get current user information
     */
    getCurrentUserInfo() {
        if (!this.userInfo) {
            this.initializeUserInfo();
        }
        return this.userInfo;
    }

    /**
     * Log a general system event
     */
    async logSystemEvent(eventName, eventDescription = null, severityLevel = 'medium', eventData = null, metadata = null) {
        if (!this.isEnabled) return null;

        try {
            const userInfo = this.getCurrentUserInfo();

            const { data, error } = await supabase.rpc('log_system_event', {
                p_event_name: eventName,
                p_event_description: eventDescription,
                p_severity_level: severityLevel,
                p_user_id: userInfo?.id || null,
                p_user_type: userInfo?.role || 'system',
                p_user_email: userInfo?.email || null,
                p_user_name: userInfo?.full_name || null,
                p_event_data: eventData,
                p_metadata: metadata
            });

            if (error) {
                console.error('Failed to log system event:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error logging system event:', error);
            return null;
        }
    }

    /**
     * Log attendance-related events
     */
    async logAttendanceEvent(eventType, studentId, isSuccessful = true, tribeId = null, attendanceRecordId = null, scanData = null, qrCodeContent = null, timeWindow = null, errorMessage = null, errorCode = null) {
        if (!this.isEnabled) return null;

        try {
            const userInfo = this.getCurrentUserInfo();

            const { data, error } = await supabase.rpc('log_attendance_event', {
                p_event_type: eventType,
                p_student_id: studentId,
                p_tribe_id: tribeId,
                p_attendance_record_id: attendanceRecordId,
                p_scan_data: scanData,
                p_qr_code_content: qrCodeContent,
                p_time_window: timeWindow,
                p_is_successful: isSuccessful,
                p_error_message: errorMessage,
                p_error_code: errorCode,
                p_user_id: userInfo?.id || null,
                p_user_type: userInfo?.role || 'system'
            });

            if (error) {
                console.error('Failed to log attendance event:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error logging attendance event:', error);
            return null;
        }
    }

    /**
     * Log authentication events
     */
    async logAuthEvent(eventType, userId, userType, userEmail, isSuccessful = true, failureReason = null, attemptsCount = 1) {
        if (!this.isEnabled) return null;

        try {
            const { data, error } = await supabase.rpc('log_auth_event', {
                p_event_type: eventType,
                p_user_id: userId,
                p_user_type: userType,
                p_user_email: userEmail,
                p_is_successful: isSuccessful,
                p_failure_reason: failureReason,
                p_attempts_count: attemptsCount
            });

            if (error) {
                console.error('Failed to log auth event:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error logging auth event:', error);
            return null;
        }
    }

    /**
     * Log error events
     */
    async logError(errorType, errorMessage, severity = 'medium', errorStack = null, errorCode = null, component = null, functionName = null, lineNumber = null, fileName = null) {
        if (!this.isEnabled) return null;

        try {
            const userInfo = this.getCurrentUserInfo();

            const { data, error } = await supabase.rpc('log_error', {
                p_error_type: errorType,
                p_error_message: errorMessage,
                p_severity: severity,
                p_error_stack: errorStack,
                p_error_code: errorCode,
                p_component: component,
                p_function_name: functionName,
                p_line_number: lineNumber,
                p_file_name: fileName,
                p_user_id: userInfo?.id || null,
                p_user_type: userInfo?.role || 'system'
            });

            if (error) {
                console.error('Failed to log error:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error logging error event:', error);
            return null;
        }
    }

    /**
     * Log QR scan attempt
     */
    async logQRScanAttempt(qrData, isSuccessful = false, errorMessage = null) {
        const timeInfo = this.getCurrentTimeInfo();
        const timeWindow = timeInfo.isTimeInWindow ? 'time_in' :
            timeInfo.isTimeOutWindow ? 'time_out' : 'outside_hours';

        return await this.logSystemEvent(
            'qr_scan_attempt',
            `QR scan attempt - ${isSuccessful ? 'Success' : 'Failed'}`,
            isSuccessful ? 'low' : 'medium',
            {
                qr_data: qrData,
                time_window: timeWindow,
                current_time: timeInfo.time,
                is_within_scanning_hours: timeInfo.canScan
            }
        );
    }

    /**
     * Log QR scan success
     */
    async logQRScanSuccess(qrData, studentId, tribeId) {
        const timeInfo = this.getCurrentTimeInfo();
        const timeWindow = timeInfo.isTimeInWindow ? 'time_in' : 'time_out';

        return await this.logAttendanceEvent(
            'qr_scan_success',
            studentId,
            true,
            tribeId,
            null,
            qrData,
            qrData,
            timeWindow
        );
    }

    /**
     * Log QR scan failure
     */
    async logQRScanFailure(qrData, errorMessage, errorCode = null) {
        return await this.logAttendanceEvent(
            'qr_scan_failed',
            null,
            false,
            null,
            null,
            qrData,
            qrData,
            'outside_hours',
            errorMessage,
            errorCode
        );
    }

    /**
     * Log attendance recording
     */
    async logAttendanceRecorded(studentId, tribeId, attendanceRecordId, isNewRecord = true) {
        const timeInfo = this.getCurrentTimeInfo();
        const eventType = isNewRecord ? 'attendance_recorded' : 'attendance_updated';
        const timeWindow = timeInfo.isTimeInWindow ? 'time_in' : 'time_out';

        return await this.logAttendanceEvent(
            eventType,
            studentId,
            true,
            tribeId,
            attendanceRecordId,
            null,
            null,
            timeWindow
        );
    }

    /**
     * Log duplicate key handling
     */
    async logDuplicateKeyHandled(studentId, tribeId, attendanceRecordId) {
        return await this.logAttendanceEvent(
            'attendance_duplicate_handled',
            studentId,
            true,
            tribeId,
            attendanceRecordId,
            null,
            null,
            null,
            null,
            'DUPLICATE_KEY_CONSTRAINT'
        );
    }

    /**
     * Log student not found
     */
    async logStudentNotFound(qrData) {
        return await this.logAttendanceEvent(
            'student_not_found',
            null,
            false,
            null,
            null,
            qrData,
            qrData,
            null,
            'Student not found with provided QR code',
            'STUDENT_NOT_FOUND'
        );
    }

    /**
     * Log outside scanning hours
     */
    async logOutsideScanningHours(qrData) {
        return await this.logAttendanceEvent(
            'outside_scanning_hours',
            null,
            false,
            null,
            null,
            qrData,
            qrData,
            'outside_hours',
            'QR scanning attempted outside allowed hours',
            'OUTSIDE_SCANNING_HOURS'
        );
    }

    /**
     * Log login attempt
     */
    async logLoginAttempt(email, isSuccessful = false, failureReason = null) {
        const userInfo = this.getCurrentUserInfo();
        return await this.logAuthEvent(
            isSuccessful ? 'login_success' : 'login_failed',
            userInfo?.id || null,
            userInfo?.role || 'unknown',
            email,
            isSuccessful,
            failureReason
        );
    }

    /**
     * Log logout
     */
    async logLogout() {
        const userInfo = this.getCurrentUserInfo();
        return await this.logAuthEvent(
            'logout',
            userInfo?.id || null,
            userInfo?.role || 'unknown',
            userInfo?.email || null,
            true
        );
    }

    /**
     * Log performance metrics
     */
    async logPerformanceEvent(eventType, responseTimeMs = null, endpoint = null, method = null, statusCode = null) {
        return await this.logSystemEvent(
            'performance_' + eventType,
            `Performance event: ${eventType}`,
            'low',
            {
                response_time_ms: responseTimeMs,
                endpoint: endpoint,
                method: method,
                status_code: statusCode,
                timestamp: new Date().toISOString()
            }
        );
    }

    /**
     * Get current time information for logging
     */
    getCurrentTimeInfo() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Time-in window: 7:00 AM - 11:30 AM
        const isTimeInWindow = (currentHour === 7 && currentMinute >= 0) ||
            (currentHour > 7 && currentHour < 11) ||
            (currentHour === 11 && currentMinute <= 30);

        // Time-out window: 1:00 PM - 5:00 PM
        const isTimeOutWindow = currentHour >= 13 && currentHour < 17;

        const canScan = isTimeInWindow || isTimeOutWindow;

        return {
            time: timeString,
            isTimeInWindow,
            isTimeOutWindow,
            canScan
        };
    }

    /**
     * Enable/disable logging
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    /**
     * Get recent events (for admin dashboard)
     */
    async getRecentEvents(limit = 50, eventType = null, severity = null) {
        try {
            let query = supabase
                .from('system_events')
                .select(`
                    *,
                    event_types(name, description),
                    attendance_events(*),
                    auth_events(*),
                    error_logs(*)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (eventType) {
                query = query.eq('event_name', eventType);
            }

            if (severity) {
                query = query.eq('severity_level', severity);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Failed to fetch recent events:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching recent events:', error);
            return [];
        }
    }

    /**
     * Get attendance events for a specific student
     */
    async getStudentAttendanceEvents(studentId, limit = 20) {
        try {
            const { data, error } = await supabase
                .from('attendance_events')
                .select(`
                    *,
                    system_events(*),
                    students(full_name, school_id),
                    tribes(name)
                `)
                .eq('student_id', studentId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) {
                console.error('Failed to fetch student attendance events:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching student attendance events:', error);
            return [];
        }
    }

    /**
     * Get error logs
     */
    async getErrorLogs(limit = 50, severity = null, isResolved = null) {
        try {
            let query = supabase
                .from('error_logs')
                .select(`
                    *,
                    system_events(*)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (severity) {
                query = query.eq('severity', severity);
            }

            if (isResolved !== null) {
                query = query.eq('is_resolved', isResolved);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Failed to fetch error logs:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Error fetching error logs:', error);
            return [];
        }
    }

    /**
     * Mark error as resolved
     */
    async markErrorAsResolved(errorId, resolvedBy = null) {
        try {
            const { data, error } = await supabase
                .from('error_logs')
                .update({
                    is_resolved: true,
                    resolved_at: new Date().toISOString(),
                    resolved_by: resolvedBy
                })
                .eq('id', errorId)
                .select();

            if (error) {
                console.error('Failed to mark error as resolved:', error);
                return null;
            }

            return data[0];
        } catch (error) {
            console.error('Error marking error as resolved:', error);
            return null;
        }
    }
}

// Create singleton instance
const eventLogger = new EventLogger();

// Export the singleton instance
export default eventLogger;

// Export individual logging functions for convenience
export const {
    logSystemEvent,
    logAttendanceEvent,
    logAuthEvent,
    logError,
    logQRScanAttempt,
    logQRScanSuccess,
    logQRScanFailure,
    logAttendanceRecorded,
    logDuplicateKeyHandled,
    logStudentNotFound,
    logOutsideScanningHours,
    logLoginAttempt,
    logLogout,
    logPerformanceEvent,
    getRecentEvents,
    getStudentAttendanceEvents,
    getErrorLogs,
    markErrorAsResolved
} = eventLogger; 