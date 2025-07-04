// Sample Data for Support System Testing
// This provides realistic data for testing all support system components

import type {
  FeatureRequest,
  ReleaseNote,
  KnowledgeBaseArticle,
  KnowledgeBaseCategory,
  CommunityPost,
  CommunityReply,
  SupportMetrics,
} from '../types/support';

export const sampleFeatureRequests: FeatureRequest[] = [
  {
    id: 1,
    user_id: "sample-user-1",
    title: "Dark Mode Support",
    description: "Add a dark mode theme option for better user experience, especially for users working in low-light environments. This should include dark backgrounds for all major components.",
    status: "planned",
    category: "UI/UX",
    tags: ["theme", "accessibility", "user-experience"],
    priority: "high",
    upvotes: 47,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:15:00Z"
  },
  {
    id: 2,
    user_id: "sample-user-2",
    title: "Bulk Import for Employee Data",
    description: "Allow administrators to import multiple employee records at once using CSV or Excel files. This would significantly speed up the onboarding process for large organizations.",
    status: "in_progress",
    category: "HR Management",
    tags: ["bulk-import", "csv", "excel", "onboarding"],
    priority: "medium",
    upvotes: 23,
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-01-18T16:45:00Z"
  },
  {
    id: 3,
    user_id: "sample-user-3",
    title: "Advanced Reporting Dashboard",
    description: "Create a comprehensive reporting dashboard with customizable charts, filters, and export options. Include analytics for employee performance, department metrics, and organizational insights.",
    status: "pending",
    category: "Analytics",
    tags: ["reporting", "dashboard", "analytics", "charts"],
    priority: "high",
    upvotes: 34,
    created_at: "2024-01-12T11:20:00Z",
    updated_at: "2024-01-12T11:20:00Z"
  },
  {
    id: 4,
    user_id: "sample-user-4",
    title: "Mobile App for Field Workers",
    description: "Develop a mobile application for employees who work in the field or remote locations. Include offline capabilities, GPS tracking, and simplified task management.",
    status: "planned",
    category: "Mobile",
    tags: ["mobile", "offline", "gps", "field-work"],
    priority: "medium",
    upvotes: 18,
    created_at: "2024-01-08T13:45:00Z",
    updated_at: "2024-01-16T10:30:00Z"
  },
  {
    id: 5,
    user_id: "sample-user-5",
    title: "Integration with Slack",
    description: "Add Slack integration for notifications, approvals, and team collaboration. Allow users to receive updates and take actions directly from Slack channels.",
    status: "released",
    category: "Integrations",
    tags: ["slack", "notifications", "collaboration"],
    priority: "low",
    upvotes: 12,
    created_at: "2024-01-05T08:30:00Z",
    updated_at: "2024-01-22T15:20:00Z"
  }
];

export const sampleReleaseNotes: ReleaseNote[] = [
  {
    id: 1,
    version: "v2.1.0",
    title: "Enhanced AI Assistant & Performance Improvements",
    highlights: "New AI-powered support assistant, improved dashboard performance, and enhanced security features",
    details: `
## 🚀 New Features
- **AI Support Assistant**: Intelligent chatbot for instant help and guidance
- **Advanced Search**: Improved search functionality across all modules
- **Real-time Notifications**: Enhanced notification system with better delivery

## 🔧 Improvements
- **Dashboard Performance**: 40% faster loading times
- **Mobile Responsiveness**: Better experience on mobile devices
- **Security Enhancements**: Additional authentication layers

## 🐛 Bug Fixes
- Fixed issue with profile image uploads
- Resolved notification delivery delays
- Corrected timezone display in reports
    `,
    released_at: "2024-01-22T10:00:00Z"
  },
  {
    id: 2,
    version: "v2.0.5",
    title: "Security Update & Bug Fixes",
    highlights: "Important security patches and performance improvements",
    details: `
## 🔒 Security Updates
- Enhanced authentication system
- Improved session management
- Additional security headers

## 🐛 Bug Fixes
- Fixed login issues for some users
- Resolved data export problems
- Corrected email notification formatting
    `,
    released_at: "2024-01-15T14:30:00Z"
  },
  {
    id: 3,
    version: "v2.0.0",
    title: "Major Platform Update",
    highlights: "Complete redesign with new features and improved user experience",
    details: `
## 🎉 Major Release
- **Complete UI Redesign**: Modern, intuitive interface
- **New Dashboard**: Enhanced overview and analytics
- **Improved Navigation**: Better organization and accessibility
- **Performance Boost**: 60% faster overall performance

## 🆕 New Modules
- **Advanced Analytics**: Comprehensive reporting tools
- **Team Collaboration**: Enhanced team management features
- **Custom Workflows**: Flexible process automation
    `,
    released_at: "2024-01-01T09:00:00Z"
  }
];

export const sampleKnowledgeBaseCategories: KnowledgeBaseCategory[] = [
  {
    id: "kb-cat-1",
    name: "Getting Started",
    description: "Essential guides for new users",
    icon: "🚀",
    sort_order: 1,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "kb-cat-2",
    name: "User Guide",
    description: "How to use AIBOS features effectively",
    icon: "📖",
    sort_order: 2,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "kb-cat-3",
    name: "Troubleshooting",
    description: "Common issues and solutions",
    icon: "🔧",
    sort_order: 3,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "kb-cat-4",
    name: "API Reference",
    description: "Technical documentation for developers",
    icon: "⚙️",
    sort_order: 4,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: "kb-cat-5",
    name: "Best Practices",
    description: "Tips and recommendations for optimal usage",
    icon: "💡",
    sort_order: 5,
    is_active: true,
    created_at: "2024-01-01T00:00:00Z"
  }
];

export const sampleKnowledgeBaseArticles: KnowledgeBaseArticle[] = [
  {
    id: "kb-article-1",
    title: "Getting Started with AIBOS",
    content: `
# Welcome to AIBOS! 🎉

AIBOS is a comprehensive AI-powered business operations system designed to streamline your organization's workflows and enhance productivity.

## Quick Start Guide

### 1. Complete Your Profile
- Upload a profile picture
- Add your contact information
- Set your department and role

### 2. Explore the Dashboard
- View key metrics and insights
- Access quick actions
- Monitor recent activity

### 3. Set Up Your Team
- Invite team members
- Assign roles and permissions
- Configure department structure

### 4. Start Using Features
- Create and manage projects
- Track employee performance
- Generate reports and analytics

## Need Help?

- Use the AI Assistant for instant answers
- Browse our Knowledge Base for detailed guides
- Join the Community Forum to connect with other users
- Submit feature requests to help us improve

Welcome aboard! 🚀
    `,
    category: "Getting Started",
    tags: ["onboarding", "setup", "first-steps"],
    status: "published",
    view_count: 1250,
    helpful_count: 89,
    not_helpful_count: 3,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-20T15:30:00Z"
  },
  {
    id: "kb-article-2",
    title: "Managing Employee Profiles",
    content: `
# Employee Profile Management

Learn how to effectively manage employee profiles in AIBOS.

## Creating Employee Profiles

### Step 1: Basic Information
- Enter employee name and contact details
- Assign employee ID and department
- Set employment start date

### Step 2: Role and Permissions
- Define job title and responsibilities
- Set access permissions
- Configure reporting structure

### Step 3: Skills and Certifications
- Add relevant skills and expertise
- Upload certifications and documents
- Track training progress

## Updating Profiles

- Regular profile reviews
- Performance updates
- Skill development tracking
- Career progression planning

## Best Practices

- Keep information current and accurate
- Regular security reviews
- Document all changes
- Maintain privacy compliance
    `,
    category: "User Guide",
    tags: ["employees", "profiles", "management"],
    status: "published",
    view_count: 890,
    helpful_count: 67,
    not_helpful_count: 5,
    created_at: "2024-01-05T14:20:00Z",
    updated_at: "2024-01-18T11:45:00Z"
  },
  {
    id: "kb-article-3",
    title: "Troubleshooting Login Issues",
    content: `
# Common Login Problems and Solutions

Having trouble logging into AIBOS? Here are the most common issues and how to resolve them.

## Issue: "Invalid Credentials"

### Possible Causes:
- Incorrect email or password
- Caps Lock enabled
- Account locked due to failed attempts

### Solutions:
1. **Check your credentials**
   - Verify email address spelling
   - Ensure password is correct
   - Check Caps Lock status

2. **Reset your password**
   - Click "Forgot Password" link
   - Follow email instructions
   - Create a new strong password

3. **Contact support**
   - If account is locked
   - For persistent issues
   - When email reset doesn't work

## Issue: "Account Not Found"

### Possible Causes:
- Email not registered
- Account deactivated
- Wrong email domain

### Solutions:
1. **Verify email address**
   - Check for typos
   - Confirm correct domain
   - Try alternative email

2. **Contact administrator**
   - Request account creation
   - Verify organization membership
   - Check account status

## Issue: "Session Expired"

### Solutions:
1. **Refresh the page**
2. **Clear browser cache**
3. **Log in again**
4. **Check internet connection**

## Prevention Tips

- Use strong, unique passwords
- Enable two-factor authentication
- Keep browser updated
- Clear cache regularly
    `,
    category: "Troubleshooting",
    tags: ["login", "authentication", "troubleshooting"],
    status: "published",
    view_count: 2340,
    helpful_count: 156,
    not_helpful_count: 12,
    created_at: "2024-01-10T09:15:00Z",
    updated_at: "2024-01-22T16:20:00Z"
  }
];

export const sampleCommunityPosts: CommunityPost[] = [
  {
    id: "post-1",
    title: "Best Practices for Team Onboarding",
    content: `
I've been managing team onboarding for the past 6 months and wanted to share some best practices that have worked well for us:

## Pre-Onboarding (Week Before)
- Send welcome email with system overview
- Prepare access credentials
- Assign a buddy/mentor
- Schedule orientation meeting

## Day 1
- System walkthrough
- Basic training session
- Profile setup assistance
- Team introductions

## Week 1
- Daily check-ins
- Task assignments
- Feedback collection
- Additional training as needed

## Month 1
- Performance review
- Skill assessment
- Goal setting
- Integration evaluation

What onboarding practices have worked well for your teams?
    `,
    category: "Tips & Tricks",
    author_id: "user-1",
    status: "active",
    view_count: 456,
    reply_count: 8,
    last_reply_at: "2024-01-21T14:30:00Z",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-21T14:30:00Z"
  },
  {
    id: "post-2",
    title: "Feature Request: Advanced Analytics Dashboard",
    content: `
I've been using AIBOS for about 3 months now and it's been great! However, I think we could benefit from a more advanced analytics dashboard.

## Current Limitations
- Basic metrics only
- Limited customization
- No export functionality
- No historical comparisons

## Proposed Features
- Custom chart builder
- Advanced filtering options
- Data export (CSV, PDF, Excel)
- Historical trend analysis
- Real-time data updates
- Scheduled reports

## Use Cases
- Executive reporting
- Department performance tracking
- Resource allocation analysis
- ROI calculations

Would love to hear if others have similar needs and what specific analytics features would be most valuable.
    `,
    category: "Feature Requests",
    author_id: "user-2",
    status: "active",
    view_count: 234,
    reply_count: 5,
    last_reply_at: "2024-01-20T16:45:00Z",
    created_at: "2024-01-12T11:30:00Z",
    updated_at: "2024-01-20T16:45:00Z"
  },
  {
    id: "post-3",
    title: "How to Optimize Performance for Large Teams",
    content: `
We recently expanded our team from 50 to 200+ employees and noticed some performance issues. Here's what we did to optimize:

## Database Optimization
- Implemented proper indexing
- Optimized queries
- Added caching layer
- Regular maintenance schedules

## System Configuration
- Adjusted memory allocation
- Optimized file upload limits
- Configured CDN for assets
- Implemented load balancing

## User Training
- Best practices workshops
- Performance guidelines
- Regular system updates
- Feedback collection

## Results
- 60% improvement in load times
- 40% reduction in support tickets
- Better user satisfaction
- Increased productivity

Anyone else managing large teams? What optimization strategies have worked for you?
    `,
    category: "Best Practices",
    author_id: "user-3",
    status: "active",
    view_count: 789,
    reply_count: 12,
    last_reply_at: "2024-01-22T09:15:00Z",
    created_at: "2024-01-08T13:20:00Z",
    updated_at: "2024-01-22T09:15:00Z"
  }
];

export const sampleCommunityReplies: CommunityReply[] = [
  {
    id: "reply-1",
    post_id: "post-1",
    content: "Great post! We also found that having a structured 30-60-90 day plan really helps with onboarding success. We create specific goals and milestones for each period.",
    author_id: "user-4",
    is_solution: false,
    helpful_count: 3,
    created_at: "2024-01-16T14:30:00Z",
    updated_at: "2024-01-16T14:30:00Z"
  },
  {
    id: "reply-2",
    post_id: "post-1",
    content: "We use a similar approach but also include a 'reverse mentoring' program where new hires teach existing team members about new technologies or approaches they bring.",
    author_id: "user-5",
    is_solution: false,
    helpful_count: 2,
    created_at: "2024-01-17T10:15:00Z",
    updated_at: "2024-01-17T10:15:00Z"
  },
  {
    id: "reply-3",
    post_id: "post-2",
    content: "I completely agree! The current analytics are too basic for our needs. We've been using external tools for advanced reporting, but having it integrated would be much better.",
    author_id: "user-6",
    is_solution: false,
    helpful_count: 1,
    created_at: "2024-01-13T16:45:00Z",
    updated_at: "2024-01-13T16:45:00Z"
  },
  {
    id: "reply-4",
    post_id: "post-3",
    content: "This is exactly what we needed! We're planning to scale to 150 employees this year and these optimizations will be crucial. Thanks for sharing!",
    author_id: "user-7",
    is_solution: true,
    helpful_count: 8,
    created_at: "2024-01-09T11:20:00Z",
    updated_at: "2024-01-09T11:20:00Z"
  }
];

export const sampleSupportMetrics: SupportMetrics = {
  totalFeatureRequests: 156,
  pendingFeatureRequests: 23,
  totalKnowledgeBaseArticles: 45,
  totalCommunityPosts: 89,
  aiAgentConversations: 1234,
  averageResponseTime: 1.8,
  userSatisfactionScore: 4.6
};

// Helper function to get sample data by type
export const getSampleData = {
  featureRequests: () => sampleFeatureRequests,
  releaseNotes: () => sampleReleaseNotes,
  knowledgeBaseCategories: () => sampleKnowledgeBaseCategories,
  knowledgeBaseArticles: () => sampleKnowledgeBaseArticles,
  communityPosts: () => sampleCommunityPosts,
  communityReplies: () => sampleCommunityReplies,
  supportMetrics: () => sampleSupportMetrics,
}; 