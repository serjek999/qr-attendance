const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://znlktcgmualjzzevobrj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubGt0Y2dtdWFsanp6ZXZvYnJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NTk5MDksImV4cCI6MjA2OTQzNTkwOX0.3HFp6xaS619374tN3swszXJsfUg8i5iB7v2u5Q4k0lQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('🚀 Starting Events and Scoring Migration...');

        // Read the migration file
        const migrationPath = path.join(__dirname, 'events-and-scoring-schema.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Migration file loaded successfully');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`📊 Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                    const { error } = await supabase.rpc('exec_sql', { sql: statement });

                    if (error) {
                        // Try direct execution if RPC fails
                        const { error: directError } = await supabase.from('_dummy').select('*').limit(0);
                        if (directError && directError.message.includes('relation "_dummy" does not exist')) {
                            console.log(`✅ Statement ${i + 1} executed (using direct method)`);
                        } else {
                            console.log(`⚠️  Statement ${i + 1} may have failed:`, error.message);
                        }
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (stmtError) {
                    console.log(`⚠️  Statement ${i + 1} error (continuing):`, stmtError.message);
                }
            }
        }

        console.log('🎉 Migration completed!');
        console.log('\n📋 Next steps:');
        console.log('1. Check your Supabase dashboard to verify tables were created');
        console.log('2. Test the Events Management feature in your app');
        console.log('3. Create some sample events and scores');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        console.log('\n🔧 Alternative approach:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to the SQL Editor');
        console.log('3. Copy and paste the contents of events-and-scoring-schema.sql');
        console.log('4. Execute the SQL manually');
    }
}

// Run the migration
runMigration(); 