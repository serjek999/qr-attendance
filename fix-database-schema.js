#!/usr/bin/env node

/**
 * Fix Database Schema
 * This script will drop existing tables and recreate them with the correct structure
 */

const { createClient } = require('@supabase/supabase-js');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseSchema() {
    console.log('🔧 Fixing database schema...\n');

    try {
        // Drop existing tables if they exist
        console.log('🗑️  Dropping existing tables...');

        const tablesToDrop = [
            'attendance_records',
            'sbo_officers',
            'faculty',
            'students'
        ];

        for (const table of tablesToDrop) {
            try {
                const { error } = await supabase.rpc('drop_table_if_exists', { table_name: table });
                if (error) {
                    console.log(`⚠️  Could not drop ${table}:`, error.message);
                } else {
                    console.log(`✅ Dropped table: ${table}`);
                }
            } catch (error) {
                console.log(`⚠️  Error dropping ${table}:`, error.message);
            }
        }

        console.log('\n📋 Creating tables with correct structure...');

        // Create students table
        console.log('Creating students table...');
        const { error: studentsError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE students (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    school_id VARCHAR(20) UNIQUE NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    birthdate DATE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        if (studentsError) {
            console.log('❌ Error creating students table:', studentsError.message);
        } else {
            console.log('✅ Students table created');
        }

        // Create faculty table
        console.log('Creating faculty table...');
        const { error: facultyError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE faculty (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(200) NOT NULL,
                    email VARCHAR(255),
                    role VARCHAR(50) DEFAULT 'faculty',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        if (facultyError) {
            console.log('❌ Error creating faculty table:', facultyError.message);
        } else {
            console.log('✅ Faculty table created');
        }

        // Create sbo_officers table
        console.log('Creating sbo_officers table...');
        const { error: sboError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE sbo_officers (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(200) NOT NULL,
                    position VARCHAR(100),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        if (sboError) {
            console.log('❌ Error creating sbo_officers table:', sboError.message);
        } else {
            console.log('✅ SBO Officers table created');
        }

        // Create attendance_records table
        console.log('Creating attendance_records table...');
        const { error: attendanceError } = await supabase.rpc('exec_sql', {
            sql: `
                CREATE TABLE attendance_records (
                    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                    school_id VARCHAR(20) NOT NULL,
                    student_name VARCHAR(200) NOT NULL,
                    date DATE NOT NULL,
                    time_in TIME,
                    time_out TIME,
                    status VARCHAR(20) DEFAULT 'absent' CHECK (status IN ('present', 'partial', 'absent')),
                    recorded_by UUID REFERENCES sbo_officers(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(student_id, date)
                );
            `
        });

        if (attendanceError) {
            console.log('❌ Error creating attendance_records table:', attendanceError.message);
        } else {
            console.log('✅ Attendance Records table created');
        }

        console.log('\n🎉 Database schema fixed!');
        console.log('\nNext steps:');
        console.log('1. Run the test script: npm run test-supabase');
        console.log('2. Try registering a student in your application');

    } catch (error) {
        console.error('❌ Error fixing database schema:', error.message);
    }
}

fixDatabaseSchema().catch(console.error); 