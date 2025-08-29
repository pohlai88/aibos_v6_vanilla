import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: Date;
  author: string;
  readTime: number;
  helpful: number;
  notHelpful: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  articleCount: number;
}

const KnowledgeBase: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Sample knowledge base data
  const categories: Category[] = [
    {
      id: "getting-started",
      name: "Getting Started",
      description: "Essential guides for new users",
      icon: "🚀",
      articleCount: 8
    },
    {
      id: "account-security",
      name: "Account & Security",
      description: "Password, 2FA, and security settings",
      icon: "🔐",
      articleCount: 12
    },
    {
      id: "features",
      name: "Features & Tools",
      description: "How to use AIBOS features effectively",
      icon: "💡",
      articleCount: 15
    },
    {
      id: "profile",
      name: "Profile Management",
      description: "Managing your profile and preferences",
      icon: "👤",
      articleCount: 6
    },
    {
      id: "troubleshooting",
      name: "Troubleshooting",
      description: "Common issues and solutions",
      icon: "🔧",
      articleCount: 10
    },
    {
      id: "advanced",
      name: "Advanced Topics",
      description: "Power user features and tips",
      icon: "⚡",
      articleCount: 8
    }
  ];

  const articles: Article[] = [
    {
      id: "welcome-to-aibos",
      title: "Welcome to AIBOS: Your Complete Guide",
      content: `# Welcome to AIBOS! 🎉

## What is AIBOS?

AIBOS (AI Business Operating System) is a comprehensive platform designed to streamline your business operations with intelligent automation and powerful tools.

## Key Features

### 🤖 AI-Powered Assistance
- Advanced AI agent for instant support
- Smart automation for repetitive tasks
- Intelligent insights and recommendations

### 👥 Team Management
- Employee database with advanced profiles
- Multi-company organization support
- Role-based access control

### 📊 Analytics & Insights
- Real-time performance metrics
- Customizable dashboards
- Data-driven decision making

### 🔐 Enterprise Security
- Two-factor authentication
- Row-level security
- Comprehensive audit logs

## Getting Started

1. **Complete Your Profile**: Add your information and preferences
2. **Explore the Dashboard**: Familiarize yourself with key metrics
3. **Set Up Security**: Enable 2FA and review security settings
4. **Invite Team Members**: Start building your organization
5. **Customize Settings**: Tailor AIBOS to your needs

## Need Help?

- 🤖 **AI Assistant**: Click the floating AI button for instant help
- 📚 **Knowledge Base**: Browse comprehensive guides (you're here!)
- 💬 **Community Forum**: Connect with other users
- 🎫 **Support Tickets**: Submit specific issues

Welcome aboard! We're excited to help you succeed with AIBOS.`,
      category: "getting-started",
      tags: ["welcome", "introduction", "features", "getting-started"],
      lastUpdated: new Date("2024-01-15"),
      author: "AIBOS Team",
      readTime: 5,
      helpful: 127,
      notHelpful: 3
    },
    {
      id: "password-reset-guide",
      title: "How to Reset Your Password",
      content: `# Password Reset Guide 🔐

## Forgot Your Password?

Don't worry! Follow these simple steps to reset your password securely.

## Step-by-Step Instructions

### 1. Access the Reset Page
- Go to the login page
- Click "Forgot Password?" link
- You'll be redirected to the password reset form

### 2. Enter Your Email
- Type your registered email address
- Double-check for typos
- Click "Send Reset Link"

### 3. Check Your Email
- Look for an email from AIBOS
- Check your spam folder if needed
- Click the reset link in the email

### 4. Create New Password
- Enter your new password
- Confirm the new password
- Click "Reset Password"

## Password Requirements

Your new password must meet these security standards:

- **Minimum 8 characters**
- **At least one uppercase letter**
- **At least one lowercase letter**
- **At least one number**
- **At least one special character** (!@#$%^&*)

## Security Tips

✅ **Use a unique password** - Don't reuse passwords from other accounts
✅ **Enable 2FA** - Add an extra layer of security
✅ **Use a password manager** - Generate and store strong passwords
❌ **Don't share passwords** - Keep them private and secure

## Still Having Issues?

If you're still having trouble:

1. **Check your email address** - Make sure it's the one you registered with
2. **Wait a few minutes** - Reset emails may take 5-10 minutes
3. **Contact support** - We're here to help!

## Related Articles

- [Setting Up Two-Factor Authentication](./2fa-setup)
- [Account Security Best Practices](./security-best-practices)
- [Managing Your Profile](./profile-management)`,
      category: "account-security",
      tags: ["password", "security", "reset", "authentication"],
      lastUpdated: new Date("2024-01-10"),
      author: "Security Team",
      readTime: 3,
      helpful: 89,
      notHelpful: 2
    },
    {
      id: "2fa-setup-guide",
      title: "Setting Up Two-Factor Authentication",
      content: `# Two-Factor Authentication Setup 🔒

## What is 2FA?

Two-Factor Authentication (2FA) adds an extra layer of security to your account by requiring a second form of verification in addition to your password.

## Why Enable 2FA?

- **Enhanced Security**: Protects against unauthorized access
- **Account Protection**: Even if your password is compromised
- **Compliance**: Meets enterprise security requirements
- **Peace of Mind**: Know your account is secure

## Setup Methods

### Option 1: Authenticator App (Recommended)

1. **Download an App**
   - Google Authenticator
   - Authy
   - Microsoft Authenticator
   - 1Password

2. **Enable 2FA in AIBOS**
   - Go to Profile → Security tab
   - Click "Enable 2FA"
   - Select "Authenticator App"

3. **Scan QR Code**
   - Open your authenticator app
   - Scan the QR code displayed
   - Enter the 6-digit code

4. **Save Backup Codes**
   - Download or print backup codes
   - Store them securely
   - Use these if you lose your device

### Option 2: SMS (Alternative)

1. **Enter Phone Number**
   - Go to Profile → Security tab
   - Click "Enable 2FA"
   - Select "SMS"
   - Enter your phone number

2. **Verify Phone**
   - Enter the code sent via SMS
   - Confirm your phone number

## Using 2FA

### Daily Login
1. Enter your email and password
2. Enter the 6-digit code from your app
3. Click "Sign In"

### Backup Codes
If you lose your device:
1. Use a backup code to sign in
2. Re-enable 2FA on your new device
3. Generate new backup codes

## Troubleshooting

### Lost Device
1. Use a backup code to sign in
2. Go to Security settings
3. Disable 2FA temporarily
4. Re-enable with new device

### Wrong Time on Device
- Ensure your device time is accurate
- Sync with network time if needed

### App Not Working
- Try a different authenticator app
- Contact support for assistance

## Security Best Practices

✅ **Keep backup codes safe** - Store them securely
✅ **Use authenticator apps** - More secure than SMS
✅ **Don't share codes** - Keep them private
❌ **Don't disable 2FA** - Keep it enabled for security

## Need Help?

Contact our support team if you need assistance with 2FA setup or troubleshooting.`,
      category: "account-security",
      tags: ["2fa", "security", "authentication", "setup"],
      lastUpdated: new Date("2024-01-12"),
      author: "Security Team",
      readTime: 4,
      helpful: 156,
      notHelpful: 1
    },
    {
      id: "profile-management",
      title: "Managing Your Profile",
      content: `# Profile Management Guide 👤

## Your AIBOS Profile

Your profile is your digital identity within AIBOS. Keep it updated to help your team and get the most out of the platform.

## Profile Sections

### Overview Tab
- **Personal Information**: Name, email, job title
- **Contact Details**: Phone, location, timezone
- **Avatar**: Profile picture or avatar selection
- **Bio**: Brief description about yourself

### Skills Tab
- **Technical Skills**: Programming, tools, technologies
- **Soft Skills**: Communication, leadership, teamwork
- **Certifications**: Professional certifications
- **Experience**: Years of experience in different areas

### Activity Tab
- **Recent Activity**: Your recent actions and contributions
- **Achievements**: Badges and accomplishments
- **Timeline**: Historical activity log

## Updating Your Profile

### Edit Personal Information
1. Go to Profile → Overview tab
2. Click "Edit Profile"
3. Update your information
4. Click "Save Changes"

### Change Avatar
1. Click on your current avatar
2. Choose from available options
3. Or upload a custom image
4. Image requirements: Square, under 2MB

### Add Skills
1. Go to Profile → Skills tab
2. Click "Add Skill"
3. Select category and skill
4. Rate your proficiency level
5. Add any certifications

## Privacy Settings

### Profile Visibility
- **Public**: Visible to all team members
- **Team Only**: Visible to your team
- **Private**: Only visible to you and admins

### Contact Information
- Choose what contact info to display
- Control who can see your details
- Manage notification preferences

## Best Practices

✅ **Keep information current** - Update regularly
✅ **Add a professional photo** - Makes you recognizable
✅ **List relevant skills** - Helps with team matching
✅ **Write a clear bio** - Helps others understand your role
❌ **Don't share sensitive info** - Keep personal details private

## Profile Tips

### Professional Photo
- Use a clear, professional headshot
- Good lighting and neutral background
- Dress appropriately for your workplace

### Skill Assessment
- Be honest about your skill levels
- Update skills as you learn new things
- Add certifications and achievements

### Bio Writing
- Keep it concise and professional
- Highlight your key strengths
- Mention your role and interests

## Troubleshooting

### Can't Update Profile
- Check your permissions
- Try refreshing the page
- Contact support if issues persist

### Avatar Not Uploading
- Check file size (under 2MB)
- Ensure it's a supported format
- Try a different image

## Related Articles

- [Account Security Settings](./account-security)
- [Team Collaboration](./team-collaboration)
- [Privacy and Permissions](./privacy-permissions)`,
      category: "profile",
      tags: ["profile", "settings", "avatar", "skills", "bio"],
      lastUpdated: new Date("2024-01-08"),
      author: "User Experience Team",
      readTime: 6,
      helpful: 203,
      notHelpful: 4
    }
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === "" || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsSearching(true);
    
    // Simulate search delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsSearching(false);
  };

  const handleArticleFeedback = (articleId: string, helpful: boolean) => {
    // In a real app, this would send feedback to the backend
    console.log(`Article ${articleId} feedback: ${helpful ? 'helpful' : 'not helpful'}`);
  };

  const formatReadTime = (minutes: number) => {
    return `${minutes} min read`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
        <p className="text-gray-600">Find answers, guides, and tutorials to help you succeed with AIBOS</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-2xl">
          <input
            type="text"
            placeholder="Search knowledge base..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

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
                  <span>📚 All Articles</span>
                  <span className="text-sm text-gray-500">{articles.length}</span>
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
                    <span className="text-sm text-gray-500">{category.articleCount}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles List */}
        <div className="lg:col-span-3">
          {selectedArticle ? (
            /* Article Detail View */
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Article Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="flex items-center text-gray-600 hover:text-gray-800"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Articles
                  </button>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formatReadTime(selectedArticle.readTime)}</span>
                    <span>Updated {formatDate(selectedArticle.lastUpdated)}</span>
                  </div>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedArticle.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>By {selectedArticle.author}</span>
                  <span>•</span>
                  <span>{categories.find(c => c.id === selectedArticle.category)?.name}</span>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-6">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-gray-700 leading-relaxed">
                    {selectedArticle.content}
                  </div>
                </div>

                {/* Article Tags */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">Tags:</span>
                    {selectedArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Article Feedback */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">Was this article helpful?</span>
                      <button
                        onClick={() => handleArticleFeedback(selectedArticle.id, true)}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                      >
                        <span>👍</span>
                        <span>Yes ({selectedArticle.helpful})</span>
                      </button>
                      <button
                        onClick={() => handleArticleFeedback(selectedArticle.id, false)}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                      >
                        <span>👎</span>
                        <span>No ({selectedArticle.notHelpful})</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Articles List View */
            <div className="space-y-4">
              {filteredArticles.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-500">
                    Try adjusting your search terms or browse by category
                  </p>
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <div
                    key={article.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {article.content.substring(0, 150)}...
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatReadTime(article.readTime)}</span>
                          <span>•</span>
                          <span>By {article.author}</span>
                          <span>•</span>
                          <span>Updated {formatDate(article.lastUpdated)}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <span className="text-green-600 text-sm">👍 {article.helpful}</span>
                      </div>
                    </div>
                    
                    {/* Article Tags */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {article.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          +{article.tags.length - 3} more
                        </span>
                      )}
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

export default KnowledgeBase; 