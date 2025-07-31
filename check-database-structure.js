#!/usr/bin/env node

/**
 * Check Database Structure
 * This script checks the actual structure of the database tables
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
    console.log('🔍 Checking database structure...\n');

    try {
        // Check admins table
        console.log('👨‍💼 Checking admins table...');
        const { data: admins, error: adminsError } = await supabase
            .from('admins')
            .select('*')
            .limit(1);

        if (adminsError) {
            console.log('❌ Error accessing admins table:', adminsError.message);
        } else {
            console.log('✅ Admins table accessible');
            if (admins && admins.length > 0) {
                console.log('Sample admin record:', admins[0]);
            } else {
                console.log('No admin records found');
            }
        }

        // Check faculty table
        console.log('\n👨‍🏫 Checking faculty table...');
        const { data: faculty, error: facultyError } = await supabase
            .from('faculty')
            .select('*')
            .limit(1);

        if (facultyError) {
            console.log('❌ Error accessing faculty table:', facultyError.message);
        } else {
            console.log('✅ Faculty table accessible');
            if (faculty && faculty.length > 0) {
                console.log('Sample faculty record:', faculty[0]);
            } else {
                console.log('No faculty records found');
            }
        }

        // Check sbo_officers table
        console.log('\n👮‍♂️ Checking sbo_officers table...');
        const { data: sboOfficers, error: sboError } = await supabase
            .from('sbo_officers')
            .select('*')
            .limit(1);

        if (sboError) {
            console.log('❌ Error accessing sbo_officers table:', sboError.message);
        } else {
            console.log('✅ SBO officers table accessible');
            if (sboOfficers && sboOfficers.length > 0) {
                console.log('Sample SBO officer record:', sboOfficers[0]);
            } else {
                console.log('No SBO officer records found');
            }
        }

        // Check students table
        console.log('\n👨‍🎓 Checking students table...');
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .limit(1);

        if (studentsError) {
            console.log('❌ Error accessing students table:', studentsError.message);
        } else {
            console.log('✅ Students table accessible');
            if (students && students.length > 0) {
                console.log('Sample student record:', students[0]);
            } else {
                console.log('No student records found');
            }
        }

    } catch (error) {
        console.error('❌ Error checking database structure:', error.message);
    }
}

checkDatabaseStructure().catch(console.error); 