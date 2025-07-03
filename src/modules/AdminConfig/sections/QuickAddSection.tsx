import React, { useState } from "react";
import { useQuickAddActions } from "@/contexts/QuickAddContext";

const QuickAddSection: React.FC = () => {
  const { actions, setActions } = useQuickAddActions();
  const [newLabel, setNewLabel] = useState("");
  const [newIcon, setNewIcon] = useState("");

  const addAction = () => {
    if (!newLabel.trim() || !newIcon.trim()) return;
    setActions([
      ...actions,
      {
        id: Date.now().toString(),
        label: newLabel,
        icon: newIcon,
        enabled: true,
      },
    ]);
    setNewLabel("");
    setNewIcon("");
  };

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  const toggleAction = (id: string) => {
    setActions(
      actions.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  // Simple drag-and-drop reorder (not persistent)
  const moveAction = (from: number, to: number) => {
    if (to < 0 || to >= actions.length) return;
    const updated = [...actions];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setActions(updated);
  };

  return (
    <section className="bg-white rounded-xl shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-2">Quick Add Actions</h2>
      <p className="text-gray-500 mb-4">
        Configure which actions appear in the Quick Add menu. (Automation/wiring
        to Supabase will be added during admin panel optimization.)
      </p>
      <ul className="mb-4">
        {actions.map((a, i) => (
          <li
            key={a.id}
            className="flex items-center gap-3 py-2 border-b last:border-b-0"
          >
            <span className="text-lg cursor-move" title="Drag to reorder">
              <button
                onClick={() => moveAction(i, i - 1)}
                disabled={i === 0}
                className="px-1"
              >
                ↑
              </button>
              <button
                onClick={() => moveAction(i, i + 1)}
                disabled={i === actions.length - 1}
                className="px-1"
              >
                ↓
              </button>
            </span>
            <span className="text-xl">{a.icon}</span>
            <span className="flex-1 text-[15px]">{a.label}</span>
            <label className="flex items-center gap-1 text-xs">
              <input
                type="checkbox"
                checked={a.enabled}
                onChange={() => toggleAction(a.id)}
              />{" "}
              Enabled
            </label>
            <button
              onClick={() => removeAction(a.id)}
              className="text-red-500 text-xs ml-2"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <input
          className="border rounded px-2 py-1 text-sm font-ui"
          placeholder="Label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1 text-sm font-ui w-16"
          placeholder="Icon"
          value={newIcon}
          onChange={(e) => setNewIcon(e.target.value)}
        />
        <button
          onClick={addAction}
          className="px-3 py-1 bg-blue-600 text-white rounded font-semibold text-sm"
        >
          Add
        </button>
      </div>
    </section>
  );
};

export default QuickAddSection;
