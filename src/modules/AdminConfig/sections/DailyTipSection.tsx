import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const DAILY_TIP_KEY = "global_daily_tip";

const DailyTipSection: React.FC = () => {
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchTip();
  }, []);

  const fetchTip = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    // Assume a 'settings' table with key/value
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", DAILY_TIP_KEY)
      .single();
    if (error) {
      setError("Could not load daily tip.");
    } else {
      setTip(data?.value || "");
    }
    setLoading(false);
  };

  const saveTip = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    // Upsert the tip
    const { error } = await supabase
      .from("settings")
      .upsert({ key: DAILY_TIP_KEY, value: tip }, { onConflict: "key" });
    if (error) {
      setError("Could not save daily tip.");
    } else {
      setSuccess(true);
    }
    setSaving(false);
  };

  return (
    <section className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-2">Daily Tip / Quote</h2>
      <p className="text-gray-500 mb-4">
        Set the inspirational message that will appear globally in the user
        dropdown.
      </p>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <>
          <textarea
            className="w-full border border-gray-200 rounded-lg p-3 text-gray-800 font-ui mb-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            rows={2}
            value={tip}
            onChange={(e) => setTip(e.target.value)}
            placeholder="Enter daily tip or quote..."
            disabled={saving}
          />
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              onClick={saveTip}
              disabled={saving || tip.trim() === ""}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {success && <span className="text-green-600 text-sm">Saved!</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </>
      )}
    </section>
  );
};

export default DailyTipSection;
