# Database Migration Guide

## 🚨 **IMPORTANT: Database Migration Required**

The post features (likes and image upload) require a database migration to be run. Without this migration, the like functionality will show errors and image upload will not work properly.

## 🔍 **Current Issues**

Based on the database test, the following issues were found:

1. **❌ Posts table missing `images` column**
2. **❌ Posts table missing `likes_count` column**
3. **❌ RLS policies need updating** for post_likes table
4. **❌ Like functionality failing** due to missing database structure

## 📋 **Migration File**

The migration file is located at: `update-posts-schema.sql`

## 🚀 **How to Run the Migration**

### **Option 1: Supabase Dashboard (Recommended)**

1. **Login to Supabase Dashboard**

   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: `znlktcgmualjzzevobrj`

2. **Navigate to SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration**

   - Copy the entire contents of `update-posts-schema.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute the migration

4. **Verify Migration**
   - Check that all commands executed successfully
   - No errors should appear in the results

### **Option 2: Supabase CLI**

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref znlktcgmualjzzevobrj

# Run the migration
supabase db push --file update-posts-schema.sql
```

## 📊 **What the Migration Does**

### **1. Posts Table Updates**

```sql
-- Adds images field to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Adds likes_count for performance
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
```

### **2. Post Likes Table Updates**

```sql
-- Adds new columns for different user types
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES faculty(id);
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS sbo_officer_id UUID REFERENCES sbo_officers(id);
ALTER TABLE post_likes ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id);

-- Updates constraints and policies
```

### **3. RLS Policy Updates**

```sql
-- Creates new policies for all user types
-- Students, Faculty, SBO Officers, and Admins can all like/unlike posts
```

### **4. Performance Optimizations**

```sql
-- Creates triggers for automatic like count updates
-- Updates existing posts with correct like counts
```

## ✅ **Verification Steps**

After running the migration, verify it worked by:

### **1. Check Posts Table**

```sql
-- Should show images and likes_count columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'posts'
AND column_name IN ('images', 'likes_count');
```

### **2. Check Post Likes Table**

```sql
-- Should show new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'post_likes'
AND column_name IN ('faculty_id', 'sbo_officer_id', 'admin_id');
```

### **3. Test Like Functionality**

- Try liking a post in any portal
- Should work without errors
- Like count should update

### **4. Test Image Upload**

- Try uploading images in any portal
- Should work without errors
- Images should display in posts

## 🛠️ **Troubleshooting**

### **Migration Fails with Permission Error**

- Ensure you're using the correct database credentials
- Check that you have admin access to the Supabase project

### **Migration Fails with Constraint Error**

- Some constraints might already exist
- The migration uses `IF NOT EXISTS` so this should be handled automatically

### **Like Functionality Still Not Working**

- Check that RLS policies were created successfully
- Verify that the user has proper authentication
- Check browser console for specific error messages

### **Image Upload Still Not Working**

- Verify that the `images` column was added to the posts table
- Check that Supabase Storage bucket `post-images` exists
- Ensure storage permissions are configured correctly

## 📝 **Post-Migration Checklist**

After running the migration, verify these features work:

### **✅ Student Portal**

- [ ] Can like/unlike posts
- [ ] Can upload images (up to 3)
- [ ] Images display in posts
- [ ] Like counts update correctly

### **✅ SBO Portal**

- [ ] Can like/unlike posts
- [ ] Can upload images (up to 3)
- [ ] Images display in posts
- [ ] Like counts update correctly

### **✅ Faculty Portal**

- [ ] Can like/unlike posts
- [ ] Can upload images (up to 3)
- [ ] Images display in posts
- [ ] Like counts update correctly

### **✅ Admin Portal**

- [ ] Can like/unlike posts
- [ ] Can upload images (up to 3)
- [ ] Images display in posts
- [ ] Like counts update correctly

## 🔧 **Manual Database Check**

If you want to manually verify the migration, run this test script:

```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="https://znlktcgmualjzzevobrj.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Run the test
node test-database-structure.js
```

Expected output after successful migration:

```
✅ Posts table has images column
✅ Extended post_likes structure works
✅ Test like insert succeeded
✅ Posts table has likes_count column
```

## 🆘 **Need Help?**

If you encounter issues:

1. **Check the migration file** for any syntax errors
2. **Run the test script** to identify specific issues
3. **Check Supabase logs** for detailed error messages
4. **Contact support** if the issue persists

## 📞 **Support**

For technical support with the migration:

- Check the Supabase documentation
- Review the migration file comments
- Test with the provided test script
- Contact the development team

---

**⚠️ Important**: This migration is required for the post features to work properly. Without it, users will see errors when trying to like posts or upload images.
