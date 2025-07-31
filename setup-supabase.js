#!/usr/bin/env node

/**
 * Supabase Setup Script
 * This script helps you test your Supabase connection and verify the setup
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Environment variables - these should be set in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

// For setup, we need to use the service role key to bypass RLS
// You should set this in your environment variables
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
    console.log('⚠️  No service role key found. Using anon key (may have RLS restrictions)...');
    console.log('For full setup, set SUPABASE_SERVICE_ROLE_KEY in your environment variables.');
}

// Create Supabase client with service role key if available
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Hash password helper
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

async function setupSupabase() {
    console.log('Setting up Supabase database...');

    try {
        // 1. Insert tribes (if they don't exist)
        console.log('Setting up tribes...');
        const tribes = [
            { name: 'Alpha', color: 'bg-blue-500' },
            { name: 'Beta', color: 'bg-green-500' },
            { name: 'Gamma', color: 'bg-purple-500' },
            { name: 'Delta', color: 'bg-orange-500' },
            { name: 'Epsilon', color: 'bg-red-500' }
        ];

        for (const tribe of tribes) {
            const { error } = await supabase
                .from('tribes')
                .upsert(tribe, { onConflict: 'name' });

            if (error) {
                console.error(`Error inserting tribe ${tribe.name}:`, error.message);
            } else {
                console.log(`✓ Tribe ${tribe.name} set up`);
            }
        }

        // 2. Insert admin user
        console.log('Setting up admin user...');
        const adminPassword = await hashPassword('admin123');
        const { error: adminError } = await supabase
            .from('admins')
            .upsert({
                username: 'admin',
                password_hash: adminPassword,
                full_name: 'System Administrator',
                email: 'admin@school.edu',
                role: 'admin'
            }, { onConflict: 'username' });

        if (adminError) {
            console.error('Error inserting admin:', adminError.message);
        } else {
            console.log('✓ Admin user set up');
        }

        // 3. Insert faculty user
        console.log('Setting up faculty user...');
        const facultyPassword = await hashPassword('faculty123');
        const { error: facultyError } = await supabase
            .from('faculty')
            .upsert({
                username: 'faculty',
                password_hash: facultyPassword,
                full_name: 'Faculty Member',
                email: 'faculty@school.edu',
                role: 'faculty'
            }, { onConflict: 'username' });

        if (facultyError) {
            console.error('Error inserting faculty:', facultyError.message);
        } else {
            console.log('✓ Faculty user set up');
        }

        // 4. Insert SBO officer
        console.log('Setting up SBO officer...');
        const sboPassword = await hashPassword('sbo123');
        const { error: sboError } = await supabase
            .from('sbo_officers')
            .upsert({
                username: 'sbo',
                password_hash: sboPassword,
                full_name: 'SBO Officer',
                position: 'President'
            }, { onConflict: 'username' });

        if (sboError) {
            console.error('Error inserting SBO officer:', sboError.message);
        } else {
            console.log('✓ SBO officer set up');
        }

        // 5. Insert sample students
        console.log('Setting up sample students...');
        const sampleStudents = [
            {
                school_id: '2023123456',
                first_name: 'John',
                last_name: 'Smith',
                middle_name: 'Michael',
                year_level: 'y1',
                tribe_id: null // Will be set after getting tribe ID
            },
            {
                school_id: '2023987654',
                first_name: 'Jane',
                last_name: 'Doe',
                middle_name: 'Elizabeth',
                year_level: 'y2',
                tribe_id: null
            }
        ];

        // Get tribe IDs first
        const { data: tribeData } = await supabase
            .from('tribes')
            .select('id, name')
            .limit(2);

        if (tribeData && tribeData.length >= 2) {
            sampleStudents[0].tribe_id = tribeData[0].id;
            sampleStudents[1].tribe_id = tribeData[1].id;

            for (const student of sampleStudents) {
                const studentPassword = await hashPassword(`${student.last_name}2023-01-15`);
                const { error: studentError } = await supabase
                    .from('students')
                    .upsert({
                        ...student,
                        password_hash: studentPassword
                    }, { onConflict: 'school_id' });

                if (studentError) {
                    console.error(`Error inserting student ${student.school_id}:`, studentError.message);
                } else {
                    console.log(`✓ Student ${student.school_id} set up`);
                }
            }
        }

        console.log('\n✅ Supabase setup completed successfully!');
        console.log('\nTest Credentials:');
        console.log('Admin: admin / admin123');
        console.log('Faculty: faculty / faculty123');
        console.log('SBO: sbo / sbo123');
        console.log('Student 1: 2023123456 / Smith2023-01-15');
        console.log('Student 2: 2023987654 / Doe2023-01-15');

        if (!supabaseServiceKey) {
            console.log('\n⚠️  Note: Some operations may have failed due to RLS policies.');
            console.log('To bypass RLS, set SUPABASE_SERVICE_ROLE_KEY in your environment variables.');
        }

    } catch (error) {
        console.error('Setup failed:', error);
    }
}

// Run the setup
setupSupabase(); 