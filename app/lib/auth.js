import { createClient } from '@supabase/supabase-js'
import * as bcrypt from 'bcryptjs'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ'

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
})

// Authentication utilities for the QR attendance system
export const authUtils = {
    // Hash password using bcrypt
    async hashPassword(password) {
        const saltRounds = 10
        return await bcrypt.hash(password, saltRounds)
    },

    // Verify password
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash)
    },

    // Student registration
    async registerStudent(studentData) {
        try {
            const { schoolId, lastName, firstName, birthdate, yearLevel } = studentData

            console.log('Registration attempt:', { schoolId, lastName, firstName, birthdate, yearLevel })

            // Generate password from last name and birthdate
            const password = `${lastName}${birthdate}`
            const passwordHash = await this.hashPassword(password)

            console.log('Password hash generated')

            // Check if student already exists
            const { data: existingStudents, error: checkError } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', schoolId)

            console.log('Check existing students result:', { existingStudents, checkError })

            if (checkError) {
                console.error('Check error:', checkError)
                return { success: false, message: `Database error: ${checkError.message}` }
            }

            if (existingStudents && existingStudents.length > 0) {
                return { success: false, message: 'Student with this School ID already exists' }
            }

            // Insert new student
            const { data: newStudent, error: insertError } = await supabase
                .from('students')
                .insert({
                    school_id: schoolId,
                    first_name: firstName,
                    last_name: lastName,
                    birthdate: birthdate,
                    year_level: yearLevel,
                    password_hash: passwordHash
                })
                .select()

            console.log('Insert result:', { newStudent, insertError })

            if (insertError) {
                console.error('Insert error:', insertError)
                return { success: false, message: `Registration failed: ${insertError.message}` }
            }

            return {
                success: true,
                message: 'Student registered successfully',
                data: newStudent[0]
            }
        } catch (error) {
            console.error('Student registration error:', error)
            return { success: false, message: `Registration failed: ${error.message}` }
        }
    },

    // Faculty login
    async loginFaculty(username, password) {
        try {
            // Get faculty by username
            const { data: facultyData, error: facultyError } = await supabase
                .from('faculty')
                .select('*')
                .eq('username', username)

            if (facultyError || !facultyData || facultyData.length === 0) {
                return { success: false, message: 'Invalid credentials' }
            }

            const faculty = facultyData[0]

            // Verify password
            const isValidPassword = await this.verifyPassword(password, faculty.password_hash)

            if (!isValidPassword) {
                return { success: false, message: 'Invalid credentials' }
            }

            return {
                success: true,
                message: 'Login successful',
                faculty: {
                    id: faculty.id,
                    username: faculty.username,
                    full_name: faculty.full_name,
                    email: faculty.email,
                    role: faculty.role
                }
            }
        } catch (error) {
            console.error('Faculty login error:', error)
            return { success: false, message: 'Login failed' }
        }
    },

    // SBO Officer login
    async loginSBO(username, password) {
        try {
            // Get SBO officer by username
            const { data: officerData, error: officerError } = await supabase
                .from('sbo_officers')
                .select('*')
                .eq('username', username)

            if (officerError || !officerData || officerData.length === 0) {
                return { success: false, message: 'Invalid credentials' }
            }

            const officer = officerData[0]

            // Verify password
            const isValidPassword = await this.verifyPassword(password, officer.password_hash)

            if (!isValidPassword) {
                return { success: false, message: 'Invalid credentials' }
            }

            return {
                success: true,
                message: 'Login successful',
                officer: {
                    id: officer.id,
                    username: officer.username,
                    full_name: officer.full_name,
                    position: officer.position
                }
            }
        } catch (error) {
            console.error('SBO login error:', error)
            return { success: false, message: 'Login failed' }
        }
    },

    // Get student by school ID
    async getStudentBySchoolId(schoolId) {
        try {
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', schoolId)

            if (studentError || !studentData || studentData.length === 0) {
                return { success: false, message: 'Student not found' }
            }

            return { success: true, data: studentData[0] }
        } catch (error) {
            console.error('Get student error:', error)
            return { success: false, message: 'Failed to get student' }
        }
    },

    // Check if student has already been recorded for today
    async checkStudentAttendance(schoolId) {
        try {
            // Get student first
            const studentResult = await this.getStudentBySchoolId(schoolId)
            if (!studentResult.success) {
                return studentResult
            }

            const student = studentResult.data
            const today = new Date().toISOString().split('T')[0]

            // Check if attendance record exists for today
            const { data: existingRecords, error: checkError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', student.id)
                .eq('date', today)

            if (checkError) {
                return { success: false, message: 'Database error' }
            }

            if (existingRecords && existingRecords.length > 0) {
                const record = existingRecords[0]
                return {
                    success: true,
                    hasRecord: true,
                    data: {
                        student: student,
                        record: record,
                        status: record.time_in && record.time_out ? 'complete' : 'partial',
                        timeIn: record.time_in,
                        timeOut: record.time_out
                    }
                }
            } else {
                // Also check for any recent attendance records (last 7 days) to show history
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
                const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

                const { data: recentRecords, error: recentError } = await supabase
                    .from('attendance_records')
                    .select('*')
                    .eq('student_id', student.id)
                    .gte('date', sevenDaysAgoStr)
                    .order('date', { ascending: false })
                    .limit(5)

                if (recentError) {
                    console.error('Recent records check error:', recentError)
                }

                return {
                    success: true,
                    hasRecord: false,
                    data: {
                        student: student,
                        record: null,
                        recentRecords: recentRecords || []
                    }
                }
            }
        } catch (error) {
            console.error('Check attendance error:', error)
            return { success: false, message: 'Failed to check attendance' }
        }
    },

    // Record attendance
    async recordAttendance(schoolId, officerId) {
        try {
            // Get student
            const studentResult = await this.getStudentBySchoolId(schoolId)
            if (!studentResult.success) {
                return studentResult
            }

            const student = studentResult.data
            const today = new Date().toISOString().split('T')[0]
            const currentTime = new Date().toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })

            // Check current time window
            const now = new Date()
            const hours = now.getHours()
            const minutes = now.getMinutes()

            // Time-in window: 7:00 AM to 11:30 AM
            const isTimeInWindow = (hours >= 7 && hours < 11) || (hours === 11 && minutes <= 30)

            // Time-out window: 1:00 PM to 5:00 PM  
            const isTimeOutWindow = hours >= 13 && hours < 17

            // Check if attendance record exists for today
            const { data: existingRecords, error: checkError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('student_id', student.id)
                .eq('date', today)

            if (checkError) {
                return { success: false, message: 'Database error' }
            }

            let result

            if (existingRecords && existingRecords.length > 0) {
                // Check if we can record time-out
                if (!isTimeOutWindow) {
                    return {
                        success: false,
                        message: 'Time-out is only allowed between 1:00 PM and 5:00 PM'
                    }
                }

                // Update existing record (time-out)
                const record = existingRecords[0]

                // Check if already has time-out
                if (record.time_out) {
                    return {
                        success: false,
                        message: 'Student has already been recorded for time-out today'
                    }
                }

                const updateData = { time_out: currentTime }

                // Update status based on time-in and time-out
                if (record.time_in && record.time_out) {
                    updateData.status = 'present'
                } else if (record.time_in || record.time_out) {
                    updateData.status = 'partial'
                }

                const { data: updatedRecord, error: updateError } = await supabase
                    .from('attendance_records')
                    .update(updateData)
                    .eq('id', record.id)
                    .select()

                if (updateError) {
                    return { success: false, message: updateError.message || 'Failed to record attendance' }
                }

                result = updatedRecord[0]
            } else {
                // Check if we can record time-in
                if (!isTimeInWindow) {
                    return {
                        success: false,
                        message: 'Time-in is only allowed between 7:00 AM and 11:30 AM'
                    }
                }

                // Create new record (time-in)
                const { data: newRecord, error: insertError } = await supabase
                    .from('attendance_records')
                    .insert({
                        student_id: student.id,
                        school_id: schoolId,
                        student_name: `${student.first_name} ${student.last_name}`,
                        year_level: student.year_level,
                        date: today,
                        time_in: currentTime,
                        recorded_by: officerId,
                        status: 'partial'
                    })
                    .select()

                if (insertError) {
                    return { success: false, message: insertError.message || 'Failed to record attendance' }
                }

                result = newRecord[0]
            }

            return {
                success: true,
                message: 'Attendance recorded successfully',
                data: result
            }
        } catch (error) {
            console.error('Record attendance error:', error)
            return { success: false, message: 'Failed to record attendance' }
        }
    },

    // Get attendance records
    async getAttendanceRecords(filters = {}) {
        try {
            let query = supabase.from('attendance_records').select('*')

            if (filters.date) {
                query = query.eq('date', filters.date)
            }

            if (filters.schoolId) {
                query = query.ilike('school_id', `%${filters.schoolId}%`)
            }

            if (filters.studentName) {
                query = query.ilike('student_name', `%${filters.studentName}%`)
            }

            if (filters.yearLevel) {
                query = query.eq('year_level', filters.yearLevel)
            }

            if (filters.limit) {
                query = query.limit(filters.limit)
            }

            query = query.order('created_at', { ascending: false })

            const { data, error } = await query

            if (error) {
                return { success: false, message: 'Failed to get attendance records' }
            }

            return { success: true, data }
        } catch (error) {
            console.error('Get attendance records error:', error)
            return { success: false, message: 'Failed to get attendance records' }
        }
    },

    // Export attendance to CSV
    async exportAttendanceCSV(filters = {}) {
        try {
            const result = await this.getAttendanceRecords(filters)

            if (!result.success) {
                return result
            }

            const records = result.data

            // Create CSV content
            const headers = ['School ID', 'Student Name', 'Year Level', 'Date', 'Time In', 'Time Out', 'Status']
            const csvContent = [
                headers.join(','),
                ...records.map(record => [
                    record.school_id,
                    record.student_name,
                    record.year_level || 'N/A',
                    record.date,
                    record.time_in || '',
                    record.time_out || '',
                    record.status
                ].join(','))
            ].join('\n')

            return { success: true, data: csvContent }
        } catch (error) {
            console.error('Export CSV error:', error)
            return { success: false, message: 'Failed to export CSV' }
        }
    }
} 