# Competitive Events Setup Guide

## 🏆 Overview

The Competitive Events feature allows you to create competitions where tribes can win 1st, 2nd, and 3rd place positions, each earning different point values. This creates a more engaging and competitive scoring system.

## 📋 Database Setup

### Step 1: Run the SQL Script

You need to create the `competitive_events` table in your Supabase database. Run the following SQL script in your Supabase SQL Editor:

```sql
-- Create competitive_events table for tribe competition scoring with 1st, 2nd, 3rd place winners
CREATE TABLE IF NOT EXISTS competitive_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(255),
    first_place_tribe_id INTEGER REFERENCES tribes(id) ON DELETE SET NULL,
    second_place_tribe_id INTEGER REFERENCES tribes(id) ON DELETE SET NULL,
    third_place_tribe_id INTEGER REFERENCES tribes(id) ON DELETE SET NULL,
    first_place_points INTEGER DEFAULT 10,
    second_place_points INTEGER DEFAULT 5,
    third_place_points INTEGER DEFAULT 3,
    status VARCHAR(50) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_competitive_events_first_place ON competitive_events(first_place_tribe_id);
CREATE INDEX IF NOT EXISTS idx_competitive_events_second_place ON competitive_events(second_place_tribe_id);
CREATE INDEX IF NOT EXISTS idx_competitive_events_third_place ON competitive_events(third_place_tribe_id);
CREATE INDEX IF NOT EXISTS idx_competitive_events_status ON competitive_events(status);
CREATE INDEX IF NOT EXISTS idx_competitive_events_date ON competitive_events(date);

-- Add RLS policies
ALTER TABLE competitive_events ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all competitive events
CREATE POLICY "Admins can manage all competitive events" ON competitive_events
    FOR ALL USING (auth.role() = 'admin');

-- Policy for faculty to view competitive events
CREATE POLICY "Faculty can view competitive events" ON competitive_events
    FOR SELECT USING (auth.role() = 'faculty');

-- Policy for SBO officers to view competitive events
CREATE POLICY "SBO officers can view competitive events" ON competitive_events
    FOR SELECT USING (auth.role() = 'sbo_officer');

-- Policy for students to view competitive events
CREATE POLICY "Students can view competitive events" ON competitive_events
    FOR SELECT USING (auth.role() = 'student');

-- Insert sample competitive events
INSERT INTO competitive_events (title, description, date, time, location, first_place_points, second_place_points, third_place_points, status) VALUES
('Cultural Festival Game', 'Traditional cultural games competition between tribes', '2024-01-20', '14:00:00', 'Main Hall', 10, 5, 3, 'upcoming'),
('Sports Competition', 'Annual sports tournament with multiple events', '2024-01-25', '09:00:00', 'Sports Complex', 15, 8, 4, 'upcoming'),
('Academic Quiz Bowl', 'Knowledge competition testing various subjects', '2024-02-01', '15:30:00', 'Library', 12, 6, 3, 'upcoming'),
('Talent Show', 'Creative performance competition', '2024-02-05', '18:00:00', 'Auditorium', 8, 4, 2, 'upcoming'),
('Cooking Challenge', 'Culinary skills competition', '2024-02-10', '16:00:00', 'Cafeteria', 10, 5, 3, 'upcoming');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_competitive_events_updated_at
    BEFORE UPDATE ON competitive_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON competitive_events TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE competitive_events_id_seq TO authenticated;
```

### Step 2: Verify Table Creation

After running the script, you should see:

- ✅ `competitive_events` table created
- ✅ Sample data inserted
- ✅ RLS policies configured
- ✅ Indexes created for performance

## 🎯 How to Use Competitive Events

### Creating a Competitive Event

1. **Navigate to Admin Dashboard**

   - Go to `/admin/dashboard`
   - Click on "Competitive Events" tab

2. **Create New Event**

   - Click "Create Competitive Event" button
   - Fill in the event details:
     - **Title**: Name of the competition
     - **Description**: Details about the event
     - **Date & Time**: When the event takes place
     - **Location**: Where the event is held

3. **Set Point Values**

   - **1st Place Points**: Default 10 points
   - **2nd Place Points**: Default 5 points
   - **3rd Place Points**: Default 3 points
   - You can customize these values for each event

4. **Select Winners** (After Event)

   - **🥇 1st Place Tribe**: Select the winning tribe
   - **🥈 2nd Place Tribe**: Select the runner-up
   - **🥉 3rd Place Tribe**: Select the third place tribe

5. **Update Status**
   - Set status to "completed" when winners are selected
   - Points are only awarded for completed events

### Managing Competitive Events

#### Event Status Flow:

1. **Upcoming**: Event is scheduled but not started
2. **Ongoing**: Event is currently happening
3. **Completed**: Event finished, winners selected, points awarded
4. **Cancelled**: Event was cancelled, no points awarded

#### Editing Events:

- Click "Edit" on any competitive event
- Modify details, winners, or point values
- Changes are reflected immediately in scoring

#### Deleting Events:

- Click "Delete" to remove an event
- Points are removed from tribe scores

## 🏅 Scoring System

### Point Distribution:

- **1st Place**: Gets the highest point value (default: 10)
- **2nd Place**: Gets medium point value (default: 5)
- **3rd Place**: Gets lowest point value (default: 3)

### Example Scoring:

```
Cultural Festival Game:
- 1st Place: Tribe A gets 10 points
- 2nd Place: Tribe B gets 5 points
- 3rd Place: Tribe C gets 3 points

Sports Competition:
- 1st Place: Tribe D gets 15 points
- 2nd Place: Tribe E gets 8 points
- 3rd Place: Tribe F gets 4 points
```

### Total Score Calculation:

```
Tribe Score =
  (Regular Event Points) +
  (Event Type Bonuses) +
  (1st Place Wins × 1st Place Points) +
  (2nd Place Wins × 2nd Place Points) +
  (3rd Place Wins × 3rd Place Points)
```

## 📊 Viewing Results

### Tribe Rankings:

- Go to "Tribe Scoring" tab
- See real-time rankings based on all points
- View breakdown of competitive wins
- See total points from all sources

### Competitive Events List:

- View all competitive events
- See current winners and point values
- Check event status and details
- Edit or delete events as needed

## 🎮 Best Practices

### Event Planning:

1. **Set Realistic Point Values**: Balance between different events
2. **Clear Criteria**: Define how winners are determined
3. **Fair Competition**: Ensure all tribes have equal opportunity

### Point Management:

1. **Consistent Values**: Use similar point ranges across events
2. **Meaningful Differences**: Make 1st place significantly more valuable
3. **Regular Updates**: Update winners promptly after events

### Competition Types:

- **Academic**: Quiz bowls, debates, knowledge competitions
- **Sports**: Athletic competitions, tournaments
- **Creative**: Talent shows, art competitions, performances
- **Cultural**: Traditional games, cultural activities
- **Skills**: Cooking, technical, leadership challenges

## 🔧 Troubleshooting

### Common Issues:

1. **"Table does not exist" Error**

   - Solution: Run the SQL script in Supabase SQL Editor
   - Verify table was created successfully

2. **Points Not Updating**

   - Check event status is "completed"
   - Verify winners are selected
   - Refresh the page to see updates

3. **Can't Select Winners**

   - Ensure tribes exist in the database
   - Check user has admin permissions
   - Verify form validation passes

4. **Scoring Discrepancies**
   - Check event type bonuses are applied correctly
   - Verify competitive event points are calculated
   - Review regular event completion status

### Database Verification:

```sql
-- Check if table exists
SELECT * FROM competitive_events LIMIT 5;

-- Check tribes table
SELECT * FROM tribes LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'competitive_events';
```

## 🚀 Next Steps

After setting up competitive events:

1. **Create Your First Event**: Start with a simple competition
2. **Test the System**: Create, edit, and complete a test event
3. **Monitor Scoring**: Check that points are awarded correctly
4. **Plan Regular Events**: Schedule ongoing competitions
5. **Engage Tribes**: Encourage participation in competitions

The competitive events system is now ready to create engaging competitions and fair scoring for your tribe system! 🏆
