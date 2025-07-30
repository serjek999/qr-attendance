#!/usr/bin/env node

/**
 * Check Current Table Structure
 * This script will show you the current structure of your tables
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
    console.log('🔍 Checking current table structure...\n');

    try {
        // Check students table structure
        console.log('📋 Students table structure:');
        const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .limit(1);

        if (studentsError) {
            console.log('❌ Error accessing students table:', studentsError.message);
        } else {
            console.log('✅ Students table exists');
            if (studentsData && studentsData.length > 0) {
                console.log('Columns:', Object.keys(studentsData[0]));
            } else {
                console.log('Table is empty');
            }
        }

        // Check faculty table structure
        console.log('\n📋 Faculty table structure:');
        const { data: facultyData, error: facultyError } = await supabase
            .from('faculty')
            .select('*')
            .limit(1);

        if (facultyError) {
            console.log('❌ Error accessing faculty table:', facultyError.message);
        } else {
            console.log('✅ Faculty table exists');
            if (facultyData && facultyData.length > 0) {
                console.log('Columns:', Object.keys(facultyData[0]));
            } else {
                console.log('Table is empty');
            }
        }

        // Check sbo_officers table structure
        console.log('\n📋 SBO Officers table structure:');
        const { data: sboData, error: sboError } = await supabase
            .from('sbo_officers')
            .select('*')
            .limit(1);

        if (sboError) {
            console.log('❌ Error accessing sbo_officers table:', sboError.message);
        } else {
            console.log('✅ SBO Officers table exists');
            if (sboData && sboData.length > 0) {
                console.log('Columns:', Object.keys(sboData[0]));
            } else {
                console.log('Table is empty');
            }
        }

        // Check attendance_records table structure
        console.log('\n📋 Attendance Records table structure:');
        const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance_records')
            .select('*')
            .limit(1);

        if (attendanceError) {
            console.log('❌ Error accessing attendance_records table:', attendanceError.message);
        } else {
            console.log('✅ Attendance Records table exists');
            if (attendanceData && attendanceData.length > 0) {
                console.log('Columns:', Object.keys(attendanceData[0]));
            } else {
                console.log('Table is empty');
            }
        }

    } catch (error) {
        console.error('❌ Error checking table structure:', error.message);
    }
}

checkTableStructure().catch(console.error); 