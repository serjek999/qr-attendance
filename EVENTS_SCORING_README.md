# Events and Tribe Scoring System

This document outlines the comprehensive events management and tribe scoring functionality that has been added to the QR Attendance system for SBO, Faculty, and Admin roles.

## Overview

The Events and Scoring system allows authorized users (SBO Officers, Faculty, and Administrators) to:

- Create and manage events with schedules
- Award points to tribes for various activities
- Track tribe performance across different categories
- View live leaderboards and rankings

## Features

### 1. Events Management

#### Event Creation

- **Title**: Event name (required)
- **Description**: Detailed event information
- **Date & Time**: Event schedule (required)
- **Location**: Event venue
- **Max Participants**: Optional participant limit
- **Event Type**:
  - General
  - Competition
  - Workshop
  - Meeting
- **Status**:
  - Upcoming
  - Ongoing
  - Completed
  - Cancelled
- **Tribe Assignment**: Optional - can be assigned to specific tribe or open to all

#### Event Management

- Create new events
- Edit existing events
- Delete events
- View all events in chronological order
- Filter events by status and type

### 2. Tribe Scoring System

#### Score Categories

- **Academic**: Academic competitions, quizzes, projects
- **Sports**: Athletic events, tournaments, competitions
- **Cultural**: Cultural festivals, performances, arts
- **Leadership**: Leadership activities, community service
- **General**: Other activities and events

#### Scoring Features

- Award points to tribes for event participation
- Track points by category
- View historical score data
- Calculate total tribe scores
- Generate category-specific rankings

### 3. Performance Tracking

#### Leaderboard Features

- **Overall Rankings**: Total points across all categories
- **Category Rankings**: Top performers in each category
- **Recent Activity**: Latest score updates
- **Real-time Updates**: Live score tracking

#### Performance Metrics

- Total tribe scores
- Category breakdowns
- Event participation counts
- Score history and trends

## User Roles and Permissions

### SBO Officers

- ✅ Create and manage events
- ✅ Award points to tribes
- ✅ View all tribe scores and rankings
- ✅ Edit and delete their own events/scores
- ✅ Access QR scanning and attendance features

### Faculty Members

- ✅ Create and manage events
- ✅ Award points to tribes
- ✅ View all tribe scores and rankings
- ✅ Edit and delete their own events/scores
- ✅ Access attendance reports and analytics

### Administrators

- ✅ Full system access
- ✅ Create and manage all events
- ✅ Award points to tribes
- ✅ View and manage all tribe scores
- ✅ System-wide management capabilities

## Database Schema

### Events Table

```sql
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255),
    max_participants INTEGER,
    tribe_id UUID REFERENCES tribes(id) ON DELETE SET NULL,
    event_type VARCHAR(50) DEFAULT 'general',
    status VARCHAR(50) DEFAULT 'upcoming',
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tribe Scores Table

```sql
CREATE TABLE tribe_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tribe_id UUID NOT NULL REFERENCES tribes(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    points INTEGER NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    description TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Event Participants Table

```sql
CREATE TABLE event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    sbo_officer_id UUID REFERENCES sbo_officers(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    attended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Navigation Integration

### SBO Portal

- **Events Tab**: Create and manage events
- **Tribe Scoring Tab**: Award points and manage scores
- **Quick Actions**: Direct access to event creation and scoring

### Faculty Portal

- **Events Tab**: Create and manage events
- **Tribe Scoring Tab**: Award points and manage scores
- **Analytics**: View performance metrics

### Admin Portal

- **Events Tab**: Full event management
- **Tribe Scoring Tab**: Complete scoring control
- **Management**: System-wide oversight

## Components

### EventsManagement Component

Located at `components/EventsManagement.js`

- Comprehensive event creation and management
- Score awarding functionality
- Real-time data updates
- User-friendly interface

### TribePerformance Component

Located at `components/TribePerformance.js`

- Live leaderboard display
- Category breakdowns
- Recent activity tracking
- Performance analytics

## Usage Examples

### Creating an Event

1. Navigate to Events tab in your portal
2. Click "Create Event" button
3. Fill in event details:
   - Title: "Annual Sports Day"
   - Date: 2024-12-15
   - Time: 08:00
   - Type: Competition
   - Location: School Grounds
4. Click "Create Event"

### Awarding Points

1. Navigate to Tribe Scoring tab
2. Click "Add Score" button
3. Select tribe and category
4. Enter event name and points
5. Add description (optional)
6. Click "Add Score"

### Viewing Rankings

1. Navigate to Leaderboard page
2. View overall rankings
3. Check category-specific rankings
4. Monitor recent activity

## Security Features

### Row Level Security (RLS)

- Users can only manage their own events/scores
- Admins have full system access
- Faculty and SBO have appropriate permissions
- Secure data access controls

### Data Validation

- Required field validation
- Date/time format validation
- Point value validation
- User permission checks

## Future Enhancements

### Planned Features

- Event registration system
- Automated scoring based on attendance
- Advanced analytics and reporting
- Mobile app integration
- Real-time notifications
- Event calendar integration

### Potential Improvements

- Bulk score import/export
- Advanced filtering and search
- Performance trend analysis
- Custom scoring rules
- Integration with external systems

## Troubleshooting

### Common Issues

1. **Event not appearing**: Check event status and date
2. **Score not updating**: Verify user permissions
3. **Navigation issues**: Clear browser cache
4. **Database errors**: Check connection and permissions

### Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## Conclusion

The Events and Scoring system provides a comprehensive solution for managing school events and tracking tribe performance. It integrates seamlessly with the existing QR attendance system and provides powerful tools for engagement and competition management.

The system is designed to be user-friendly while maintaining security and data integrity, making it suitable for educational institutions of all sizes.
