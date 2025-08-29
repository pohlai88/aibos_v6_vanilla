import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface SecurityPolicy {
  key: string;
  value: string;
}
interface SecurityEvent {
  id: number;
  user_id: string;
  department: string;
  event_type: string;
  event_details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface SecurityTabProps {
  department?: string; // e.g. 'global', 'hr', etc.
  isAdmin?: boolean;
}

const SecurityTab: React.FC<SecurityTabProps> = ({ department = "global", isAdmin = false }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [policyDraft, setPolicyDraft] = useState<Record<string, string>>({});

  // Fetch security policies
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("security_config")
      .select("policy_key, policy_value")
      .eq("department", department);
    if (error) {
      setError("Failed to load security policies.");
      setLoading(false);
      return;
    }
    setPolicies((data || []).map((item: any) => ({
      key: item.policy_key,
      value: item.policy_value
    })));
    setPolicyDraft(Object.fromEntries((data || []).map((p: any) => [p.policy_key, p.policy_value])));
    setLoading(false);
  }, [department]);

  // Fetch security events
  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from("security_events")
      .select("*")
      .eq("department", department)
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error) setEvents(data || []);
  }, [department]);

  useEffect(() => {
    fetchPolicies();
    fetchEvents();
  }, [fetchPolicies, fetchEvents]);

  // Handle policy edit
  const handlePolicyChange = (key: string, value: string) => {
    setPolicyDraft((prev) => ({ ...prev, [key]: value }));
  };
  const handleSavePolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      for (const key of Object.keys(policyDraft)) {
        await supabase.from("security_config").upsert({
          department: department,
          policy_key: key,
          policy_value: policyDraft[key],
          updated_by: user?.id || "",
        }, { onConflict: "department,policy_key" });
      }
      setEditMode(false);
      fetchPolicies();
    } catch (e) {
      setError("Failed to save policies.");
    }
    setLoading(false);
  };

  // Policy keys to display (can be extended)
  const policyLabels: Record<string, string> = {
    "2fa_enabled": "Two-Factor Authentication",
    "min_password_length": "Minimum Password Length",
    "require_uppercase": "Require Uppercase",
    "require_lowercase": "Require Lowercase",
    "require_numbers": "Require Numbers",
    "require_special": "Require Special Characters",
    "password_expiry_days": "Password Expiry (days)",
    "session_timeout": "Session Timeout (min)",
    "max_login_attempts": "Max Login Attempts",
    "lockout_duration": "Lockout Duration (min)",
  };

  return (
    <div className="space-y-8">
      {/* Security Status & Policy */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Security Policies ({department})
        </h2>
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="space-y-4">
            {Object.keys(policyLabels).map((key) => (
              <div key={key} className="flex items-center gap-4">
                <div className="w-64 font-medium text-gray-900">{policyLabels[key]}</div>
                {editMode && isAdmin ? (
                  <input
                    type="text"
                    value={policyDraft[key] || ""}
                    onChange={e => handlePolicyChange(key, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded w-48"
                  />
                ) : (
                  <div className="text-gray-700">{policyDraft[key] ?? <span className="text-gray-400">Not set</span>}</div>
                )}
              </div>
            ))}
            {isAdmin && (
              <div className="flex gap-2 mt-4">
                {editMode ? (
                  <>
                    <button onClick={handleSavePolicies} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                    <button onClick={() => { setEditMode(false); fetchPolicies(); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setEditMode(true)} className="px-4 py-2 bg-blue-600 text-white rounded">Edit Policies</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Security Events */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Security Events
        </h2>
        {events.length === 0 ? (
          <div className="text-gray-500">No recent events.</div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <div>
                    <div className="font-medium text-gray-900">{ev.event_type.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-500">{new Date(ev.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">{ev.ip_address || "-"} • {ev.user_agent?.split(" ")[0] || "-"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityTab;
