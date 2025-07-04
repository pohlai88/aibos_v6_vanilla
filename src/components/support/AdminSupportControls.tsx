import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface FeatureRequest {
  id: number;
  user_id: string;
  title: string;
  description: string;
  status: string;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

interface ReleaseNote {
  id: number;
  version: string;
  title: string;
  highlights: string;
  details: string;
  released_at: string;
}

interface AdminSupportControlsProps {
  onNavigate?: (section: string) => void;
}

const AdminSupportControls: React.FC<AdminSupportControlsProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("feature-requests");
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feature Request Management
  const [editingRequest, setEditingRequest] = useState<FeatureRequest | null>(null);
  const [newRequest, setNewRequest] = useState({ title: "", description: "", status: "pending" });

  // Release Note Management
  const [editingNote, setEditingNote] = useState<ReleaseNote | null>(null);
  const [newNote, setNewNote] = useState({ version: "", title: "", highlights: "", details: "" });

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeSection === "feature-requests") {
        const { data, error } = await supabase
          .from("feature_requests")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        setFeatureRequests(data || []);
      } else if (activeSection === "release-notes") {
        const { data, error } = await supabase
          .from("release_notes")
          .select("*")
          .order("released_at", { ascending: false });
        
        if (error) throw error;
        setReleaseNotes(data || []);
      }
    } catch (err) {
      setError("Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeatureRequest = async (id: number, status: string) => {
    try {
      const { error } = await supabase
        .from("feature_requests")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      setError("Failed to update feature request");
      console.error("Error updating feature request:", err);
    }
  };

  const handleCreateReleaseNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("release_notes")
        .insert([newNote]);

      if (error) throw error;
      
      setNewNote({ version: "", title: "", highlights: "", details: "" });
      fetchData();
    } catch (err) {
      setError("Failed to create release note");
      console.error("Error creating release note:", err);
    }
  };

  const handleUpdateReleaseNote = async (id: number, updates: Partial<ReleaseNote>) => {
    try {
      const { error } = await supabase
        .from("release_notes")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      setEditingNote(null);
      fetchData();
    } catch (err) {
      setError("Failed to update release note");
      console.error("Error updating release note:", err);
    }
  };

  const handleDeleteReleaseNote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this release note?")) return;
    
    try {
      const { error } = await supabase
        .from("release_notes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchData();
    } catch (err) {
      setError("Failed to delete release note");
      console.error("Error deleting release note:", err);
    }
  };

  const sections = [
    {
      id: "feature-requests",
      title: "Feature Requests",
      icon: "💡",
      description: "Manage user feature requests and status"
    },
    {
      id: "release-notes",
      title: "Release Notes",
      icon: "📋",
      description: "Create and manage release notes"
    },
    {
      id: "analytics",
      title: "Analytics",
      icon: "📊",
      description: "Support system performance insights"
    },
    {
      id: "settings",
      title: "Settings",
      icon: "⚙️",
      description: "Support system configuration"
    }
  ];

  const statusColors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-700",
    planned: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    released: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const renderSection = () => {
    switch (activeSection) {
      case "feature-requests":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Feature Request Management</h2>
              <div className="text-sm text-gray-600">
                {featureRequests.length} total requests
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-red-600 text-center py-8">{error}</div>
            ) : (
              <div className="space-y-4">
                {featureRequests.map((request) => (
                  <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{request.title}</h3>
                        {request.description && (
                          <p className="text-gray-600 mb-3">{request.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Submitted: {new Date(request.created_at).toLocaleDateString()}</span>
                          <span>Upvotes: {request.upvotes}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={request.status}
                          onChange={(e) => handleUpdateFeatureRequest(request.id, e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="released">Released</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[request.status]}`}>
                          {request.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "release-notes":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Release Notes Management</h2>
              <button
                onClick={() => setEditingNote({} as ReleaseNote)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create New Release
              </button>
            </div>

            {/* Create/Edit Release Note Form */}
            {editingNote && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingNote.id ? "Edit Release Note" : "Create New Release Note"}
                </h3>
                <form onSubmit={handleCreateReleaseNote} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Version</label>
                      <input
                        type="text"
                        value={editingNote.version}
                        onChange={(e) => setEditingNote({ ...editingNote, version: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., 1.2.0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        type="text"
                        value={editingNote.title || ""}
                        onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Release title"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                    <input
                      type="text"
                      value={editingNote.highlights || ""}
                      onChange={(e) => setEditingNote({ ...editingNote, highlights: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Key highlights of this release"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                    <textarea
                      value={editingNote.details || ""}
                      onChange={(e) => setEditingNote({ ...editingNote, details: e.target.value })}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Detailed release notes..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingNote.id ? "Update Release" : "Create Release"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingNote(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Release Notes List */}
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : error ? (
              <div className="text-red-600 text-center py-8">{error}</div>
            ) : (
              <div className="space-y-4">
                {releaseNotes.map((note) => (
                  <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg font-semibold text-blue-700">v{note.version}</span>
                          {note.title && <span className="text-lg font-semibold text-gray-900">{note.title}</span>}
                        </div>
                        {note.highlights && (
                          <p className="text-blue-800 mb-2">{note.highlights}</p>
                        )}
                        {note.details && (
                          <p className="text-gray-700 whitespace-pre-line">{note.details}</p>
                        )}
                        <div className="text-sm text-gray-500 mt-3">
                          Released: {new Date(note.released_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingNote(note)}
                          className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReleaseNote(note.id)}
                          className="px-3 py-1 text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Support Analytics Dashboard</h2>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Total Feature Requests</h3>
                  <span className="text-blue-600">💡</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{featureRequests.length}</div>
                <div className="text-sm text-gray-600">User suggestions</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Pending Requests</h3>
                  <span className="text-yellow-600">⏳</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {featureRequests.filter(r => r.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">Awaiting review</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Released Features</h3>
                  <span className="text-green-600">✅</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {featureRequests.filter(r => r.status === 'released').length}
                </div>
                <div className="text-sm text-gray-600">Implemented</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Total Releases</h3>
                  <span className="text-purple-600">📋</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{releaseNotes.length}</div>
                <div className="text-sm text-gray-600">Version updates</div>
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Request Status Distribution</h3>
              <div className="space-y-3">
                {Object.entries(statusColors).map(([status, colorClass]) => {
                  const count = featureRequests.filter(r => r.status === status).length;
                  const percentage = featureRequests.length > 0 ? (count / featureRequests.length) * 100 : 0;
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${colorClass}`}>
                          {status.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Feature Requests */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Feature Requests by Upvotes</h3>
              <div className="space-y-3">
                {featureRequests
                  .sort((a, b) => b.upvotes - a.upvotes)
                  .slice(0, 5)
                  .map((request, index) => (
                    <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{request.title}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{request.upvotes} upvotes</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[request.status]}`}>
                          {request.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Support System Settings</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Agent Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Response Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    defaultValue={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-escalation Threshold
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="2">2 failed AI responses</option>
                    <option value="3">3 failed AI responses</option>
                    <option value="5">5 failed AI responses</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="proactive-help" defaultChecked />
                  <label htmlFor="proactive-help" className="text-sm font-medium text-gray-700">
                    Enable proactive help suggestions
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="new-requests" defaultChecked />
                  <label htmlFor="new-requests" className="text-sm font-medium text-gray-700">
                    Notify on new feature requests
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="high-upvotes" defaultChecked />
                  <label htmlFor="high-upvotes" className="text-sm font-medium text-gray-700">
                    Notify when requests reach 10+ upvotes
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="ai-feedback" defaultChecked />
                  <label htmlFor="ai-feedback" className="text-sm font-medium text-gray-700">
                    Notify on negative AI feedback
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">System Maintenance</h3>
              <div className="space-y-4">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Export Support Data
                </button>
                <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                  Clear Old Analytics
                </button>
                <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
                  Reset Support System
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {renderSection()}
      </div>
    </div>
  );
};

export default AdminSupportControls; 