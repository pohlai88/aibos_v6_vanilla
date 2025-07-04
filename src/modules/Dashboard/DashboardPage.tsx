import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSampleData } from '../../lib/sampleData';

// Types for our personalized dashboard
interface MoodState {
  mood: 'happy' | 'neutral' | 'stressed';
  timestamp: string;
}

interface LifeNote {
  id: string;
  content: string;
  created_at: string;
}

interface WorkTask {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface MessyDrawerItem {
  id: string;
  type: 'note' | 'link';
  content: string;
  url?: string;
  created_at: string;
}

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [mood, setMood] = useState<MoodState | null>(null);
  const [lifeNotes, setLifeNotes] = useState<LifeNote[]>([]);
  const [workTasks, setWorkTasks] = useState<WorkTask[]>([]);
  const [messyDrawer, setMessyDrawer] = useState<MessyDrawerItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([
    {
      id: 'zen-master',
      title: 'Zen Master',
      description: 'Finished tasks without interruption',
      icon: '🧘',
      unlocked: false
    },
    {
      id: 'chaos-wrangler',
      title: 'Chaos Wrangler',
      description: 'Managed high task volume',
      icon: '🤠',
      unlocked: false
    },
    {
      id: 'focus-champion',
      title: 'Focus Champion',
      description: 'Multi-day focus streak',
      icon: '🏆',
      unlocked: false
    }
  ]);
  const [showLifeWorkPanel, setShowLifeWorkPanel] = useState(true);
  const [newLifeNote, setNewLifeNote] = useState('');
  const [newDrawerItem, setNewDrawerItem] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Sample data
  const supportMetrics = getSampleData.supportMetrics();

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500);
    
    // Load user's mood from localStorage
    const savedMood = localStorage.getItem('aibos-mood');
    if (savedMood) {
      setMood(JSON.parse(savedMood));
    }
  }, []);

  const handleMoodSelect = (selectedMood: 'happy' | 'neutral' | 'stressed') => {
    const newMood: MoodState = {
      mood: selectedMood,
      timestamp: new Date().toISOString()
    };
    setMood(newMood);
    localStorage.setItem('aibos-mood', JSON.stringify(newMood));
  };

  const addLifeNote = () => {
    if (newLifeNote.trim()) {
      const note: LifeNote = {
        id: Date.now().toString(),
        content: newLifeNote,
        created_at: new Date().toISOString()
      };
      setLifeNotes([note, ...lifeNotes]);
      setNewLifeNote('');
    }
  };

  const addDrawerItem = () => {
    if (newDrawerItem.trim()) {
      const item: MessyDrawerItem = {
        id: Date.now().toString(),
        type: 'note',
        content: newDrawerItem,
        created_at: new Date().toISOString()
      };
      setMessyDrawer([item, ...messyDrawer]);
      setNewDrawerItem('');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (mood?.mood === 'happy') {
      return `${timeGreeting}, ${user?.email?.split('@')[0] || 'there'}! 🌟 You're doing great today!`;
    } else if (mood?.mood === 'stressed') {
      return `${timeGreeting}, ${user?.email?.split('@')[0] || 'there'}! 💪 You've got this - let's tackle today together.`;
    } else {
      return `${timeGreeting}, ${user?.email?.split('@')[0] || 'there'}! ✨ Ready to make today amazing?`;
    }
  };

  const getMoodMessage = () => {
    if (mood?.mood === 'happy') return "You're radiating positivity today!";
    if (mood?.mood === 'stressed') return "Remember: it's okay to take breaks. You're doing great!";
    return "How about we make today a good one?";
  };

  const getBackgroundGradient = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'from-blue-50 to-purple-50';
    if (hour < 17) return 'from-orange-50 to-yellow-50';
    return 'from-indigo-50 to-purple-50';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Tidying up your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getBackgroundGradient()} transition-all duration-1000`}>
      {/* Floating background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-green-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {getGreeting()}
          </h1>
          <p className="text-gray-600 italic text-lg mb-4 animate-fade-in">
            Life is messy, but work doesn't have to.
          </p>
          {mood && (
            <p className="text-gray-500 text-sm">
              {getMoodMessage()}
            </p>
          )}
        </div>

        {/* Mood Check-In */}
        {!mood && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Life's messy. How are you feeling today?
            </h3>
            <div className="flex justify-center space-x-6">
              {[
                { mood: 'happy' as const, icon: '😊', label: 'Great!' },
                { mood: 'neutral' as const, icon: '😐', label: 'Okay' },
                { mood: 'stressed' as const, icon: '😫', label: 'Stressed' }
              ].map(({ mood: moodType, icon, label }) => (
                <button
                  key={moodType}
                  onClick={() => handleMoodSelect(moodType)}
                  className="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="text-3xl">{icon}</span>
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Life & Work Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">
                  Life & Work Balance
                </h2>
                <button
                  onClick={() => setShowLifeWorkPanel(!showLifeWorkPanel)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {showLifeWorkPanel ? '📉' : '📈'}
                </button>
              </div>

              {showLifeWorkPanel ? (
                <div className="space-y-6">
                  {/* Life Notes */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">
                      Life Notes 📝
                    </h3>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newLifeNote}
                          onChange={(e) => setNewLifeNote(e.target.value)}
                          placeholder="What's on your mind?"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onKeyPress={(e) => e.key === 'Enter' && addLifeNote()}
                        />
                        <button
                          onClick={addLifeNote}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      {lifeNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-gray-50 rounded-lg text-gray-700"
                        >
                          {note.content}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work Tasks */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">
                      Work Tasks 💼
                    </h3>
                    <div className="space-y-2">
                      {workTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => {
                              setWorkTasks(workTasks.map(t =>
                                t.id === task.id ? { ...t, completed: !t.completed } : t
                              ));
                            }}
                            className="rounded"
                          />
                          <span className={`flex-1 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-100 text-red-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Analytics View
                  </h3>
                  <p className="text-gray-500">
                    Your productivity insights will appear here
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Messy Drawer */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Messy Drawer 🗄️
              </h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDrawerItem}
                    onChange={(e) => setNewDrawerItem(e.target.value)}
                    placeholder="Quick note or link..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && addDrawerItem()}
                  />
                  <button
                    onClick={addDrawerItem}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    +
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {messyDrawer.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700"
                    >
                      {item.type === 'link' ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {item.content}
                        </a>
                      ) : (
                        item.content
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Metrics */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Support System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {supportMetrics.totalFeatureRequests}
              </div>
              <div className="text-sm text-gray-600">Feature Requests</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {supportMetrics.totalKnowledgeBaseArticles}
              </div>
              <div className="text-sm text-gray-600">Knowledge Articles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {supportMetrics.aiAgentConversations}
              </div>
              <div className="text-sm text-gray-600">AI Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {supportMetrics.userSatisfactionScore}
              </div>
              <div className="text-sm text-gray-600">Satisfaction Score</div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Your Achievements 🏆
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-4 rounded-xl border-2 ${
                  badge.unlocked
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-2">{badge.icon}</div>
                <h3 className="font-medium text-gray-800 mb-1">{badge.title}</h3>
                <p className="text-sm text-gray-600">{badge.description}</p>
                {badge.unlocked && (
                  <div className="text-xs text-green-600 mt-2">
                    Unlocked {badge.unlocked_at}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 