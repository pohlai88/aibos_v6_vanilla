# 🗄️ Database Setup Guide for AIBOS Support System

## 📋 **Prerequisites**

### **Option 1: Local Development (Recommended)**
- Docker Desktop installed and running
- Supabase CLI installed: `npm install -g supabase`

### **Option 2: Remote Supabase Instance**
- Supabase project created at [supabase.com](https://supabase.com)
- Project URL and anon key from your Supabase dashboard

## 🚀 **Setup Steps**

### **Step 1: Environment Configuration**

Create a `.env` file in the project root:

```bash
# Copy the example file
cp env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# For local development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key

# For remote Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-remote-anon-key
```

### **Step 2: Local Supabase Setup (Option 1)**

#### **Start Local Supabase**
```bash
# Start Docker Desktop first, then:
npx supabase start
```

#### **Apply Migrations**
```bash
# Apply all migrations
npx supabase db push

# Or reset database (WARNING: deletes all data)
npx supabase db reset
```

#### **Get Local Credentials**
```bash
npx supabase status
```

Copy the local URL and anon key to your `.env` file.

### **Step 3: Remote Supabase Setup (Option 2)**

#### **Link to Remote Project**
```bash
npx supabase link --project-ref your-project-id
```

#### **Apply Migrations**
```bash
npx supabase db push
```

### **Step 4: Verify Database Setup**

Run the verification script:
```bash
node scripts/verify-database.js
```

## 📊 **Expected Database Schema**

After successful migration, your database should contain these tables:

### **Core Support Tables**
- `feature_requests` - User feature requests with upvoting
- `release_notes` - Version release information
- `knowledge_base_articles` - Help articles and documentation
- `knowledge_base_categories` - Article categories
- `community_posts` - Forum posts
- `community_replies` - Forum replies
- `ai_agent_conversations` - AI chat sessions
- `ai_agent_messages` - Individual AI messages
- `proactive_help_suggestions` - Contextual help suggestions
- `support_analytics` - Usage analytics and metrics

### **Supporting Tables**
- `profiles` - User profiles (from core schema)
- `notifications` - System notifications
- `security_events` - Security audit logs

## 🔐 **Row Level Security (RLS)**

The support system includes RLS policies for:

### **Feature Requests**
- Users can view all feature requests
- Users can create their own feature requests
- Users can upvote any feature request
- Admins can update all feature requests

### **Knowledge Base**
- All users can view published articles
- Admins can create/edit articles
- View counts are tracked

### **Community**
- Users can view all posts and replies
- Users can create posts and replies
- Reply counts are automatically updated

### **AI Agent**
- Users can only access their own conversations
- Messages are linked to conversations
- Feedback is tracked per conversation

## 🧪 **Testing Database Setup**

### **1. Start the Application**
```bash
npm run dev
```

### **2. Test Support System**
1. Navigate to `http://localhost:3000/help`
2. Check browser console for database errors
3. Test each support feature:
   - AI Assistant
   - Knowledge Base
   - Community Forum
   - Feature Requests
   - Release Notes

### **3. Verify Data Loading**
- Check if sample data loads (if inserted)
- Verify search functionality works
- Test form submissions

## 🔧 **Troubleshooting**

### **Common Issues**

#### **"Connection Refused"**
- Ensure Docker Desktop is running (for local setup)
- Check if Supabase is started: `npx supabase status`
- Verify `.env` credentials are correct

#### **"Table Does Not Exist"**
- Run migrations: `npx supabase db push`
- Check migration files exist in `supabase/migrations/`
- Verify migration was applied successfully

#### **"RLS Policy Violation"**
- Check if user is authenticated
- Verify RLS policies are enabled
- Check user permissions and roles

#### **"TypeScript Errors"**
- Run: `npx tsc --noEmit`
- Check for missing type definitions
- Verify imports are correct

### **Reset Database (Local Only)**
```bash
# WARNING: This deletes all data
npx supabase db reset
```

### **View Database Logs**
```bash
npx supabase logs
```

## 📈 **Sample Data**

After setup, you can insert sample data for testing:

```sql
-- Insert sample release notes
INSERT INTO release_notes (version, title, highlights, details) VALUES
('v2.1.0', 'Enhanced AI Assistant', 'New AI-powered support features', 'Complete support system with AI agent and analytics');

-- Insert sample feature requests
INSERT INTO feature_requests (user_id, title, description, status, upvotes) VALUES
('sample-user-id', 'Dark Mode', 'Add dark theme option', 'planned', 15);
```

Or use the sample data from `src/lib/sampleData.ts` in your application.

## 🎯 **Success Criteria**

Database setup is successful when:

- ✅ All migration files applied without errors
- ✅ Support system pages load without database errors
- ✅ RLS policies work correctly (users can only access appropriate data)
- ✅ Sample data can be inserted and retrieved
- ✅ Search functionality works across all support features
- ✅ AI agent conversations are properly stored and retrieved

## 📚 **Next Steps**

After successful database setup:

1. **Test the Support System** - Follow the testing guide
2. **Add Real Content** - Populate knowledge base and community
3. **Configure AI Integration** - Connect to AI service
4. **Deploy to Production** - Use the deployment checklist

---

*This guide ensures your AIBOS Support System database is properly configured and ready for testing and production use.* 