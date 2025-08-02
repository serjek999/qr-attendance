# Events and Scoring Database Setup Guide

## 🚨 Error: "relation 'events' does not exist"

This error occurs because the events and scoring database tables haven't been created yet. Follow these steps to set up the database:

## Option 1: Manual Setup (Recommended)

### Step 1: Access Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** in the left sidebar

### Step 2: Run the Migration

1. Copy the entire contents of `events-and-scoring-schema.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute the migration

### Step 3: Verify Setup

1. Go to **Table Editor** in the left sidebar
2. You should see these new tables:
   - `events`
   - `tribe_scores`
   - `event_participants`

## Option 2: Using the Migration Script

### Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Step 2: Set Environment Variables

Add your Supabase service role key to your environment:

```bash
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

### Step 3: Run Migration

```bash
node run-events-migration.js
```

## Option 3: Using Supabase CLI

### Step 1: Install Supabase CLI

```bash
npm install -g supabase
```

### Step 2: Login and Link

```bash
supabase login
supabase link --project-ref your-project-ref
```

### Step 3: Run Migration

```bash
supabase db push
```

## 🔍 Troubleshooting

### Common Issues:

1. **Permission Denied**

   - Make sure you're using the service role key, not the anon key
   - Check that your user has admin privileges

2. **Table Already Exists**

   - This is normal if you've run the migration before
   - The `IF NOT EXISTS` clauses will handle this gracefully

3. **Foreign Key Errors**
   - Make sure the `tribes` table exists first
   - Run the basic database setup if needed

### Verify Migration Success:

After running the migration, you should see:

- ✅ `events` table created
- ✅ `tribe_scores` table created
- ✅ `event_participants` table created
- ✅ RLS policies applied
- ✅ Sample data inserted

## 🎯 Next Steps

Once the migration is complete:

1. **Test the Events Management**:

   - Go to SBO/Faculty/Admin portal
   - Navigate to Events tab
   - Try creating a new event

2. **Test Tribe Scoring**:

   - Go to Tribe Scoring tab
   - Try adding points to a tribe

3. **Check Leaderboard**:
   - Visit the leaderboard page
   - Verify tribe rankings are displayed

## 📞 Need Help?

If you encounter any issues:

1. Check the browser console for detailed error messages
2. Verify the tables exist in your Supabase dashboard
3. Ensure your environment variables are set correctly
4. Contact support with the specific error message

## 🔧 Manual SQL Execution

If all else fails, you can manually execute the SQL statements one by one in the Supabase SQL Editor:

1. Create events table
2. Create tribe_scores table
3. Create event_participants table
4. Create indexes
5. Enable RLS
6. Create policies
7. Insert sample data

The complete SQL is available in `events-and-scoring-schema.sql`.
