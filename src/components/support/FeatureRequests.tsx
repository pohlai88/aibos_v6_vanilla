import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureRequest {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  status: string;
  upvotes: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-gray-200 text-gray-700",
  planned: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  released: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const FeatureRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [upvoting, setUpvoting] = useState<number | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("feature_requests")
      .select("*")
      .order("upvotes", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setError("Failed to load feature requests.");
    else setRequests(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    await supabase.from("feature_requests").insert({
      user_id: user?.id,
      title: newTitle.trim(),
      description: newDesc.trim(),
    });
    setNewTitle("");
    setNewDesc("");
    setSubmitting(false);
    fetchRequests();
  };

  const handleUpvote = async (id: number) => {
    setUpvoting(id);
    await supabase.rpc("upvote_feature_request", { request_id: id });
    setUpvoting(null);
    fetchRequests();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Feature Requests</h1>
      <form onSubmit={handleSubmit} className="mb-8 space-y-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Briefly describe your feature idea"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Explain your idea in more detail..."
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Feature Request"}
        </button>
      </form>
      {loading ? (
        <div className="text-gray-500 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : requests.length === 0 ? (
        <div className="text-gray-500 text-center">No feature requests yet.</div>
      ) : (
        <div className="space-y-6">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-blue-700">{req.title}</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[req.status] || "bg-gray-100 text-gray-700"}`}>{req.status.replace(/_/g, ' ')}</span>
              </div>
              {req.description && <div className="mb-2 text-gray-700 whitespace-pre-line">{req.description}</div>}
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => handleUpvote(req.id)}
                  disabled={upvoting === req.id}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                >
                  ▲ Upvote {req.upvotes}
                </button>
                <span className="text-xs text-gray-400">Submitted {new Date(req.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeatureRequests; 