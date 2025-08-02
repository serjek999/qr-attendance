# User Management Feature

## Overview

The admin dashboard now includes a comprehensive user management system that allows administrators to create, view, and manage faculty and SBO officer accounts.

## Features

### 1. User Management Tab

- **Location**: Admin Dashboard → Users tab
- **Access**: Only available to administrators
- **Functionality**: View all faculty and SBO officer accounts

### 2. Create New Users

- **Button**: "Create User" button in the top-right corner
- **Modal**: Opens a form with the following fields:
  - **Role**: Select between "Faculty" or "SBO Officer"
  - **Email**: User's email address (must be unique)
  - **Full Name**: User's complete name
  - **Password**: Secure password for the account

### 3. User List Features

- **Search**: Filter users by name or email
- **Role Filter**: Filter by "All Roles", "Faculty", or "SBO Officers"
- **User Cards**: Display user information including:
  - Full name
  - Email address
  - Creation date
  - Role badge
  - Delete button

### 4. User Actions

- **View**: See all user details in the list
- **Delete**: Remove user accounts (with confirmation)
- **Search**: Find specific users quickly
- **Filter**: View users by role

## Database Setup

### Required SQL Policies

Before using the user management feature, you need to run the RLS (Row Level Security) policies in `admin-rls-policies.sql` in your Supabase database.

These policies ensure:

- Admins can view, create, update, and delete faculty and SBO officer accounts
- Faculty can only view their own data
- SBO officers can only view their own data

### Tables Used

- `faculty` - Stores faculty user accounts
- `sbo_officers` - Stores SBO officer user accounts
- `admins` - Stores admin user accounts (for authentication)

## Security Features

### Password Hashing

- Passwords are hashed using base64 encoding (for demo purposes)
- In production, use a proper hashing library like bcrypt

### Row Level Security

- All user tables have RLS enabled
- Policies ensure proper access control
- Only admins can manage user accounts

### Input Validation

- Email format validation
- Required field validation
- Unique email constraint enforcement

## Usage Instructions

### For Administrators

1. **Access User Management**:

   - Log in as an admin
   - Navigate to the Admin Dashboard
   - Click on the "Users" tab

2. **Create a New User**:

   - Click "Create User" button
   - Select the user role (Faculty or SBO Officer)
   - Fill in email, full name, and password
   - Click "Create User" to save

3. **Manage Existing Users**:
   - Use the search bar to find specific users
   - Use the role filter to view users by type
   - Click the delete button to remove users

### For Faculty/SBO Officers

1. **Account Access**:
   - Use the email and password provided by the admin
   - Access their respective portals (Faculty or SBO)

## Technical Implementation

### Components

- `UserManagement.js` - Main user management component
- `NavigationSidebar.js` - Updated with Users tab
- `AdminDashboard.js` - Updated to include user management

### Dependencies

- Supabase client for database operations
- Sonner for toast notifications
- Radix UI components for UI elements
- Lucide React for icons

### API Endpoints

The component uses Supabase's client-side API:

- `supabase.from('faculty').select()` - Fetch faculty
- `supabase.from('sbo_officers').select()` - Fetch SBO officers
- `supabase.from(table).insert()` - Create new users
- `supabase.from(table).delete()` - Delete users

## Error Handling

### Common Issues

1. **Duplicate Email**: Email already exists in the system
2. **Missing Fields**: Required fields not filled
3. **Network Errors**: Connection issues with Supabase
4. **Permission Errors**: Insufficient privileges

### Error Messages

- Clear, user-friendly error messages via toast notifications
- Console logging for debugging
- Graceful fallbacks for failed operations

## Future Enhancements

### Planned Features

1. **User Editing**: Modify existing user information
2. **Bulk Operations**: Create/delete multiple users at once
3. **User Activity Logs**: Track user actions and login history
4. **Password Reset**: Allow users to reset their passwords
5. **Role Management**: More granular role permissions
6. **User Import/Export**: CSV import/export functionality

### Security Improvements

1. **Proper Password Hashing**: Implement bcrypt or similar
2. **Two-Factor Authentication**: Add 2FA for admin accounts
3. **Audit Logging**: Track all admin actions
4. **Session Management**: Better session handling

## Troubleshooting

### Common Problems

1. **Users not loading**:

   - Check RLS policies are applied
   - Verify admin authentication
   - Check network connectivity

2. **Cannot create users**:

   - Ensure all required fields are filled
   - Check for duplicate email addresses
   - Verify admin permissions

3. **Cannot delete users**:

   - Check if user has active sessions
   - Verify admin permissions
   - Check for foreign key constraints

4. **Created users cannot log in**:
   - **Solution**: The authentication system now tries all user types automatically
   - Users should use their email address as username
   - Password should be the one set during creation
   - Check that RLS policies allow proper access to user tables
   - Verify password hashing is working correctly (bcrypt is now used)

### Debug Steps

1. Check browser console for errors
2. Verify Supabase connection
3. Test RLS policies in Supabase dashboard
4. Check user authentication status

## Support

For issues or questions about the user management feature:

1. Check this documentation
2. Review the console logs
3. Verify database setup
4. Contact the development team
