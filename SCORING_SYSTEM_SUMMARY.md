# Tribe Scoring System - Complete Guide

## 🏆 Scoring System Overview

The Tribe Scoring System awards points to tribes based on their event participation, completion, and competitive wins. Here's how the scoring works:

## 📊 Point Breakdown

### 1. Event Status Points

- **Completed Events**: +100 points each
- **Ongoing Events**: +50 points each
- **Upcoming Events**: +0 points
- **Cancelled Events**: +0 points

### 2. Event Type Bonuses

These bonuses are applied to **ALL events** of that type (regardless of status):

- **Competition Events**: +25 points each
- **Workshop Events**: +15 points each
- **Meeting Events**: +10 points each
- **General Events**: +0 points

### 3. Competitive Event Wins

- **Each Win**: +10 points (configurable per event)
- **Only Awarded**: When competitive event status is 'completed'

## 🧮 Score Calculation Example

Let's say Tribe A has:

- 2 completed Competition events
- 1 ongoing Workshop event
- 1 upcoming Meeting event
- 1 competitive win

**Calculation:**

```
Event Status Points:
- 2 completed events × 100 = 200 points
- 1 ongoing event × 50 = 50 points
- 1 upcoming event × 0 = 0 points
Total Status Points: 250

Event Type Bonuses:
- 2 Competition events × 25 = 50 points
- 1 Workshop event × 15 = 15 points
- 1 Meeting event × 10 = 10 points
Total Type Bonuses: 75

Competitive Wins:
- 1 competitive win × 10 = 10 points

TOTAL SCORE: 250 + 75 + 10 = 335 points
```

## 🎯 How to Maximize Points

### For Regular Events:

1. **Complete More Events**: Each completed event = 100 points
2. **Choose High-Value Event Types**:
   - Competition events give +25 bonus
   - Workshop events give +15 bonus
   - Meeting events give +10 bonus
3. **Keep Events Active**: Ongoing events give 50 points

### For Competitive Events:

1. **Participate in Competitions**: Win to earn points
2. **Higher Point Competitions**: Some competitions award more than 10 points
3. **Complete Competitions**: Only completed competitions award points

## 📈 Ranking System

Tribes are ranked by total score in descending order:

- **1st Place**: Gold ranking indicator
- **2nd Place**: Silver ranking indicator
- **3rd Place**: Bronze ranking indicator
- **4th+ Place**: Blue ranking indicator

## 🔄 Real-time Updates

Scores update automatically when:

- Events are created, edited, or deleted
- Event status changes (upcoming → ongoing → completed)
- Competitive event winners are selected
- Manual refresh is triggered

## 📋 Example Scenarios

### Scenario 1: New Tribe

- Creates 1 Competition event (upcoming)
- Points: 0 (upcoming) + 25 (competition bonus) = 25 points

### Scenario 2: Active Tribe

- Has 3 completed Workshop events
- Has 1 ongoing Competition event
- Won 2 competitive events
- Points: (3×100) + (1×50) + (3×15) + (1×25) + (2×10) = 430 points

### Scenario 3: Winning Tribe

- Has 5 completed Competition events
- Won 3 competitive events (15 points each)
- Points: (5×100) + (5×25) + (3×15) = 625 points

## 🎮 Competitive Events vs Regular Events

### Regular Events:

- Assigned to specific tribes
- Points based on completion + event type
- Can be any event type (Competition, Workshop, Meeting, General)

### Competitive Events:

- Tribes compete against each other
- Only winning tribe gets points
- Separate scoring system
- Points awarded when event is completed

## 💡 Tips for Success

1. **Focus on Completion**: Completed events give the most points
2. **Choose Event Types Wisely**: Competition events give the highest bonuses
3. **Participate in Competitions**: Competitive wins add significant points
4. **Stay Active**: Ongoing events provide steady points
5. **Monitor Rankings**: Check the scoring section regularly

## 🔧 Technical Details

### Database Tables:

- `events`: Regular events with tribe assignments
- `competitive_events`: Competitive events with winners
- `tribes`: Tribe information

### Scoring Algorithm:

```javascript
totalScore =
  (completedEvents × 100) +
  (ongoingEvents × 50) +
  (eventTypeBonus) +
  (competitiveWins × pointsPerWin);
```

### Event Type Bonus Calculation:

```javascript
eventTypeBonus =
  (competitionEvents × 25) +
  (workshopEvents × 15) +
  (meetingEvents × 10) +
  (generalEvents × 0);
```

This scoring system encourages tribes to be active, complete events, and participate in competitions while providing clear incentives for different types of activities.
