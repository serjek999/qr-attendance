#!/usr/bin/env node

/**
 * Test Supabase Connection and Database Setup
 * Run this script to verify your Supabase configuration
 */

const { createClient } = require('@supabase/supabase-js');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

console.log('🔍 Testing Supabase Configuration...\n');

console.log('Environment Variables:');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');
console.log('');

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('1. Testing basic connection...');

    try {
        // Test basic connection
        const { data, error } = await supabase.from('students').select('count').limit(1);

        if (error) {
            console.log('❌ Connection failed:', error.message);

            if (error.message.includes('relation "students" does not exist')) {
                console.log('💡 The "students" table does not exist. You need to run the database schema.');
                console.log('   Go to your Supabase dashboard → SQL Editor → Run supabase-schema.sql');
            }

            return false;
        }

        console.log('✅ Connection successful!');
        return true;
    } catch (error) {
        console.log('❌ Connection error:', error.message);
        return false;
    }
}

async function checkTables() {
    console.log('\n2. Checking database tables...');

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

async function testStudentRegistration() {
    console.log('\n3. Testing student registration...');

    try {
        const testData = {
            schoolId: 'TEST-001',
            firstName: 'Test',
            lastName: 'Student',
            birthdate: '2000-01-01'
        };

        // Try to insert a test student
        const { data, error } = await supabase
            .from('students')
            .insert({
                school_id: testData.schoolId,
                first_name: testData.firstName,
                last_name: testData.lastName,
                birthdate: testData.birthdate,
                password_hash: 'test_hash'
            })
            .select();

        if (error) {
            console.log('❌ Registration test failed:', error.message);

            if (error.message.includes('duplicate key')) {
                console.log('💡 Test student already exists, this is expected.');
                return true;
            }

            return false;
        }

        console.log('✅ Registration test successful!');

        // Clean up test data
        await supabase.from('students').delete().eq('school_id', testData.schoolId);
        console.log('🧹 Test data cleaned up');

        return true;
    } catch (error) {
        console.log('❌ Registration test error:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Supabase Test Script\n');

    // Test connection
    const isConnected = await testConnection();
    if (!isConnected) {
        console.log('\n❌ Setup incomplete. Please:');
        console.log('1. Create a .env.local file with your Supabase credentials');
        console.log('2. Run the database schema in Supabase SQL Editor');
        console.log('3. Try this script again');
        process.exit(1);
    }

    // Check tables
    await checkTables();

    // Test registration
    await testStudentRegistration();

    console.log('\n🎉 All tests completed!');
    console.log('\nIf you see any ❌ errors above, please:');
    console.log('1. Check your Supabase project is active');
    console.log('2. Verify your credentials in .env.local');
    console.log('3. Run the database schema from supabase-schema.sql');
    console.log('4. Check Row Level Security (RLS) policies');
}

// Run the script
main().catch(console.error); 