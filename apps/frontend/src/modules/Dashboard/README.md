# Dashboard Module

## Overview
The Dashboard module provides a personalized workspace for users to manage their daily tasks, life notes, and productivity tracking.

## Features
- **Mood Tracking**: Users can log their daily mood and receive personalized greetings
- **Life Notes**: Quick note-taking for personal thoughts and reminders
- **Work Tasks**: Task management with priority levels and completion tracking
- **Messy Drawer**: Quick capture for notes and links
- **Support Metrics**: Overview of support system statistics
- **Achievement Badges**: Gamification elements for user engagement

## Components
- `DashboardPage.tsx`: Main dashboard component with all features
- `index.ts`: Module exports

## Usage
```typescript
import { DashboardPage } from '../modules/Dashboard';

// Use in routing
<Route path="/dashboard" element={<DashboardPage />} />
```

## Data Storage
- Mood data is stored in localStorage for persistence
- Task and note data is managed in component state (can be extended to use Supabase)

## Future Enhancements
- Integration with external task management systems
- Advanced analytics and productivity insights
- Customizable dashboard layouts
- Integration with calendar systems 