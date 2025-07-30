#!/usr/bin/env node

/**
 * Test Application Registration Flow
 * This script simulates the exact registration process from the Student.js component
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the exact authUtils.registerStudent function
async function registerStudent(studentData) {
    try {
        const { schoolId, lastName, firstName, birthdate } = studentData

        console.log('Registration attempt:', { schoolId, lastName, firstName, birthdate })

        // Generate password from last name and birthdate
        const password = `${lastName}${birthdate}`
        const passwordHash = await bcrypt.hash(password, 10)

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
}

async function testAppRegistration() {
    console.log('🧪 Testing application registration flow...\n');

    // Test data similar to what a user would enter
    const testStudent = {
        schoolId: 'APP-TEST-001',
        firstName: 'Jane',
        lastName: 'Smith',
        birthdate: '2002-05-15'
    };

    console.log('Testing registration with:', testStudent);

    // Test the registration
    const result = await registerStudent(testStudent);

    console.log('\nRegistration result:', result);

    if (result.success) {
        console.log('✅ Registration successful!');
        console.log('Student data:', result.data);

        // Verify the student was actually saved
        console.log('\n🔍 Verifying student was saved...');
        const { data: savedStudent, error: readError } = await supabase
            .from('students')
            .select('*')
            .eq('school_id', testStudent.schoolId);

        if (readError) {
            console.log('❌ Error reading saved student:', readError.message);
        } else if (savedStudent && savedStudent.length > 0) {
            console.log('✅ Student found in database:', savedStudent[0]);
        } else {
            console.log('❌ Student not found in database after registration');
        }
    } else {
        console.log('❌ Registration failed:', result.message);
    }

    // Show all students in database
    console.log('\n📋 All students in database:');
    const { data: allStudents, error: allError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

    if (allError) {
        console.log('❌ Error fetching all students:', allError.message);
    } else {
        console.log(`✅ Found ${allStudents.length} students:`);
        allStudents.forEach((student, index) => {
            console.log(`   ${index + 1}. ${student.school_id}: ${student.first_name} ${student.last_name} (${student.created_at})`);
        });
    }
}

testAppRegistration().catch(console.error); 