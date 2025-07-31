# Year Level Feature Update

## Overview

This update adds year level functionality to the QR Attendance System, allowing students to register with their year level and faculty to filter attendance records by year level.

## Changes Made

### 1. Database Schema Updates

- Added `year_level` column to `students` table with values: Y1, Y2, YEAR3, YEAR4
- Added `year_level` column to `attendance_records` table
- Updated database constraints and indexes

### 2. Student Registration Updates

- Added year level dropdown to student registration form
- Updated form validation to require year level selection
- Added year level display in student details after registration/login
- Updated authentication utilities to handle year level data

### 3. Faculty Dashboard Updates

- Added year level filter dropdown in faculty interface
- Added year level column to attendance records table
- Updated filtering logic to include year level filtering
- Updated CSV export to include year level data
- Enhanced statistics display

## Migration Instructions

### For New Installations

1. Run the updated `supabase-schema.sql` file in your Supabase SQL editor

### For Existing Installations

1. Run the `add-year-level-migration.sql` file in your Supabase SQL editor to add the new columns
2. Update existing student records with appropriate year levels if needed

## Year Level Options

- **Y1**: First Year
- **Y2**: Second Year
- **YEAR3**: Third Year
- **YEAR4**: Fourth Year

## Features

### Student Registration

- Students must select their year level during registration
- Year level is displayed in their profile after registration
- Year level is included in QR code generation

### Faculty Dashboard

- Filter attendance records by year level
- View year level badges in attendance table
- Export attendance data with year level information
- Enhanced filtering capabilities

## Technical Details

### Database Changes

```sql
-- Students table
ALTER TABLE students ADD COLUMN year_level VARCHAR(10) CHECK (year_level IN ('Y1', 'Y2', 'YEAR3', 'YEAR4'));

-- Attendance records table
ALTER TABLE attendance_records ADD COLUMN year_level VARCHAR(10);
```

### API Updates

- `registerStudent()` now accepts and stores year level
- `getAttendanceRecords()` supports year level filtering
- `recordAttendance()` includes year level in new records
- CSV export includes year level column

## Testing

1. Register a new student with year level selection
2. Verify year level appears in student details
3. Test faculty filtering by year level
4. Verify year level appears in attendance records
5. Test CSV export includes year level data
