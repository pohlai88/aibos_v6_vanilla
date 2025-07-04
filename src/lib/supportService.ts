import { supabase } from './supabase';
import type {
  FeatureRequest,
  ReleaseNote,
  KnowledgeBaseArticle,
  KnowledgeBaseCategory,
  CommunityPost,
  CommunityReply,
  AIAgentConversation,
  AIAgentMessage,
  SupportAnalytics,
  ProactiveHelpSuggestion,
  FeatureRequestForm,
  KnowledgeBaseArticleForm,
  CommunityPostForm,
  CommunityReplyForm,
  AIAgentResponse,
  SupportMetrics,
  SupportTrends,
  SupportSearchResult,
  SupportSearchFilters,
} from '../types/support';

export class SupportService {
  // Feature Requests
  async getFeatureRequests(filters?: SupportSearchFilters): Promise<FeatureRequest[]> {
    try {
      let query = supabase
        .from('feature_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters?.categories?.length) {
        query = query.in('category', filters.categories);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching feature requests:', error);
      throw error;
    }
  }

  async createFeatureRequest(form: FeatureRequestForm): Promise<FeatureRequest> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('feature_requests')
        .insert({
          user_id: user.id,
          title: form.title,
          description: form.description,
          category: form.category,
          tags: form.tags,
          priority: form.priority,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating feature request:', error);
      throw error;
    }
  }

  async updateFeatureRequest(id: number, updates: Partial<FeatureRequest>): Promise<FeatureRequest> {
    try {
      const { data, error } = await supabase
        .from('feature_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating feature request:', error);
      throw error;
    }
  }

  async upvoteFeatureRequest(id: number): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_feature_request_upvotes', { request_id: id });
      if (error) throw error;
    } catch (error) {
      console.error('Error upvoting feature request:', error);
      throw error;
    }
  }

  // Release Notes
  async getReleaseNotes(): Promise<ReleaseNote[]> {
    try {
      const { data, error } = await supabase
        .from('release_notes')
        .select('*')
        .order('released_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching release notes:', error);
      throw error;
    }
  }

  async createReleaseNote(note: Omit<ReleaseNote, 'id' | 'released_at'>): Promise<ReleaseNote> {
    try {
      const { data, error } = await supabase
        .from('release_notes')
        .insert(note)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating release note:', error);
      throw error;
    }
  }

  // Knowledge Base
  async getKnowledgeBaseArticles(category?: string): Promise<KnowledgeBaseArticle[]> {
    try {
      let query = supabase
        .from('knowledge_base_articles')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching knowledge base articles:', error);
      throw error;
    }
  }

  async getKnowledgeBaseCategories(): Promise<KnowledgeBaseCategory[]> {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching knowledge base categories:', error);
      throw error;
    }
  }

  async createKnowledgeBaseArticle(form: KnowledgeBaseArticleForm): Promise<KnowledgeBaseArticle> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .insert({
          title: form.title,
          content: form.content,
          category: form.category,
          tags: form.tags,
          status: form.status,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating knowledge base article:', error);
      throw error;
    }
  }

  async incrementArticleViewCount(articleId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('update_article_view_count', { article_id: articleId });
      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing article view count:', error);
      throw error;
    }
  }

  // Community Forum
  async getCommunityPosts(category?: string): Promise<CommunityPost[]> {
    try {
      let query = supabase
        .from('community_posts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching community posts:', error);
      throw error;
    }
  }

  async createCommunityPost(form: CommunityPostForm): Promise<CommunityPost> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          title: form.title,
          content: form.content,
          category: form.category,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating community post:', error);
      throw error;
    }
  }

  async getCommunityReplies(postId: string): Promise<CommunityReply[]> {
    try {
      const { data, error } = await supabase
        .from('community_replies')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching community replies:', error);
      throw error;
    }
  }

  async createCommunityReply(postId: string, form: CommunityReplyForm): Promise<CommunityReply> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('community_replies')
        .insert({
          post_id: postId,
          content: form.content,
          parent_reply_id: form.parent_reply_id,
          author_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update post reply count
      await this.incrementPostReplyCount(postId);

      return data;
    } catch (error) {
      console.error('Error creating community reply:', error);
      throw error;
    }
  }

  private async incrementPostReplyCount(postId: string): Promise<void> {
    try {
      // Fetch current reply_count
      const { data: post, error: fetchError } = await supabase
        .from('community_posts')
        .select('reply_count')
        .eq('id', postId)
        .single();
      if (fetchError) throw fetchError;
      const newCount = (post?.reply_count ?? 0) + 1;
      const { error } = await supabase
        .from('community_posts')
        .update({ 
          reply_count: newCount,
          last_reply_at: new Date().toISOString()
        })
        .eq('id', postId);
      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing post reply count:', error);
    }
  }

  // AI Agent
  async createAIAgentConversation(sessionId: string, context?: string): Promise<AIAgentConversation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ai_agent_conversations')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          context,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating AI agent conversation:', error);
      throw error;
    }
  }

  async addAIAgentMessage(conversationId: string, role: 'user' | 'assistant', content: string, metadata?: Record<string, any>): Promise<AIAgentMessage> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_messages')
        .insert({
          conversation_id: conversationId,
          role,
          content,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding AI agent message:', error);
      throw error;
    }
  }

  async getAIAgentConversation(sessionId: string): Promise<AIAgentConversation | null> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching AI agent conversation:', error);
      throw error;
    }
  }

  async getAIAgentMessages(conversationId: string): Promise<AIAgentMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI agent messages:', error);
      throw error;
    }
  }

  async updateAIAgentConversation(conversationId: string, updates: Partial<AIAgentConversation>): Promise<AIAgentConversation> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_conversations')
        .update(updates)
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating AI agent conversation:', error);
      throw error;
    }
  }

  // Proactive Help
  async getProactiveSuggestions(userId: string): Promise<ProactiveHelpSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('proactive_help_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching proactive suggestions:', error);
      throw error;
    }
  }

  async dismissProactiveSuggestion(suggestionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('proactive_help_suggestions')
        .update({
          dismissed: true,
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', suggestionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error dismissing proactive suggestion:', error);
      throw error;
    }
  }

  // Analytics
  async getSupportMetrics(): Promise<SupportMetrics> {
    try {
      // This would typically aggregate data from multiple tables
      // For now, returning mock data structure
      const metrics: SupportMetrics = {
        totalFeatureRequests: 0,
        pendingFeatureRequests: 0,
        totalKnowledgeBaseArticles: 0,
        totalCommunityPosts: 0,
        aiAgentConversations: 0,
        averageResponseTime: 0,
        userSatisfactionScore: 0,
      };

      // Get actual counts from database
      const [
        featureRequests,
        knowledgeBaseArticles,
        communityPosts,
        aiConversations,
      ] = await Promise.all([
        this.getFeatureRequests(),
        this.getKnowledgeBaseArticles(),
        this.getCommunityPosts(),
        this.getAIAgentConversations(),
      ]);

      metrics.totalFeatureRequests = featureRequests.length;
      metrics.pendingFeatureRequests = featureRequests.filter(fr => fr.status === 'pending').length;
      metrics.totalKnowledgeBaseArticles = knowledgeBaseArticles.length;
      metrics.totalCommunityPosts = communityPosts.length;
      metrics.aiAgentConversations = aiConversations.length;

      return metrics;
    } catch (error) {
      console.error('Error fetching support metrics:', error);
      throw error;
    }
  }

  private async getAIAgentConversations(): Promise<AIAgentConversation[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agent_conversations')
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching AI agent conversations:', error);
      return [];
    }
  }

  // Search
  async searchSupport(query: string, filters?: SupportSearchFilters): Promise<SupportSearchResult[]> {
    try {
      const results: SupportSearchResult[] = [];

      // Search in knowledge base articles
      const articles = await this.searchKnowledgeBase(query, filters);
      results.push(...articles);

      // Search in community posts
      const posts = await this.searchCommunityPosts(query, filters);
      results.push(...posts);

      // Search in feature requests
      const featureRequests = await this.searchFeatureRequests(query, filters);
      results.push(...featureRequests);

      // Sort by relevance
      return results.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Error searching support:', error);
      throw error;
    }
  }

  private async searchKnowledgeBase(query: string, filters?: SupportSearchFilters): Promise<SupportSearchResult[]> {
    try {
      let searchQuery = supabase
        .from('knowledge_base_articles')
        .select('id, title, content, category')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .eq('status', 'published');

      if (filters?.categories?.length) {
        searchQuery = searchQuery.in('category', filters.categories);
      }

      const { data, error } = await searchQuery;
      if (error) throw error;

      return (data || []).map(article => ({
        type: 'article' as const,
        id: article.id,
        title: article.title,
        excerpt: article.content.substring(0, 150) + '...',
        category: article.category,
        relevance: this.calculateRelevance(query, article.title, article.content),
        url: `/help?tab=knowledge-base&article=${article.id}`,
      }));
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      return [];
    }
  }

  private async searchCommunityPosts(query: string, filters?: SupportSearchFilters): Promise<SupportSearchResult[]> {
    try {
      let searchQuery = supabase
        .from('community_posts')
        .select('id, title, content, category')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .eq('status', 'active');

      if (filters?.categories?.length) {
        searchQuery = searchQuery.in('category', filters.categories);
      }

      const { data, error } = await searchQuery;
      if (error) throw error;

      return (data || []).map(post => ({
        type: 'post' as const,
        id: post.id,
        title: post.title,
        excerpt: post.content.substring(0, 150) + '...',
        category: post.category,
        relevance: this.calculateRelevance(query, post.title, post.content),
        url: `/help?tab=community&post=${post.id}`,
      }));
    } catch (error) {
      console.error('Error searching community posts:', error);
      return [];
    }
  }

  private async searchFeatureRequests(query: string, filters?: SupportSearchFilters): Promise<SupportSearchResult[]> {
    try {
      let searchQuery = supabase
        .from('feature_requests')
        .select('id, title, description, category')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      if (filters?.status?.length) {
        searchQuery = searchQuery.in('status', filters.status);
      }

      const { data, error } = await searchQuery;
      if (error) throw error;

      return (data || []).map(request => ({
        type: 'feature_request' as const,
        id: request.id.toString(),
        title: request.title,
        excerpt: request.description?.substring(0, 150) + '...' || '',
        category: request.category || 'general',
        relevance: this.calculateRelevance(query, request.title, request.description || ''),
        url: `/help?tab=feature-requests&request=${request.id}`,
      }));
    } catch (error) {
      console.error('Error searching feature requests:', error);
      return [];
    }
  }

  private calculateRelevance(query: string, title: string, content: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();

    let relevance = 0;

    // Title matches are worth more
    if (titleLower.includes(queryLower)) relevance += 10;
    if (titleLower.startsWith(queryLower)) relevance += 5;

    // Content matches
    const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
    relevance += contentMatches * 2;

    // Exact phrase matches
    if (contentLower.includes(queryLower)) relevance += 3;

    return Math.min(relevance, 100);
  }
}

export const supportService = new SupportService(); 