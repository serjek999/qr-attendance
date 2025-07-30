#!/usr/bin/env node

/**
 * Test Scan.js SBO Login
 * This script simulates the exact login process from Scan.js
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

// Simulate the exact loginSBO function from auth.js
async function loginSBO(username, password) {
    try {
        console.log(`🔍 Attempting SBO login for username: ${username}`);

        // Get SBO officer by username
        const { data: officerData, error: officerError } = await supabase
            .from('sbo_officers')
            .select('*')
            .eq('username', username);

        console.log('📊 Officer data result:', { officerData, officerError });

        if (officerError) {
            console.log('❌ Officer error:', officerError);
            return { success: false, message: `Database error: ${officerError.message}` };
        }

        if (!officerData || officerData.length === 0) {
            console.log('❌ No officer found with username:', username);
            return { success: false, message: 'Invalid credentials' };
        }

        const officer = officerData[0];
        console.log('✅ Officer found:', { id: officer.id, username: officer.username, full_name: officer.full_name });

        // Verify password
        const isValidPassword = await bcrypt.compare(password, officer.password_hash);
        console.log('🔐 Password verification result:', isValidPassword);

        if (!isValidPassword) {
            console.log('❌ Invalid password');
            return { success: false, message: 'Invalid credentials' };
        }

        console.log('✅ Password verified successfully');

        return {
            success: true,
            message: 'Login successful',
            officer: {
                id: officer.id,
                username: officer.username,
                full_name: officer.full_name,
                position: officer.position
            }
        };
    } catch (error) {
        console.error('❌ SBO login error:', error);
        return { success: false, message: `Login failed: ${error.message}` };
    }
}

async function testScanLogin() {
    console.log('🧪 Testing Scan.js SBO Login Process...\n');

    try {
        // Test with Jake's credentials
        console.log('👤 Testing with Jake (SBO Officer)...');
        const result = await loginSBO('jake', 'jake123');

        console.log('\n📋 Login Result:');
        console.log('Success:', result.success);
        console.log('Message:', result.message);

        if (result.success) {
            console.log('Officer Data:', result.officer);
        }

        // Test with invalid credentials
        console.log('\n👤 Testing with invalid credentials...');
        const invalidResult = await loginSBO('jake', 'wrongpassword');
        console.log('Invalid login result:', invalidResult);

        // Test with non-existent user
        console.log('\n👤 Testing with non-existent user...');
        const nonExistentResult = await loginSBO('nonexistent', 'password');
        console.log('Non-existent user result:', nonExistentResult);

    } catch (error) {
        console.error('❌ Test error:', error);
    }
}

testScanLogin().catch(console.error); 