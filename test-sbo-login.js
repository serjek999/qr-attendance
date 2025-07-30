#!/usr/bin/env node

/**
 * Test SBO Login
 * This script tests the SBO login functionality
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

// Simulate the exact authUtils.loginSBO function
async function loginSBO(username, password) {
    try {
        // Get SBO officer by username
        const { data: officerData, error: officerError } = await supabase
            .from('sbo_officers')
            .select('*')
            .eq('username', username)

        if (officerError || !officerData || officerData.length === 0) {
            return { success: false, message: 'Invalid credentials' }
        }

        const officer = officerData[0]

        // Verify password
        const isValidPassword = await bcrypt.compare(password, officer.password_hash)

        if (!isValidPassword) {
            return { success: false, message: 'Invalid credentials' }
        }

        return {
            success: true,
            message: 'Login successful',
            officer: {
                id: officer.id,
                username: officer.username,
                full_name: officer.full_name,
                position: officer.position
            }
        }
    } catch (error) {
        console.error('SBO login error:', error)
        return { success: false, message: 'Login failed' }
    }
}

async function testSBOLogin() {
    console.log('🔐 Testing SBO Login...\n');

    // Test credentials
    const testCredentials = [
        { username: 'sbo', password: 'password' },
        { username: 'admin', password: 'admin' },
        { username: 'officer', password: 'officer' }
    ];

    for (const cred of testCredentials) {
        console.log(`Testing login with: ${cred.username}/${cred.password}`);

        const result = await loginSBO(cred.username, cred.password);

        if (result.success) {
            console.log('✅ Login successful!');
            console.log('Officer data:', result.officer);
            break;
        } else {
            console.log('❌ Login failed:', result.message);
        }
    }

    // Check what SBO officers exist in the database
    console.log('\n📋 Checking SBO officers in database...');
    const { data: officers, error: officersError } = await supabase
        .from('sbo_officers')
        .select('*');

    if (officersError) {
        console.log('❌ Error fetching officers:', officersError.message);
    } else {
        console.log(`✅ Found ${officers.length} SBO officers:`);
        officers.forEach(officer => {
            console.log(`   - Username: ${officer.username}, Name: ${officer.full_name}`);
        });
    }

    // Create a test SBO officer if none exist
    if (!officers || officers.length === 0) {
        console.log('\n👤 Creating test SBO officer...');
        const passwordHash = await bcrypt.hash('password', 10);

        const { data: newOfficer, error: createError } = await supabase
            .from('sbo_officers')
            .insert({
                username: 'sbo',
                password_hash: passwordHash,
                full_name: 'SBO Officer',
                position: 'General Secretary'
            })
            .select();

        if (createError) {
            console.log('❌ Error creating SBO officer:', createError.message);
        } else {
            console.log('✅ Test SBO officer created:', newOfficer[0]);

            // Test login with the new officer
            console.log('\n🧪 Testing login with new officer...');
            const loginResult = await loginSBO('sbo', 'password');
            if (loginResult.success) {
                console.log('✅ Login successful with new officer!');
            } else {
                console.log('❌ Login failed with new officer:', loginResult.message);
            }
        }
    }
}

testSBOLogin().catch(console.error); 