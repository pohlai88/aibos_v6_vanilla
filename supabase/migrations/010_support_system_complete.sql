-- Migration: Complete Support System Tables
-- This migration includes all tables needed for the comprehensive support system

-- Enhanced Feature Requests table with categories and tags
ALTER TABLE IF EXISTS feature_requests ADD COLUMN IF NOT EXISTS category text DEFAULT 'general';
ALTER TABLE IF EXISTS feature_requests ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE IF EXISTS feature_requests ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';
ALTER TABLE IF EXISTS feature_requests ADD COLUMN IF NOT EXISTS assigned_to uuid;
ALTER TABLE IF EXISTS feature_requests ADD COLUMN IF NOT EXISTS estimated_release text;
ALTER TABLE IF EXISTS feature_requests ADD COLUMN IF NOT EXISTS admin_notes text;

-- Knowledge Base Articles table
CREATE TABLE IF NOT EXISTS knowledge_base_articles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    category text NOT NULL,
    tags text[],
    author_id uuid REFERENCES auth.users(id),
    status text DEFAULT 'published', -- draft, published, archived
    view_count integer DEFAULT 0,
    helpful_count integer DEFAULT 0,
    not_helpful_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Knowledge Base Categories table
CREATE TABLE IF NOT EXISTS knowledge_base_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    icon text,
    parent_id uuid REFERENCES knowledge_base_categories(id),
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Community Forum Posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    category text NOT NULL,
    author_id uuid REFERENCES auth.users(id),
    status text DEFAULT 'active', -- active, locked, deleted
    view_count integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    last_reply_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Community Forum Replies table
CREATE TABLE IF NOT EXISTS community_replies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id uuid REFERENCES community_posts(id) ON DELETE CASCADE,
    content text NOT NULL,
    author_id uuid REFERENCES auth.users(id),
    parent_reply_id uuid REFERENCES community_replies(id),
    is_solution boolean DEFAULT false,
    helpful_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- AI Agent Conversations table
CREATE TABLE IF NOT EXISTS ai_agent_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    session_id text NOT NULL,
    context text, -- JSON string of conversation context
    confidence_score numeric(3,2),
    suggested_actions text[], -- Array of suggested actions
    feedback_rating integer, -- 1-5 rating
    feedback_comment text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- AI Agent Messages table
CREATE TABLE IF NOT EXISTS ai_agent_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES ai_agent_conversations(id) ON DELETE CASCADE,
    role text NOT NULL, -- 'user' or 'assistant'
    content text NOT NULL,
    metadata jsonb, -- Additional data like confidence, sources, etc.
    created_at timestamptz DEFAULT now()
);

-- Support Analytics table
CREATE TABLE IF NOT EXISTS support_analytics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    date date NOT NULL,
    metric_name text NOT NULL,
    metric_value numeric,
    category text,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    UNIQUE(date, metric_name, category)
);

-- Proactive Help Suggestions table
CREATE TABLE IF NOT EXISTS proactive_help_suggestions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    suggestion_type text NOT NULL, -- 'contextual', 'onboarding', 'feature_discovery'
    title text NOT NULL,
    description text,
    action_url text,
    dismissed boolean DEFAULT false,
    clicked boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    dismissed_at timestamptz
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON knowledge_base_articles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_status ON knowledge_base_articles(status);
CREATE INDEX IF NOT EXISTS idx_kb_articles_tags ON knowledge_base_articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_status ON community_posts(status);
CREATE INDEX IF NOT EXISTS idx_community_replies_post_id ON community_replies(post_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON ai_agent_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_analytics_date ON support_analytics(date);
CREATE INDEX IF NOT EXISTS idx_support_analytics_metric ON support_analytics(metric_name);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_user_id ON proactive_help_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_suggestions_type ON proactive_help_suggestions(suggestion_type);

-- Insert default knowledge base categories
INSERT INTO knowledge_base_categories (name, description, icon, sort_order) VALUES
('Getting Started', 'Basic setup and first steps', '🚀', 1),
('User Guide', 'How to use AIBOS features', '📖', 2),
('Troubleshooting', 'Common issues and solutions', '🔧', 3),
('API Reference', 'Technical documentation', '⚙️', 4),
('Best Practices', 'Tips and recommendations', '💡', 5)
ON CONFLICT (name) DO NOTHING;

-- Insert default community forum categories
INSERT INTO community_posts (id, title, content, category, author_id) VALUES
(gen_random_uuid(), 'Welcome to the AIBOS Community!', 'This is a placeholder post. Welcome to our community forum where you can ask questions, share ideas, and connect with other users.', 'general', NULL)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE knowledge_base_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE proactive_help_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Knowledge Base Articles (public read, authenticated write)
CREATE POLICY "Knowledge base articles are viewable by everyone" ON knowledge_base_articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can create knowledge base articles" ON knowledge_base_articles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update their own articles" ON knowledge_base_articles
    FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for Community Posts
CREATE POLICY "Community posts are viewable by everyone" ON community_posts
    FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can create posts" ON community_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own posts" ON community_posts
    FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for Community Replies
CREATE POLICY "Community replies are viewable by everyone" ON community_replies
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create replies" ON community_replies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own replies" ON community_replies
    FOR UPDATE USING (auth.uid() = author_id);

-- RLS Policies for AI Agent Conversations
CREATE POLICY "Users can view their own conversations" ON ai_agent_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create conversations" ON ai_agent_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON ai_agent_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for AI Agent Messages
CREATE POLICY "Users can view messages in their conversations" ON ai_agent_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_agent_conversations 
            WHERE id = ai_agent_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON ai_agent_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_agent_conversations 
            WHERE id = ai_agent_messages.conversation_id 
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for Proactive Help Suggestions
CREATE POLICY "Users can view their own suggestions" ON proactive_help_suggestions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own suggestions" ON proactive_help_suggestions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for analytics
CREATE OR REPLACE FUNCTION update_article_view_count(article_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE knowledge_base_articles 
    SET view_count = view_count + 1 
    WHERE id = article_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_post_view_count(post_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE community_posts 
    SET view_count = view_count + 1 
    WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_knowledge_base_articles_updated_at 
    BEFORE UPDATE ON knowledge_base_articles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_posts_updated_at 
    BEFORE UPDATE ON community_posts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_replies_updated_at 
    BEFORE UPDATE ON community_replies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agent_conversations_updated_at 
    BEFORE UPDATE ON ai_agent_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 