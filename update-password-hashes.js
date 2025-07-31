#!/usr/bin/env node

/**
 * Update Password Hashes
 * This script updates the password hashes for existing users
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updatePasswordHashes() {
    console.log('🔧 Updating password hashes...\n');

    try {
        // Generate correct password hashes
        const jakePassword = await bcrypt.hash('jake123', 10);
        const rizaPassword = await bcrypt.hash('riza123', 10);
        const dodongPassword = await bcrypt.hash('sbo123', 10);

        console.log('Generated password hashes:');
        console.log('jake123:', jakePassword);
        console.log('riza123:', rizaPassword);
        console.log('sbo123:', dodongPassword);

        // Update admin password
        console.log('\n👨‍💼 Updating admin password...');
        const { data: adminUpdate, error: adminError } = await supabase
            .from('admins')
            .update({ password_hash: jakePassword })
            .eq('email', 'jake@admin')
            .select();

        if (adminError) {
            console.log('❌ Error updating admin password:', adminError.message);
        } else {
            console.log('✅ Admin password updated successfully');
        }

        // Update faculty password
        console.log('\n👨‍🏫 Updating faculty password...');
        const { data: facultyUpdate, error: facultyError } = await supabase
            .from('faculty')
            .update({ password_hash: rizaPassword })
            .eq('email', 'riza@faculty')
            .select();

        if (facultyError) {
            console.log('❌ Error updating faculty password:', facultyError.message);
        } else {
            console.log('✅ Faculty password updated successfully');
        }

        // Update SBO password
        console.log('\n👮‍♂️ Updating SBO password...');
        const { data: sboUpdate, error: sboError } = await supabase
            .from('sbo_officers')
            .update({ password_hash: dodongPassword })
            .eq('email', 'dodong@sbo')
            .select();

        if (sboError) {
            console.log('❌ Error updating SBO password:', sboError.message);
        } else {
            console.log('✅ SBO password updated successfully');
        }

        // Test login after update
        console.log('\n🧪 Testing login after password update...');

        const adminResult = await testLogin('admins', 'jake@admin', 'jake123');
        if (adminResult.success) {
            console.log('✅ Admin login successful!');
        } else {
            console.log('❌ Admin login failed:', adminResult.message);
        }

        const facultyResult = await testLogin('faculty', 'riza@faculty', 'riza123');
        if (facultyResult.success) {
            console.log('✅ Faculty login successful!');
        } else {
            console.log('❌ Faculty login failed:', facultyResult.message);
        }

        const sboResult = await testLogin('sbo_officers', 'dodong@sbo', 'sbo123');
        if (sboResult.success) {
            console.log('✅ SBO login successful!');
        } else {
            console.log('❌ SBO login failed:', sboResult.message);
        }

        console.log('\n🎉 Password update complete!');
        console.log('\n📝 Login credentials:');
        console.log('Admin: jake@admin / jake123');
        console.log('Faculty: riza@faculty / riza123');
        console.log('SBO: dodong@sbo / sbo123');

    } catch (error) {
        console.error('❌ Error updating passwords:', error.message);
    }
}

async function testLogin(table, email, password) {
    try {
        const { data: userData, error: userError } = await supabase
            .from(table)
            .select('*')
            .eq('email', email);

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

updatePasswordHashes().catch(console.error); 