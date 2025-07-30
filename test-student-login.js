#!/usr/bin/env node

/**
 * Test Student Login Functionality
 * This script tests the student login process
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Environment variables (same as auth.js)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

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
});

// Simulate the student login process from Student.js
async function testStudentLogin(schoolId, password) {
    try {
        console.log(`🔍 Testing student login for School ID: ${schoolId}`);

        // Get student data to verify credentials
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('*')
            .eq('school_id', schoolId);

        console.log('📊 Student data result:', { studentData, studentError });

        if (studentError) {
            console.log('❌ Student error:', studentError);
            return { success: false, message: `Database error: ${studentError.message}` };
        }

        if (!studentData || studentData.length === 0) {
            console.log('❌ No student found with School ID:', schoolId);
            return { success: false, message: 'Student not found. Please check your School ID.' };
        }

        const student = studentData[0];
        console.log('✅ Student found:', {
            id: student.id,
            school_id: student.school_id,
            first_name: student.first_name,
            last_name: student.last_name
        });

        // Verify password
        const isValidPassword = await bcrypt.compare(password, student.password_hash);
        console.log('🔐 Password verification result:', isValidPassword);

        if (!isValidPassword) {
            console.log('❌ Invalid password');
            return { success: false, message: 'Invalid password. Please check your credentials.' };
        }

        console.log('✅ Password verified successfully');

        return {
            success: true,
            message: 'Login successful',
            student: {
                id: student.id,
                school_id: student.school_id,
                first_name: student.first_name,
                last_name: student.last_name,
                birthdate: student.birthdate
            }
        };
    } catch (error) {
        console.error('❌ Student login error:', error);
        return { success: false, message: `Login failed: ${error.message}` };
    }
}

// Test student registration to create a test student
async function createTestStudent() {
    try {
        console.log('👤 Creating test student...');

        const testStudent = {
            school_id: 'TEST-2024-001',
            first_name: 'Test',
            last_name: 'Student',
            birthdate: '2000-01-01'
        };

        // Generate password from last name and birthdate
        const password = `${testStudent.last_name}${testStudent.birthdate}`;
        const passwordHash = await bcrypt.hash(password, 10);

        console.log('🔐 Generated password:', password);

        // Check if student already exists
        const { data: existingStudents, error: checkError } = await supabase
            .from('students')
            .select('*')
            .eq('school_id', testStudent.school_id);

        if (checkError) {
            console.log('❌ Check error:', checkError);
            return null;
        }

        if (existingStudents && existingStudents.length > 0) {
            console.log('✅ Test student already exists');
            return { ...testStudent, password };
        }

        // Insert new student
        const { data: newStudent, error: insertError } = await supabase
            .from('students')
            .insert({
                school_id: testStudent.school_id,
                first_name: testStudent.first_name,
                last_name: testStudent.last_name,
                birthdate: testStudent.birthdate,
                password_hash: passwordHash
            })
            .select();

        if (insertError) {
            console.log('❌ Insert error:', insertError);
            return null;
        }

        console.log('✅ Test student created successfully');
        return { ...testStudent, password };
    } catch (error) {
        console.error('❌ Create test student error:', error);
        return null;
    }
}

async function runTests() {
    console.log('🧪 Testing Student Login Functionality...\n');

    try {
        // Create a test student first
        const testStudent = await createTestStudent();

        if (!testStudent) {
            console.log('❌ Failed to create test student');
            return;
        }

        console.log('\n📋 Test Student Details:');
        console.log('School ID:', testStudent.school_id);
        console.log('Password:', testStudent.password);

        // Test successful login
        console.log('\n👤 Testing successful login...');
        const successResult = await testStudentLogin(testStudent.school_id, testStudent.password);

        console.log('\n📋 Success Login Result:');
        console.log('Success:', successResult.success);
        console.log('Message:', successResult.message);

        if (successResult.success) {
            console.log('Student Data:', successResult.student);
        }

        // Test with wrong password
        console.log('\n👤 Testing with wrong password...');
        const wrongPasswordResult = await testStudentLogin(testStudent.school_id, 'wrongpassword');
        console.log('Wrong password result:', wrongPasswordResult);

        // Test with non-existent student
        console.log('\n👤 Testing with non-existent student...');
        const nonExistentResult = await testStudentLogin('NONEXISTENT-2024-001', 'password');
        console.log('Non-existent student result:', nonExistentResult);

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

runTests().catch(console.error); 