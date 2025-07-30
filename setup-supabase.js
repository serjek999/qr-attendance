#!/usr/bin/env node

/**
 * Supabase Setup Script
 * This script helps you test your Supabase connection and verify the setup
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Environment variables not found!');
    console.log('Please create a .env.local file with:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your-supabase-url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔍 Testing Supabase connection...');

    try {
        // Test basic connection
        const { data, error } = await supabase.from('students').select('count').limit(1);

        if (error) {
            console.error('❌ Connection failed:', error.message);
            return false;
        }

        console.log('✅ Connection successful!');
        return true;
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        return false;
    }
}

async function checkTables() {
    console.log('\n📋 Checking database tables...');

    const tables = ['students', 'faculty', 'sbo_officers', 'attendance_records'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*').limit(1);

            if (error) {
                console.log(`❌ Table '${table}': ${error.message}`);
            } else {
                console.log(`✅ Table '${table}': OK`);
            }
        } catch (error) {
            console.log(`❌ Table '${table}': ${error.message}`);
        }
    }
}

async function createSampleData() {
    console.log('\n👥 Creating sample data...');

    try {
        // Create sample faculty
        const facultyPassword = await bcrypt.hash('password', 10);
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
            console.log('⚠️  Faculty creation:', facultyError.message);
        } else {
            console.log('✅ Sample faculty created');
        }

        // Create sample SBO officer
        const sboPassword = await bcrypt.hash('password', 10);
        const { error: sboError } = await supabase
            .from('sbo_officers')
            .upsert({
                username: 'sbo',
                password_hash: sboPassword,
                full_name: 'SBO Officer',
                position: 'General Secretary'
            }, { onConflict: 'username' });

        if (sboError) {
            console.log('⚠️  SBO officer creation:', sboError.message);
        } else {
            console.log('✅ Sample SBO officer created');
        }

    } catch (error) {
        console.error('❌ Error creating sample data:', error.message);
    }
}

async function testAuthentication() {
    console.log('\n🔐 Testing authentication...');

    try {
        // Test faculty login
        const facultyPassword = 'password';
        const { data: facultyData, error: facultyError } = await supabase
            .from('faculty')
            .select('*')
            .eq('username', 'faculty')
            .single();

        if (facultyError || !facultyData) {
            console.log('❌ Faculty authentication test failed');
            return;
        }

        const isValidPassword = await bcrypt.compare(facultyPassword, facultyData.password_hash);

        if (isValidPassword) {
            console.log('✅ Faculty authentication: OK');
        } else {
            console.log('❌ Faculty authentication: Failed');
        }

        // Test SBO login
        const { data: sboData, error: sboError } = await supabase
            .from('sbo_officers')
            .select('*')
            .eq('username', 'sbo')
            .single();

        if (sboError || !sboData) {
            console.log('❌ SBO authentication test failed');
            return;
        }

        const isValidSboPassword = await bcrypt.compare(facultyPassword, sboData.password_hash);

        if (isValidSboPassword) {
            console.log('✅ SBO authentication: OK');
        } else {
            console.log('❌ SBO authentication: Failed');
        }

    } catch (error) {
        console.error('❌ Authentication test error:', error.message);
    }
}

async function main() {
    console.log('🚀 Supabase Setup Script\n');

    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
        process.exit(1);
    }

    // Check tables
    await checkTables();

    // Create sample data
    await createSampleData();

    // Test authentication
    await testAuthentication();

    console.log('\n🎉 Setup complete!');
    console.log('\nDemo credentials:');
    console.log('Faculty - Username: faculty, Password: password');
    console.log('SBO - Username: sbo, Password: password');
    console.log('\nYou can now run your application with: npm run dev');
}

// Run the script
main().catch(console.error); 