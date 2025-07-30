#!/usr/bin/env node

/**
 * Debug Registration Issues
 * This script will help identify why registrations might not be saving
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugRegistration() {
    console.log('🔍 Debugging registration issues...\n');

    try {
        // Check current students in database
        console.log('1. Checking current students in database...');
        const { data: existingStudents, error: studentsError } = await supabase
            .from('students')
            .select('*');

        if (studentsError) {
            console.log('❌ Error fetching students:', studentsError.message);
        } else {
            console.log(`✅ Found ${existingStudents.length} students in database:`);
            existingStudents.forEach(student => {
                console.log(`   - ${student.school_id}: ${student.first_name} ${student.last_name}`);
            });
        }

        // Test a real registration
        console.log('\n2. Testing a real student registration...');
        const testStudent = {
            schoolId: 'TEST-2024-001',
            firstName: 'John',
            lastName: 'Doe',
            birthdate: '2000-01-01'
        };

        console.log('Attempting to register:', testStudent);

        // Try direct insertion
        const { data: insertResult, error: insertError } = await supabase
            .from('students')
            .insert({
                school_id: testStudent.schoolId,
                first_name: testStudent.firstName,
                last_name: testStudent.lastName,
                birthdate: testStudent.birthdate,
                password_hash: 'test_hash_123'
            })
            .select();

        if (insertError) {
            console.log('❌ Direct insertion failed:', insertError.message);

            if (insertError.message.includes('duplicate key')) {
                console.log('💡 Student already exists, trying to update...');

                // Try to update existing student
                const { data: updateResult, error: updateError } = await supabase
                    .from('students')
                    .update({
                        first_name: testStudent.firstName + ' Updated',
                        password_hash: 'updated_hash_123'
                    })
                    .eq('school_id', testStudent.schoolId)
                    .select();

                if (updateError) {
                    console.log('❌ Update failed:', updateError.message);
                } else {
                    console.log('✅ Update successful:', updateResult[0]);
                }
            }
        } else {
            console.log('✅ Direct insertion successful:', insertResult[0]);
        }

        // Check RLS policies
        console.log('\n3. Checking RLS policies...');
        try {
            const { data: policies, error: policiesError } = await supabase
                .rpc('get_rls_policies', { table_name: 'students' });

            if (policiesError) {
                console.log('⚠️  Could not check RLS policies:', policiesError.message);
                console.log('💡 This might be a permissions issue');
            } else {
                console.log('✅ RLS policies found:', policies);
            }
        } catch (error) {
            console.log('⚠️  RLS check failed:', error.message);
        }

        // Test reading data
        console.log('\n4. Testing data reading...');
        const { data: readResult, error: readError } = await supabase
            .from('students')
            .select('*')
            .eq('school_id', testStudent.schoolId);

        if (readError) {
            console.log('❌ Read test failed:', readError.message);
        } else {
            console.log(`✅ Read test successful: Found ${readResult.length} records`);
            if (readResult.length > 0) {
                console.log('   Student data:', readResult[0]);
            }
        }

        // Check if we can see all students
        console.log('\n5. Checking if we can see all students...');
        const { data: allStudents, error: allError } = await supabase
            .from('students')
            .select('*');

        if (allError) {
            console.log('❌ Cannot read all students:', allError.message);
        } else {
            console.log(`✅ Can read all students: ${allStudents.length} total`);
        }

    } catch (error) {
        console.error('❌ Debug error:', error.message);
    }
}

debugRegistration().catch(console.error); 