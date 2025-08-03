# Tribe Scoring System

## Overview

The Tribe Scoring System is a comprehensive feature that automatically calculates and ranks tribes based on their event participation and completion. It connects events data with tribe information to provide real-time scoring and rankings.

## Features

### 🏆 Automatic Scoring Calculation

- **Event Status Points**:

  - Completed Events: +100 points
  - Ongoing Events: +50 points
  - Upcoming Events: +0 points
  - Cancelled Events: +0 points

- **Event Type Bonuses** (applied to all events of that type):

  - Competition Events: +25 points each
  - Workshop Events: +15 points each
  - Meeting Events: +10 points each
  - General Events: +0 points

- **Competitive Event Wins**:
  - Each win: +10 points (configurable)
  - Only awarded when event status is 'completed'

### 📊 Real-time Rankings

- Automatic ranking calculation based on total scores
- Visual ranking indicators (Gold, Silver, Bronze, etc.)
- Detailed statistics for each tribe

### 🔄 Dynamic Updates

- Scores recalculate automatically when events are updated
- Manual refresh option to recalculate scores
- Real-time synchronization with events data

## How to Use

### 1. Setting Up Events

1. Navigate to the Events Management section
2. Create new events with the following details:
   - **Event Title**: Name of the event
   - **Event Type**: Choose from General, Competition, Workshop, or Meeting
   - **Event Status**: Set as Upcoming, Ongoing, Completed, or Cancelled
   - **Assigned Tribe**: Select which tribe is responsible for the event
   - **Date & Time**: When the event takes place
   - **Location**: Where the event is held
   - **Description**: Details about the event

### 2. Setting Up Competitive Events

1. Navigate to the "Competitive Events" section
2. Create new competitive events:
   - **Event Title**: Name of the competition (e.g., "Cultural Festival Game")
   - **Points Awarded**: Number of points for winning (default: 10)
   - **Event Status**: Set as Upcoming, Ongoing, Completed, or Cancelled
   - **Winning Tribe**: Select which tribe won the competition (only for completed events)
   - **Date & Time**: When the competition takes place
   - **Location**: Where the competition is held
   - **Description**: Details about the competition

### 3. Managing Competitive Events

- **Create Competition**: Set up new competitive events
- **Update Results**: Mark events as completed and select the winning tribe
- **Adjust Points**: Configure different point values for different competitions
- **Track Progress**: Monitor which tribes are winning competitions

### 4. Viewing Tribe Rankings

1. Switch to the "Tribe Scoring" mode using the toggle in the header
2. View the automatic rankings based on event participation and competitive wins
3. See detailed statistics for each tribe:
   - Total Score
   - Number of completed events
   - Number of ongoing events
   - Number of upcoming events
   - Number of competitive wins
   - Total events assigned

### 5. Managing Scores

- **Automatic Updates**: Scores update automatically when events are created, edited, or deleted
- **Manual Refresh**: Click "Recalculate Scores" to manually update rankings
- **Real-time Sync**: Changes in events immediately reflect in tribe scores

## Database Requirements

### Events Table

The system requires an `events` table with the following fields:

- `id` (Primary Key)
- `title` (Text)
- `description` (Text)
- `date` (Date)
- `time` (Time)
- `location` (Text)
- `event_type` (Enum: 'general', 'competition', 'workshop', 'meeting')
- `status` (Enum: 'upcoming', 'ongoing', 'completed', 'cancelled')
- `tribe_id` (Integer, Foreign Key to tribes table)
- `max_participants` (Integer, optional)

### Competitive Events Table

The system requires a `competitive_events` table with the following fields:

- `id` (Primary Key)
- `title` (Text)
- `description` (Text)
- `date` (Date)
- `time` (Time)
- `location` (Text)
- `winning_tribe_id` (Integer, Foreign Key to tribes table, nullable)
- `points_awarded` (Integer, default: 10)
- `status` (Enum: 'upcoming', 'ongoing', 'completed', 'cancelled')
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Tribes Table

The system requires a `tribes` table with the following fields:

- `id` (Primary Key)
- `name` (Text)

## Scoring Algorithm

### Base Points

```javascript
// Event Status Points
completed: 100 points
ongoing: 50 points
upcoming: 0 points
cancelled: 0 points

// Event Type Bonuses
competition: +25 points
workshop: +15 points
meeting: +10 points
general: +0 points

// Competitive Event Wins
competitiveWin: +10 points (configurable)
```

### Total Score Calculation

```javascript
totalScore =
  completedEvents * 100 +
  ongoingEvents * 50 +
  eventTypeBonus + // Sum of all event type bonuses
  competitiveWins * 10;
```

**Event Type Bonus Breakdown:**

- Each Competition event: +25 points
- Each Workshop event: +15 points
- Each Meeting event: +10 points
- Each General event: +0 points

## UI Components

### Events Management Mode

- Create, edit, and delete events
- Assign events to tribes
- Set event status and type
- View all events with tribe assignments

### Competitive Events Mode

- Create, edit, and delete competitive events
- Select winning tribes for completed competitions
- Configure points awarded for each competition
- Track competitive event results

### Tribe Scoring Mode

- **Tribe Rankings**: Visual ranking display with scores
- **Scoring Guidelines**: Explanation of how points are calculated
- **Statistics**: Detailed breakdown of each tribe's performance
- **Competitive Wins**: Display of competitive event victories

## Example Usage

### Creating a Cultural Festival Game

1. Go to "Competitive Events" section
2. Click "Create Competitive Event"
3. Fill in the details:
   - **Title**: "Cultural Festival Game"
   - **Description**: "Traditional cultural games competition between tribes"
   - **Points Awarded**: 10
   - **Date**: Select the event date
   - **Time**: Set the event time
   - **Location**: "Main Hall"
   - **Status**: "Upcoming"
4. Save the event

### Recording the Winner

1. After the competition is completed, edit the event
2. Change status to "Completed"
3. Select the winning tribe from the "Winning Tribe" dropdown
4. Save the changes
5. The winning tribe automatically receives 10 points

## Integration

The Tribe Scoring System integrates seamlessly with:

- **Events Management**: Automatic score updates when events change
- **Competitive Events**: Direct integration with competition results
- **Database**: Real-time data synchronization
- **UI Components**: Consistent design with the rest of the application

## Future Enhancements

Potential improvements for the scoring system:

- **Attendance Tracking**: Include actual attendance numbers in scoring
- **Performance Metrics**: Add more sophisticated scoring algorithms
- **Historical Data**: Track score changes over time
- **Notifications**: Alert tribes when their ranking changes
- **Custom Scoring Rules**: Allow administrators to customize scoring weights
- **Team Competitions**: Support for multi-tribe competitions
- **Seasonal Rankings**: Track rankings across different time periods

## Troubleshooting

### Common Issues

1. **Scores not updating**: Ensure events are properly assigned to tribes
2. **Missing tribes**: Check that the tribes table has data
3. **Incorrect calculations**: Verify event status and type values
4. **Competitive wins not counting**: Ensure competitive events are marked as 'completed'

### Debug Steps

1. Check the browser console for any errors
2. Verify database connections
3. Ensure all required fields are populated
4. Refresh the page to recalculate scores
5. Check that competitive events have winning tribes selected

## Support

For issues or questions about the Tribe Scoring System:

1. Check the browser console for error messages
2. Verify database schema matches requirements
3. Ensure proper permissions for database access
4. Contact the development team for technical support
