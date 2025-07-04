# Support Module

## Overview
The Support module provides comprehensive help and support functionality for AIBOS users, including AI assistance, knowledge base, community forums, and feedback systems.

## Features
- **Help Overview**: Centralized access to all support resources
- **AI Assistant**: Intelligent chatbot for instant help and guidance
- **Knowledge Base**: Searchable documentation and tutorials
- **Community Forum**: User community for discussions and peer support
- **Feature Requests**: System for submitting and voting on feature ideas
- **Release Notes**: Latest updates and changelog information
- **Feedback System**: User feedback collection and management

## Components
- `SupportPage.tsx`: Main support page with tabbed interface
- `index.ts`: Module exports

## Dependencies
- `SupportDashboard`: Support metrics and overview component
- `AdvancedAIAgent`: AI-powered support assistant
- React Router for navigation and URL parameters

## Usage
```typescript
import { SupportPage } from '../modules/Support';

// Use in routing
<Route path="/help" element={<SupportPage />} />
```

## URL Parameters
The support page supports URL parameters for direct tab navigation:
- `?tab=overview` - Help overview
- `?tab=ai-assistant` - AI assistant
- `?tab=knowledge-base` - Knowledge base
- `?tab=community` - Community forum
- `?tab=feature-requests` - Feature requests
- `?tab=release-notes` - Release notes
- `?tab=feedback` - Feedback form

## Contextual Help
The module automatically detects the current page context and provides relevant help suggestions based on the user's location in the application.

## Future Enhancements
- Integration with external knowledge base systems
- Advanced AI capabilities with machine learning
- Real-time community chat features
- Integration with ticketing systems 