import React, { useState } from "react";

const MAX_OPPORTUNITIES = 10;
const DEFAULT_OPPORTUNITIES = [
  "Mentorship",
  "Internal Gigs",
  "Project-based Work",
  "Cross-team Collaboration",
  "Shadowing",
  "Training",
  "Hackathons",
  "Innovation Projects",
  "Community Events",
  "Knowledge Sharing",
];

const OpportunitiesManagement = () => {
  const [opportunities, setOpportunities] = useState(DEFAULT_OPPORTUNITIES);
  const [newOpportunity, setNewOpportunity] = useState("");
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
    if (
      newOpportunity.trim() &&
      opportunities.length < MAX_OPPORTUNITIES &&
      !opportunities.includes(newOpportunity.trim())
    ) {
      setOpportunities([...opportunities, newOpportunity.trim()]);
      setNewOpportunity("");
    }
  };
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditValue(opportunities[idx]);
  };
  const handleEditSave = () => {
    if (editValue.trim() && !opportunities.includes(editValue.trim())) {
      setOpportunities(
        opportunities.map((op, i) => (i === editIdx ? editValue.trim() : op))
      );
      setEditIdx(null);
      setEditValue("");
    }
  };
  const handleDelete = (idx: number) => {
    setOpportunities(opportunities.filter((_, i) => i !== idx));
  };
  const handleMove = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= opportunities.length) return;
    const arr = [...opportunities];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setOpportunities(arr);
  };

  return (
    <div className="bg-white rounded-xl shadow border p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">
        Internal Opportunities Management
      </h2>
      <div className="mb-4">
        <input
          type="text"
          className="border rounded px-2 py-1 mr-2"
          placeholder="Add new opportunity..."
          value={newOpportunity}
          onChange={(e) => setNewOpportunity(e.target.value)}
        />
        <button
          className="btn btn-primary px-3 py-1"
          onClick={handleAdd}
          disabled={
            !newOpportunity.trim() ||
            opportunities.length >= MAX_OPPORTUNITIES ||
            opportunities.includes(newOpportunity.trim())
          }
        >
          Add
        </button>
      </div>
      <ul className="divide-y">
        {opportunities.map((op, idx) => (
          <li key={op} className="flex items-center gap-2 py-2">
            {editIdx === idx ? (
              <>
                <input
                  type="text"
                  className="border rounded px-2 py-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                />
                <button
                  className="btn btn-primary px-2 py-1"
                  onClick={handleEditSave}
                >
                  Save
                </button>
                <button
                  className="btn btn-outline px-2 py-1"
                  onClick={() => setEditIdx(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1">{op}</span>
                <button
                  className="btn btn-outline px-2 py-1"
                  onClick={() => handleEdit(idx)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-outline px-2 py-1"
                  onClick={() => handleDelete(idx)}
                >
                  Delete
                </button>
                <button
                  className="btn btn-outline px-2 py-1"
                  onClick={() => handleMove(idx, -1)}
                  disabled={idx === 0}
                >
                  ↑
                </button>
                <button
                  className="btn btn-outline px-2 py-1"
                  onClick={() => handleMove(idx, 1)}
                  disabled={idx === opportunities.length - 1}
                >
                  ↓
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4">
        Max 10 opportunities. These will be shown in the user profile enrichment
        section.
      </p>
    </div>
  );
};

export default OpportunitiesManagement;
