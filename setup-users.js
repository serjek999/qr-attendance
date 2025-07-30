#!/usr/bin/env node

/**
 * Setup Users
 * This script creates all necessary users for the QR attendance system
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupUsers() {
    console.log('👥 Setting up users for QR Attendance System...\n');

    try {
        // Check existing users
        console.log('📋 Checking existing users...');

        const { data: existingFaculty, error: facultyError } = await supabase
            .from('faculty')
            .select('*');

        const { data: existingSBO, error: sboError } = await supabase
            .from('sbo_officers')
            .select('*');

        if (facultyError) {
            console.log('❌ Error checking faculty:', facultyError.message);
        } else {
            console.log(`✅ Found ${existingFaculty.length} faculty members`);
        }

        if (sboError) {
            console.log('❌ Error checking SBO officers:', sboError.message);
        } else {
            console.log(`✅ Found ${existingSBO.length} SBO officers`);
        }

        // Create Riza as faculty user
        console.log('\n👨‍🏫 Creating faculty user (Riza)...');
        const rizaPassword = await bcrypt.hash('riza123', 10);

        const { data: newFaculty, error: createFacultyError } = await supabase
            .from('faculty')
            .insert({
                username: 'riza',
                password_hash: rizaPassword,
                full_name: 'Riza Faculty',
                email: 'riza@school.edu',
                role: 'faculty'
            })
            .select();

        if (createFacultyError) {
            console.log('❌ Error creating faculty:', createFacultyError.message);
        } else {
            console.log('✅ Faculty user (Riza) created:', newFaculty[0]);
        }

        // Create Jake as SBO officer
        console.log('\n👮‍♂️ Creating SBO officer (Jake)...');
        const jakePassword = await bcrypt.hash('jake123', 10);

        const { data: newSBO, error: createSBOError } = await supabase
            .from('sbo_officers')
            .insert({
                username: 'jake',
                password_hash: jakePassword,
                full_name: 'Jake SBO Officer',
                position: 'General Secretary'
            })
            .select();

        if (createSBOError) {
            console.log('❌ Error creating SBO officer:', createSBOError.message);
        } else {
            console.log('✅ SBO officer (Jake) created:', newSBO[0]);
        }

        // Test login for both users
        console.log('\n🧪 Testing login functionality...');

        // Test faculty login
        console.log('Testing faculty login (Riza)...');
        const facultyResult = await testLogin('faculty', 'riza', 'riza123');
        if (facultyResult.success) {
            console.log('✅ Faculty login successful!');
        } else {
            console.log('❌ Faculty login failed:', facultyResult.message);
        }

        // Test SBO login
        console.log('Testing SBO login (Jake)...');
        const sboResult = await testLogin('sbo_officers', 'jake', 'jake123');
        if (sboResult.success) {
            console.log('✅ SBO login successful!');
        } else {
            console.log('❌ SBO login failed:', sboResult.message);
        }

        console.log('\n🎉 User setup complete!');
        console.log('\n📝 Login Credentials:');
        console.log('Faculty (Riza) - Username: riza, Password: riza123');
        console.log('SBO (Jake) - Username: jake, Password: jake123');

    } catch (error) {
        console.error('❌ Setup error:', error.message);
    }
}

async function testLogin(table, username, password) {
    try {
        const { data: userData, error: userError } = await supabase
            .from(table)
            .select('*')
            .eq('username', username);

        if (userError || !userData || userData.length === 0) {
            return { success: false, message: 'User not found' };
        }

        const user = userData[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return { success: false, message: 'Invalid password' };
        }

        return { success: true, message: 'Login successful' };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

setupUsers().catch(console.error); 