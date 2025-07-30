# QR Attendance System - PHP Version

A complete PHP-based QR code attendance tracking system with PDO database integration for students, SBO officers, and faculty.

## 🏗️ **Project Structure**

```
qr-attendance/
├── config/
│   └── database.php          # Database configuration
├── models/
│   ├── Student.php           # Student model with PDO
│   ├── SBO.php              # SBO officer model
│   └── Faculty.php          # Faculty model
├── api/
│   ├── student.php          # Student API endpoints
│   ├── sbo.php             # SBO API endpoints
│   └── faculty.php         # Faculty API endpoints
├── database/
│   └── schema.sql          # Database schema
└── README_PHP.md           # This file
```

## 🚀 **Setup Instructions**

### 1. **Database Setup**

1. **Create MySQL Database:**

   ```sql
   CREATE DATABASE qr_attendance;
   ```

2. **Import Schema:**

   ```bash
   mysql -u root -p qr_attendance < database/schema.sql
   ```

3. **Configure Database Connection:**
   Edit `config/database.php` with your database credentials:
   ```php
   private $host = 'localhost';
   private $db_name = 'qr_attendance';
   private $username = 'your_username';
   private $password = 'your_password';
   ```

### 2. **Server Requirements**

- PHP 7.4 or higher
- MySQL 5.7 or higher
- PDO extension enabled
- JSON extension enabled

### 3. **Installation**

1. **Clone/Download the project**
2. **Set up web server** (Apache/Nginx) pointing to the project directory
3. **Import database schema**
4. **Configure database connection**
5. **Set proper permissions** for file access

## 📊 **Database Schema**

### **Tables:**

1. **`students`** - Student information and QR codes
2. **`sbo_officers`** - SBO officer accounts
3. **`faculty`** - Faculty member accounts
4. **`attendance_records`** - Attendance tracking data

### **Default Credentials:**

- **SBO Officer:** `sbo` / `attendance2024`
- **Faculty:** `faculty` / `password`

## 🔌 **API Endpoints**

### **Student API** (`/api/student.php`)

#### **POST Actions:**

- `register` - Register new student
- `login` - Student login verification

#### **GET Actions:**

- `get_by_school_id` - Get student by school ID
- `get_by_qr_code` - Get student by QR code
- `get_all` - Get all students

#### **PUT/DELETE:**

- Update/Delete student records

### **SBO API** (`/api/sbo.php`)

#### **POST Actions:**

- `login` - SBO officer login
- `record_attendance` - Record student attendance
- `add_officer` - Add new SBO officer

#### **GET Actions:**

- `recent_attendance` - Get recent attendance records
- `attendance_stats` - Get attendance statistics
- `all_officers` - Get all SBO officers

### **Faculty API** (`/api/faculty.php`)

#### **POST Actions:**

- `login` - Faculty login
- `add_faculty` - Add new faculty member

#### **GET Actions:**

- `attendance_records` - Get filtered attendance records
- `attendance_stats` - Get attendance statistics
- `attendance_by_date_range` - Get records by date range
- `student_attendance_summary` - Get student attendance summary
- `export_csv` - Export attendance to CSV
- `all_faculty` - Get all faculty members

## 📝 **Usage Examples**

### **Student Registration:**

```php
POST /api/student.php?action=register
{
    "school_id": "2021-001234",
    "last_name": "DelaCruz",
    "first_name": "Juan",
    "birthdate": "2000-01-15"
}
```

### **SBO Login:**

```php
POST /api/sbo.php?action=login
{
    "username": "sbo",
    "password": "attendance2024"
}
```

### **Record Attendance:**

```php
POST /api/sbo.php?action=record_attendance
{
    "school_id": "2021-001234",
    "officer_id": 1
}
```

### **Get Attendance Records:**

```php
GET /api/faculty.php?action=attendance_records&date=2024-01-15
```

## 🔒 **Security Features**

- **Password Hashing** - All passwords are hashed using PHP's `password_hash()`
- **PDO Prepared Statements** - SQL injection protection
- **Input Validation** - All inputs are validated and sanitized
- **CORS Headers** - Proper CORS configuration for API access

## ⏰ **Time Windows**

- **Time-in:** 7:00 AM - 11:30 AM
- **Time-out:** 1:00 PM - 5:00 PM

## 📱 **QR Code System**

- QR codes are generated automatically during student registration
- QR codes contain encrypted student information
- SBO officers scan QR codes to record attendance
- Time restrictions are enforced automatically

## 🔧 **Configuration**

### **Database Configuration:**

Edit `config/database.php` to match your database setup.

### **Time Windows:**

Modify the time window logic in `models/SBO.php` if needed.

### **QR Code Generation:**

The QR code generation can be enhanced with a proper QR library like `phpqrcode`.

## 🚨 **Error Handling**

All API endpoints return consistent JSON responses:

```json
{
    "success": true/false,
    "message": "Description of result",
    "data": {} // Optional data payload
}
```

## 📈 **Features**

- ✅ Student registration with QR code generation
- ✅ SBO officer authentication and attendance scanning
- ✅ Faculty dashboard with attendance management
- ✅ Time window enforcement (time-in/time-out)
- ✅ Attendance statistics and reporting
- ✅ CSV export functionality
- ✅ Secure password handling
- ✅ PDO database integration
- ✅ RESTful API design

## 🛠️ **Development**

### **Adding New Features:**

1. Create model methods in appropriate class
2. Add API endpoints in corresponding API file
3. Update database schema if needed
4. Test thoroughly

### **Database Migrations:**

For production, consider using a proper migration system for database changes.

## 📞 **Support**

For issues or questions:

1. Check database connection settings
2. Verify PHP extensions are enabled
3. Check server error logs
4. Ensure proper file permissions

## 🔄 **Migration from React Version**

This PHP version provides the same functionality as the React version but with:

- Server-side processing
- Direct database access
- No client-side dependencies
- Better security with server-side validation
- Easier deployment on traditional hosting

---

**Note:** This is a complete backend system. You'll need to create frontend interfaces or integrate with existing applications to use these APIs.
