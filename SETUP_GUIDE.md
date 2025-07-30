# QR Attendance System Setup Guide

## 🚨 **Fixing HTTP 500 Error**

### **Step 1: Check Your Server Setup**

1. **Start your local server:**

   - **XAMPP:** Start Apache and MySQL
   - **WAMP:** Start WAMP
   - **MAMP:** Start MAMP

2. **Place files in correct location:**
   ```
   htdocs/
   └── qr/
       ├── config/
       ├── models/
       ├── api/
       ├── database/
       └── test_connection.php
   ```

### **Step 2: Import Database**

1. Open **phpMyAdmin** (http://localhost/phpmyadmin)
2. Create new database: `qr_attendance`
3. Import `database/schema.sql`

### **Step 3: Test Connection**

Visit: `http://localhost/qr/error_handler.php`

This will show you exactly what's causing the 500 error.

### **Step 4: Common Issues & Solutions**

#### **Issue 1: Database Connection Failed**

**Solution:**

- Check if MySQL is running
- Verify credentials in `config/connection.php`
- Make sure database `qr_attendance` exists

#### **Issue 2: Tables Don't Exist**

**Solution:**

- Import the schema file again
- Check for SQL errors in phpMyAdmin

#### **Issue 3: PHP Errors**

**Solution:**

- Check PHP error logs
- Make sure PDO MySQL extension is enabled
- Verify PHP version (7.4+ recommended)

#### **Issue 4: File Permissions**

**Solution:**

- Make sure web server can read PHP files
- Check file ownership

### **Step 5: Test API Endpoints**

After fixing the database, test these URLs:

1. **Test connection:** `http://localhost/qr/test_connection.php`
2. **Get all students:** `http://localhost/qr/api/student.php?action=get_all`
3. **Get recent attendance:** `http://localhost/qr/api/sbo.php?action=recent_attendance`
4. **Get attendance records:** `http://localhost/qr/api/faculty.php?action=attendance_records`

### **Step 6: Default Credentials**

**SBO Login:**

- Username: `sbo`
- Password: `attendance2024`

**Faculty Login:**

- Username: `faculty`
- Password: `password`

### **Step 7: Start React App**

```bash
npm run dev
```

## 🔧 **Debugging Steps**

If you still get 500 errors:

1. **Check error logs:**

   - XAMPP: `xampp/apache/logs/error.log`
   - WAMP: `wamp/logs/apache_error.log`

2. **Enable error display:**

   - Add this to the top of your PHP files:

   ```php
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```

3. **Test database connection:**
   ```php
   <?php
   try {
       $pdo = new PDO("mysql:host=localhost;dbname=qr_attendance", "root", "");
       echo "Connected successfully";
   } catch(PDOException $e) {
       echo "Connection failed: " . $e->getMessage();
   }
   ?>
   ```

## 📁 **File Structure**

```
qr/
├── config/
│   └── connection.php          # Database connection
├── models/
│   ├── Student.php            # Student operations
│   ├── SBO.php               # SBO operations
│   └── Faculty.php           # Faculty operations
├── api/
│   ├── student.php           # Student API endpoints
│   ├── sbo.php              # SBO API endpoints
│   └── faculty.php          # Faculty API endpoints
├── database/
│   └── schema.sql           # Database schema
├── test_connection.php      # Connection test
├── error_handler.php        # Error debugging
└── SETUP_GUIDE.md          # This file
```

## 🎯 **Expected Results**

After successful setup:

1. **Database connection:** ✅ Green checkmark
2. **Tables exist:** ✅ All 4 tables present
3. **API endpoints:** ✅ Return JSON responses
4. **React app:** ✅ Connects to PHP backend

## 🆘 **Still Having Issues?**

1. Check the error handler: `http://localhost/qr/error_handler.php`
2. Look at browser console for CORS errors
3. Check network tab for failed requests
4. Verify all file paths are correct

## 📞 **Quick Test**

Run this in your browser to test everything:

```javascript
// Test API endpoints
fetch("http://localhost/qr/api/student.php?action=get_all")
  .then((response) => response.json())
  .then((data) => console.log("Students:", data))
  .catch((error) => console.error("Error:", error));
```

If this works, your backend is ready for the React frontend!
