// Support System Types
// Comprehensive type definitions for the AIBOS support system

export interface FeatureRequest {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'planned' | 'in_progress' | 'released' | 'rejected';
  category?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  estimated_release?: string;
  admin_notes?: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

export interface ReleaseNote {
  id: number;
  version: string;
  title?: string;
  highlights?: string;
  details?: string;
  released_at: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags?: string[];
  author_id?: string;
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  helpful_count: number;
  not_helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBaseCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id?: string;
  status: 'active' | 'locked' | 'deleted';
  view_count: number;
  reply_count: number;
  last_reply_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  content: string;
  author_id?: string;
  parent_reply_id?: string;
  is_solution: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIAgentConversation {
  id: string;
  user_id: string;
  session_id: string;
  context?: string;
  confidence_score?: number;
  suggested_actions?: string[];
  feedback_rating?: number;
  feedback_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface AIAgentMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SupportAnalytics {
  id: string;
  date: string;
  metric_name: string;
  metric_value?: number;
  category?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ProactiveHelpSuggestion {
  id: string;
  user_id: string;
  suggestion_type: 'contextual' | 'onboarding' | 'feature_discovery';
  title: string;
  description?: string;
  action_url?: string;
  dismissed: boolean;
  clicked: boolean;
  created_at: string;
  dismissed_at?: string;
}

// Form types for creating/editing
export interface FeatureRequestForm {
  title: string;
  description: string;
  category: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface KnowledgeBaseArticleForm {
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

export interface CommunityPostForm {
  title: string;
  content: string;
  category: string;
}

export interface CommunityReplyForm {
  content: string;
  parent_reply_id?: string;
}

// AI Agent types
export interface AIAgentResponse {
  message: string;
  confidence: number;
  suggestedActions?: string[];
  sources?: string[];
  metadata?: Record<string, any>;
}

export interface AIAgentContext {
  currentPage?: string;
  userAction?: string;
  userProfile?: Record<string, any>;
  recentActivity?: string[];
}

// Analytics types
export interface SupportMetrics {
  totalFeatureRequests: number;
  pendingFeatureRequests: number;
  totalKnowledgeBaseArticles: number;
  totalCommunityPosts: number;
  aiAgentConversations: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
}

export interface SupportTrends {
  date: string;
  featureRequests: number;
  knowledgeBaseViews: number;
  communityPosts: number;
  aiAgentInteractions: number;
}

// Search types
export interface SupportSearchResult {
  type: 'article' | 'post' | 'feature_request' | 'release_note';
  id: string;
  title: string;
  excerpt: string;
  category: string;
  relevance: number;
  url: string;
}

export interface SupportSearchFilters {
  categories?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
  tags?: string[];
}

// Notification types for support system
export interface SupportNotification {
  id: string;
  type: 'feature_request' | 'community_post' | 'ai_feedback' | 'system_update';
  title: string;
  message: string;
  action_url?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  read: boolean;
} 