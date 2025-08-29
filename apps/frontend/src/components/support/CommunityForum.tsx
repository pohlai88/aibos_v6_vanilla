import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  replies: number;
  views: number;
  likes: number;
  isPinned: boolean;
  isSolved: boolean;
  status: 'open' | 'closed' | 'archived';
}

interface ForumReply {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  isAccepted: boolean;
  isModerator: boolean;
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  postCount: number;
  color: string;
}

const CommunityForum: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [newPostData, setNewPostData] = useState({
    title: "",
    content: "",
    category: "",
    tags: ""
  });
  const [newReplyContent, setNewReplyContent] = useState("");

  const categories: ForumCategory[] = [
    {
      id: "general",
      name: "General Discussion",
      description: "General topics about AIBOS",
      icon: "💬",
      postCount: 45,
      color: "blue"
    },
    {
      id: "help",
      name: "Help & Support",
      description: "Get help from the community",
      icon: "❓",
      postCount: 89,
      color: "green"
    },
    {
      id: "features",
      name: "Feature Requests",
      description: "Suggest new features",
      icon: "💡",
      postCount: 23,
      color: "purple"
    },
    {
      id: "tips",
      name: "Tips & Tricks",
      description: "Share your knowledge",
      icon: "💎",
      postCount: 34,
      color: "yellow"
    },
    {
      id: "showcase",
      name: "Showcase",
      description: "Show off your work",
      icon: "🎨",
      postCount: 12,
      color: "pink"
    },
    {
      id: "announcements",
      name: "Announcements",
      description: "Official announcements",
      icon: "📢",
      postCount: 8,
      color: "red"
    }
  ];

  // Sample forum posts
  const samplePosts: ForumPost[] = [
    {
      id: "1",
      title: "Best practices for organizing employee data?",
      content: `Hi everyone! 👋

I'm new to AIBOS and I'm setting up our employee database. I was wondering what are some best practices for organizing employee data effectively?

Specifically, I'm curious about:
- How to structure departments and divisions
- What custom fields are most useful
- How to handle different employee types (full-time, contractors, etc.)
- Tips for data import and migration

Any advice would be greatly appreciated! Thanks in advance.`,
      author: {
        id: "user1",
        name: "Sarah Chen",
        avatar: "👩‍💼",
        role: "HR Manager"
      },
      category: "help",
      tags: ["employee-database", "organization", "best-practices"],
      createdAt: new Date("2024-01-15T10:30:00"),
      updatedAt: new Date("2024-01-15T10:30:00"),
      replies: 8,
      views: 156,
      likes: 12,
      isPinned: false,
      isSolved: true,
      status: 'open'
    },
    {
      id: "2",
      title: "Feature Request: Advanced Reporting Dashboard",
      content: `I'd love to see an advanced reporting dashboard with the following features:

**Key Requirements:**
- Custom date ranges for all metrics
- Export functionality (PDF, Excel, CSV)
- Drill-down capabilities for detailed analysis
- Comparative reporting (month-over-month, year-over-year)
- Scheduled report generation and email delivery

**Additional Features:**
- Interactive charts and graphs
- Role-based report access
- Template library for common reports
- Real-time data refresh options

This would be incredibly valuable for our executive team and department heads. What do you think?`,
      author: {
        id: "user2",
        name: "Michael Rodriguez",
        avatar: "👨‍💻",
        role: "Data Analyst"
      },
      category: "features",
      tags: ["reporting", "dashboard", "analytics", "feature-request"],
      createdAt: new Date("2024-01-14T14:20:00"),
      updatedAt: new Date("2024-01-14T14:20:00"),
      replies: 15,
      views: 234,
      likes: 28,
      isPinned: false,
      isSolved: false,
      status: 'open'
    },
    {
      id: "3",
      title: "Pro Tip: Using AI Assistant for Quick Data Entry",
      content: `Hey community! I discovered a great time-saving tip for data entry:

**The AI Assistant can help with:**
- Auto-filling employee information from email signatures
- Suggesting department assignments based on job titles
- Detecting duplicate entries automatically
- Formatting phone numbers and addresses consistently

**How to use it:**
1. Start typing in any employee field
2. The AI will suggest completions
3. Use Tab to accept suggestions
4. The more you use it, the better it gets!

This has saved me hours of manual data entry. Hope this helps others! 🚀`,
      author: {
        id: "user3",
        name: "Emma Thompson",
        avatar: "👩‍🔬",
        role: "Operations Manager"
      },
      category: "tips",
      tags: ["ai-assistant", "data-entry", "productivity", "tips"],
      createdAt: new Date("2024-01-13T09:15:00"),
      updatedAt: new Date("2024-01-13T09:15:00"),
      replies: 6,
      views: 98,
      likes: 19,
      isPinned: true,
      isSolved: false,
      status: 'open'
    },
    {
      id: "4",
      title: "Welcome to the AIBOS Community! 🎉",
      content: `Welcome everyone to the official AIBOS Community Forum! 

This is your space to:
- Ask questions and get help from fellow users
- Share tips and best practices
- Suggest new features and improvements
- Showcase your AIBOS implementations
- Connect with other professionals

**Community Guidelines:**
- Be respectful and helpful
- Search before posting
- Use appropriate categories and tags
- Mark solutions as accepted when your question is answered
- Report inappropriate content

Let's build an amazing community together! 🚀`,
      author: {
        id: "admin1",
        name: "AIBOS Team",
        avatar: "🤖",
        role: "Admin"
      },
      category: "announcements",
      tags: ["welcome", "community", "guidelines"],
      createdAt: new Date("2024-01-10T12:00:00"),
      updatedAt: new Date("2024-01-10T12:00:00"),
      replies: 3,
      views: 567,
      likes: 45,
      isPinned: true,
      isSolved: false,
      status: 'open'
    }
  ];

  const sampleReplies: ForumReply[] = [
    {
      id: "reply1",
      content: `Great question, Sarah! Here's how I organize our employee data:

**Department Structure:**
- Use clear, hierarchical naming (e.g., "Engineering > Frontend > React Team")
- Keep department names consistent and professional
- Consider using codes for large organizations (e.g., "ENG-FE-001")

**Custom Fields I find most useful:**
- Employee ID (for external system integration)
- Hire Date (for anniversary tracking)
- Manager (for reporting relationships)
- Location/Timezone (for remote teams)
- Skills Matrix (for project assignments)

**Employee Types:**
- Create separate categories for different employment types
- Use tags to distinguish between full-time, part-time, contractors
- Set up different permission levels based on employment type

**Data Import Tips:**
- Always backup existing data before import
- Use the CSV template provided by AIBOS
- Validate data in Excel before importing
- Start with a small test group

Hope this helps! Let me know if you need more specific guidance.`,
      author: {
        id: "user4",
        name: "David Kim",
        avatar: "👨‍💼",
        role: "HR Director"
      },
      createdAt: new Date("2024-01-15T11:45:00"),
      updatedAt: new Date("2024-01-15T11:45:00"),
      likes: 8,
      isAccepted: true,
      isModerator: false
    },
    {
      id: "reply2",
      content: `I second David's advice! A few additional tips:

**For data migration:**
- Use the bulk upload feature for large datasets
- The AI assistant can help clean up inconsistent data
- Set up validation rules before importing

**Department organization:**
- Keep it simple initially, you can always expand later
- Use consistent naming conventions across your organization
- Consider future growth when structuring departments

**Custom fields:**
- Don't overdo it initially - start with the essentials
- You can always add more fields later
- Use dropdowns for standardized data (like job levels)

The key is to start simple and iterate based on your needs. Good luck with your setup!`,
      author: {
        id: "user5",
        name: "Lisa Wang",
        avatar: "👩‍💻",
        role: "HR Specialist"
      },
      createdAt: new Date("2024-01-15T13:20:00"),
      updatedAt: new Date("2024-01-15T13:20:00"),
      likes: 5,
      isAccepted: false,
      isModerator: false
    }
  ];

  useEffect(() => {
    setPosts(samplePosts);
  }, []);

  useEffect(() => {
    if (selectedPost) {
      setReplies(sampleReplies);
    }
  }, [selectedPost]);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newPost: ForumPost = {
      id: Date.now().toString(),
      title: newPostData.title,
      content: newPostData.content,
      author: {
        id: user?.id || "user",
        name: user?.user_metadata?.full_name || "Anonymous",
        avatar: "👤",
        role: "User"
      },
      category: newPostData.category,
      tags: newPostData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: 0,
      views: 0,
      likes: 0,
      isPinned: false,
      isSolved: false,
      status: 'open'
    };

    setPosts(prev => [newPost, ...prev]);
    setShowNewPostForm(false);
    setNewPostData({ title: "", content: "", category: "", tags: "" });
  };

  const handleAddReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyContent.trim() || !selectedPost) return;

    const newReply: ForumReply = {
      id: Date.now().toString(),
      content: newReplyContent,
      author: {
        id: user?.id || "user",
        name: user?.user_metadata?.full_name || "Anonymous",
        avatar: "👤",
        role: "User"
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
      isAccepted: false,
      isModerator: false
    };

    setReplies(prev => [...prev, newReply]);
    setNewReplyContent("");
    
    // Update post reply count
    setPosts(prev => prev.map(post => 
      post.id === selectedPost.id 
        ? { ...post, replies: post.replies + 1 }
        : post
    ));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || 'gray';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Forum</h1>
            <p className="text-gray-600">Connect, learn, and share with the AIBOS community</p>
          </div>
          <button
            onClick={() => setShowNewPostForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
          >
            Create New Post
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* New Post Form */}
      {showNewPostForm && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Create New Post</h3>
            <button
              onClick={() => setShowNewPostForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              <input
                type="text"
                value={newPostData.title}
                onChange={(e) => setNewPostData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="What's your question or topic?"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={newPostData.category}
                onChange={(e) => setNewPostData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                value={newPostData.content}
                onChange={(e) => setNewPostData(prev => ({ ...prev, content: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
                placeholder="Share your question, idea, or discussion topic..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={newPostData.tags}
                onChange={(e) => setNewPostData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="help, question, feature-request"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewPostForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Post
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedCategory === "all"
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>📚 All Posts</span>
                  <span className="text-sm text-gray-500">{posts.length}</span>
                </div>
              </button>
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{category.icon} {category.name}</span>
                    <span className="text-sm text-gray-500">{category.postCount}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="lg:col-span-3">
          {selectedPost ? (
            /* Post Detail View */
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Post Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Posts
                  </button>
                  <div className="flex items-center space-x-2">
                    {selectedPost.isPinned && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        📌 Pinned
                      </span>
                    )}
                    {selectedPost.isSolved && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        ✅ Solved
                      </span>
                    )}
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-4">{selectedPost.title}</h1>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{selectedPost.author.avatar}</span>
                    <span>{selectedPost.author.name}</span>
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                      {selectedPost.author.role}
                    </span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(selectedPost.createdAt)}</span>
                  <span>•</span>
                  <span>{selectedPost.views} views</span>
                  <span>•</span>
                  <span>{selectedPost.replies} replies</span>
                </div>

                {/* Post Tags */}
                <div className="flex flex-wrap gap-2">
                  {selectedPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Post Content */}
              <div className="p-6 border-b border-gray-200">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {selectedPost.content}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                    <span>👍</span>
                    <span>{selectedPost.likes}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                    <span>💬</span>
                    <span>Reply</span>
                  </button>
                </div>
              </div>

              {/* Replies */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Replies ({replies.length})
                </h3>
                
                <div className="space-y-6">
                  {replies.map((reply) => (
                    <div key={reply.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                            {reply.author.avatar}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-900">{reply.author.name}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                              {reply.author.role}
                            </span>
                            {reply.isAccepted && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                ✅ Accepted Answer
                              </span>
                            )}
                            {reply.isModerator && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                👑 Moderator
                              </span>
                            )}
                            <span className="text-sm text-gray-500">{formatDate(reply.createdAt)}</span>
                          </div>
                          
                          <div className="text-gray-700 leading-relaxed mb-3">
                            {reply.content}
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600">
                              <span>👍</span>
                              <span>{reply.likes}</span>
                            </button>
                            <button className="text-gray-600 hover:text-blue-600">
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Reply Form */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Add Your Reply</h4>
                  <form onSubmit={handleAddReply} className="space-y-4">
                    <textarea
                      value={newReplyContent}
                      onChange={(e) => setNewReplyContent(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Share your thoughts, answer, or suggestion..."
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Post Reply
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Posts List View */
            <div className="space-y-4">
              {filteredPosts.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms or browse by category
                  </p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                          {post.author.avatar}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate">
                            {post.title}
                          </h3>
                          {post.isPinned && (
                            <span className="text-yellow-500">📌</span>
                          )}
                          {post.isSolved && (
                            <span className="text-green-500">✅</span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {post.content.substring(0, 200)}...
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{post.author.name}</span>
                            <span>•</span>
                            <span>{formatDate(post.createdAt)}</span>
                            <span>•</span>
                            <span>{post.views} views</span>
                            <span>•</span>
                            <span>{post.replies} replies</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600 text-sm">👍 {post.likes}</span>
                          </div>
                        </div>
                        
                        {/* Post Tags */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                              +{post.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityForum; 