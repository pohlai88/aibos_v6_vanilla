import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ReleaseNote {
  id: number;
  version: string;
  title?: string;
  highlights?: string;
  details?: string;
  released_at: string;
}

const ReleaseNotes: React.FC = () => {
  const [notes, setNotes] = useState<ReleaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("release_notes")
        .select("*")
        .order("released_at", { ascending: false });
      if (error) {
        setError("Failed to load release notes.");
      } else {
        setNotes(data || []);
      }
      setLoading(false);
    };
    fetchNotes();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Release Notes</h1>
      {loading ? (
        <div className="text-gray-500 text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : notes.length === 0 ? (
        <div className="text-gray-500 text-center">No release notes available.</div>
      ) : (
        <div className="space-y-8">
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-blue-700">v{note.version}</span>
                <span className="text-xs text-gray-500">{new Date(note.released_at).toLocaleDateString()}</span>
              </div>
              {note.title && <div className="text-xl font-bold mb-2">{note.title}</div>}
              {note.highlights && <div className="mb-2 text-blue-800">{note.highlights}</div>}
              {note.details && <div className="text-gray-700 whitespace-pre-line">{note.details}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReleaseNotes; 