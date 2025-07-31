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
            const { schoolId, lastName, firstName, middleName, birthdate, yearLevel, tribe } = studentData

            console.log('Registration attempt:', { schoolId, lastName, firstName, middleName, birthdate, yearLevel, tribe })

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
                    full_name: `${firstName} ${lastName}`,
                    birthdate: birthdate,
                    tribe_id: tribe,
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
    async loginFaculty(email, password) {
        try {
            // Get faculty by email
            const { data: facultyData, error: facultyError } = await supabase
                .from('faculty')
                .select('*')
                .eq('email', email)

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
                    email: faculty.email,
                    full_name: faculty.full_name
                }
            }
        } catch (error) {
            console.error('Faculty login error:', error)
            return { success: false, message: 'Login failed' }
        }
    },

    // SBO Officer login
    async loginSBO(email, password) {
        try {
            // Get SBO officer by email
            const { data: officerData, error: officerError } = await supabase
                .from('sbo_officers')
                .select('*')
                .eq('email', email)

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
                    email: officer.email,
                    full_name: officer.full_name
                }
            }
        } catch (error) {
            console.error('SBO login error:', error)
            return { success: false, message: 'Login failed' }
        }
    },

    // Admin login
    async loginAdmin(email, password) {
        try {
            // Get admin by email
            const { data: adminData, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .eq('email', email)

            if (adminError || !adminData || adminData.length === 0) {
                return { success: false, message: 'Invalid credentials' }
            }

            const admin = adminData[0]

            // Verify password
            const isValidPassword = await this.verifyPassword(password, admin.password_hash)

            if (!isValidPassword) {
                return { success: false, message: 'Invalid credentials' }
            }

            return {
                success: true,
                message: 'Login successful',
                admin: {
                    id: admin.id,
                    email: admin.email,
                    full_name: admin.full_name
                }
            }
        } catch (error) {
            console.error('Admin login error:', error)
            return { success: false, message: 'Login failed' }
        }
    },

    // Student login
    async loginStudent(schoolId, password) {
        try {
            // Get student by school ID
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*')
                .eq('school_id', schoolId)

            if (studentError || !studentData || studentData.length === 0) {
                return { success: false, message: 'Student not found' }
            }

            const student = studentData[0]

            // Verify password
            const isValidPassword = await this.verifyPassword(password, student.password_hash)

            if (!isValidPassword) {
                return { success: false, message: 'Invalid password' }
            }

            return {
                success: true,
                message: 'Login successful',
                student: {
                    id: student.id,
                    school_id: student.school_id,
                    full_name: student.full_name,
                    birthdate: student.birthdate,
                    tribe_id: student.tribe_id
                }
            }
        } catch (error) {
            console.error('Student login error:', error)
            return { success: false, message: 'Login failed' }
        }
    },

    // Get student by school ID
    async getStudentBySchoolId(schoolId) {
        try {
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('*, tribes(name)')
                .eq('school_id', schoolId)

            if (studentError || !studentData || studentData.length === 0) {
                return { success: false, message: 'Student not found' }
            }

            return { success: true, data: studentData[0] }
        } catch (error) {
            console.error('Get student error:', error)

            // Provide more specific error messages
            let errorMessage = 'Failed to get student';
            if (error.message) {
                if (error.message.includes('network') || error.message.includes('connection')) {
                    errorMessage = 'Network connection error. Please check your internet connection.';
                } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                    errorMessage = 'Permission denied. Please check your login credentials.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timeout. Please try again.';
                } else {
                    errorMessage = `Database error: ${error.message}`;
                }
            }

            return { success: false, message: errorMessage }
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

            // Provide more specific error messages
            let errorMessage = 'Failed to check attendance';
            if (error.message) {
                if (error.message.includes('network') || error.message.includes('connection')) {
                    errorMessage = 'Network connection error. Please check your internet connection.';
                } else if (error.message.includes('permission') || error.message.includes('unauthorized')) {
                    errorMessage = 'Permission denied. Please check your login credentials.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timeout. Please try again.';
                } else {
                    errorMessage = `Database error: ${error.message}`;
                }
            }

            return { success: false, message: errorMessage }
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
                        tribe_id: student.tribe_id,
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
    },

    // ====================
    // TRIBE FUNCTIONS
    // ====================

    // Get all tribes with their statistics
    async getAllTribes() {
        try {
            // Get all tribes
            const { data: tribes, error: tribesError } = await supabase
                .from('tribes')
                .select('*')
                .order('name')

            if (tribesError) {
                console.error('Error fetching tribes:', tribesError)
                return { success: false, message: 'Failed to fetch tribes' }
            }

            // Get tribe statistics
            const tribesWithStats = await Promise.all(
                tribes.map(async (tribe) => {
                    const stats = await this.getTribeStats(tribe.id)
                    return {
                        ...tribe,
                        stats: stats.success ? stats.data : {
                            memberCount: 0,
                            totalScore: 0,
                            todayScore: 0,
                            attendanceRate: 0,
                            postsCount: 0
                        }
                    }
                })
            )

            // Calculate rankings
            const rankedTribes = tribesWithStats
                .map(tribe => ({
                    ...tribe,
                    rank: 0 // Will be calculated below
                }))
                .sort((a, b) => b.stats.totalScore - a.stats.totalScore)
                .map((tribe, index) => ({
                    ...tribe,
                    rank: index + 1
                }))

            return { success: true, data: rankedTribes }
        } catch (error) {
            console.error('Get all tribes error:', error)
            return { success: false, message: 'Failed to get tribes' }
        }
    },

    // Get specific tribe with detailed statistics
    async getTribeDetails(tribeId) {
        try {
            // Get tribe information
            const { data: tribe, error: tribeError } = await supabase
                .from('tribes')
                .select('*')
                .eq('id', tribeId)
                .single()

            if (tribeError || !tribe) {
                return { success: false, message: 'Tribe not found' }
            }

            // Get tribe statistics
            const stats = await this.getTribeStats(tribeId)
            const members = await this.getTribeMembers(tribeId)
            const recentActivity = await this.getTribeRecentActivity(tribeId)

            return {
                success: true,
                data: {
                    ...tribe,
                    stats: stats.success ? stats.data : {},
                    members: members.success ? members.data : [],
                    recentActivity: recentActivity.success ? recentActivity.data : []
                }
            }
        } catch (error) {
            console.error('Get tribe details error:', error)
            return { success: false, message: 'Failed to get tribe details' }
        }
    },

    // Get tribe statistics
    async getTribeStats(tribeId) {
        try {
            // Get member count
            const { data: members, error: membersError } = await supabase
                .from('students')
                .select('id')
                .eq('tribe_id', tribeId)

            if (membersError) {
                console.error('Error fetching tribe members:', membersError)
                return { success: false, message: 'Failed to fetch tribe members' }
            }

            const memberCount = members.length

            // Get attendance records for this tribe
            const today = new Date().toISOString().split('T')[0]
            const { data: todayAttendance, error: todayError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('tribe_id', tribeId)
                .eq('date', today)

            if (todayError) {
                console.error('Error fetching today attendance:', todayError)
                return { success: false, message: 'Failed to fetch today attendance' }
            }

            // Get all attendance records for this tribe (last 30 days for total score)
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
            const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

            const { data: allAttendance, error: allError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('tribe_id', tribeId)
                .gte('date', thirtyDaysAgoStr)

            if (allError) {
                console.error('Error fetching all attendance:', allError)
                return { success: false, message: 'Failed to fetch attendance records' }
            }

            // Calculate scores
            const todayScore = todayAttendance.length * 10 // 10 points per attendance
            const totalScore = allAttendance.length * 10

            // Calculate attendance rate (last 7 days)
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

            const { data: weekAttendance, error: weekError } = await supabase
                .from('attendance_records')
                .select('*')
                .eq('tribe_id', tribeId)
                .gte('date', sevenDaysAgoStr)

            if (weekError) {
                console.error('Error fetching week attendance:', weekError)
                return { success: false, message: 'Failed to fetch week attendance' }
            }

            const attendanceRate = memberCount > 0 ? Math.round((weekAttendance.length / (memberCount * 7)) * 100) : 0

            // Get posts count
            const { data: posts, error: postsError } = await supabase
                .from('posts')
                .select('id')
                .eq('tribe_id', tribeId)
                .eq('approved', true)

            if (postsError) {
                console.error('Error fetching posts:', postsError)
                return { success: false, message: 'Failed to fetch posts' }
            }

            const postsCount = posts.length

            return {
                success: true,
                data: {
                    memberCount,
                    totalScore,
                    todayScore,
                    attendanceRate,
                    postsCount
                }
            }
        } catch (error) {
            console.error('Get tribe stats error:', error)
            return { success: false, message: 'Failed to get tribe statistics' }
        }
    },

    // Get tribe members
    async getTribeMembers(tribeId) {
        try {
            const { data: members, error } = await supabase
                .from('students')
                .select('id, school_id, full_name, created_at')
                .eq('tribe_id', tribeId)
                .order('full_name')

            if (error) {
                console.error('Error fetching tribe members:', error)
                return { success: false, message: 'Failed to fetch tribe members' }
            }

            return { success: true, data: members }
        } catch (error) {
            console.error('Get tribe members error:', error)
            return { success: false, message: 'Failed to get tribe members' }
        }
    },

    // Get tribe recent activity
    async getTribeRecentActivity(tribeId) {
        try {
            // Get recent attendance records
            const { data: attendance, error: attendanceError } = await supabase
                .from('attendance_records')
                .select(`
                    *,
                    students!inner(school_id, full_name)
                `)
                .eq('tribe_id', tribeId)
                .order('created_at', { ascending: false })
                .limit(10)

            if (attendanceError) {
                console.error('Error fetching attendance activity:', attendanceError)
                return { success: false, message: 'Failed to fetch attendance activity' }
            }

            // Get recent posts
            const { data: posts, error: postsError } = await supabase
                .from('posts')
                .select(`
                    *,
                    students!inner(school_id, full_name)
                `)
                .eq('tribe_id', tribeId)
                .eq('approved', true)
                .order('created_at', { ascending: false })
                .limit(10)

            if (postsError) {
                console.error('Error fetching posts activity:', postsError)
                return { success: false, message: 'Failed to fetch posts activity' }
            }

            // Combine and format activities
            const activities = [
                ...attendance.map(record => ({
                    type: 'attendance',
                    message: `${record.students.full_name} (${record.students.school_id}) recorded attendance`,
                    time: new Date(record.created_at).toLocaleString(),
                    points: 10,
                    data: record
                })),
                ...posts.map(post => ({
                    type: 'post',
                    message: `${post.students.full_name} (${post.students.school_id}) shared a post`,
                    time: new Date(post.created_at).toLocaleString(),
                    points: 5,
                    data: post
                }))
            ].sort((a, b) => new Date(b.data.created_at) - new Date(a.data.created_at))
                .slice(0, 10)

            return { success: true, data: activities }
        } catch (error) {
            console.error('Get tribe recent activity error:', error)
            return { success: false, message: 'Failed to get tribe recent activity' }
        }
    }
} 