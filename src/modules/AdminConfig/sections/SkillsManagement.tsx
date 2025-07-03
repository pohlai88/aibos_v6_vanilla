import React, { useState, useEffect } from "react";

// Mocked initial skills data (replace with API/Supabase integration later)
const INITIAL_SKILLS = [
  {
    id: 1,
    name: "UI/UX Design",
    category: "Technical",
    is_active: true,
    usage: 12,
  },
  {
    id: 2,
    name: "Frontend Development",
    category: "Technical",
    is_active: true,
    usage: 18,
  },
  {
    id: 3,
    name: "Backend Development",
    category: "Technical",
    is_active: true,
    usage: 15,
  },
  {
    id: 4,
    name: "Marketing",
    category: "Business",
    is_active: false,
    usage: 3,
  },
  {
    id: 5,
    name: "Leadership",
    category: "Soft Skill",
    is_active: true,
    usage: 7,
  },
];
const CATEGORIES = ["Technical", "Business", "Creative", "Soft Skill", "Other"];

const SkillsManagement: React.FC = () => {
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [bulkImport, setBulkImport] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [auditLog, setAuditLog] = useState<any[]>([]); // Mocked audit log

  // Filtered and searched skills
  const filteredSkills = skills.filter(
    (skill) =>
      (categoryFilter ? skill.category === categoryFilter : true) &&
      (search ? skill.name.toLowerCase().includes(search.toLowerCase()) : true)
  );

  // Add new skill
  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const newId = Math.max(...skills.map((s) => s.id)) + 1;
    setSkills([
      ...skills,
      {
        id: newId,
        name: newSkill,
        category: newCategory,
        is_active: true,
        usage: 0,
      },
    ]);
    setAuditLog((log) => [
      ...log,
      { action: "add", skill: newSkill, time: new Date() },
    ]);
    setNewSkill("");
  };

  // Bulk import skills
  const handleBulkImport = () => {
    const lines = bulkImport
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const nextId = Math.max(...skills.map((s) => s.id)) + 1;
    const newSkills = lines.map((name, idx) => ({
      id: nextId + idx,
      name,
      category: newCategory,
      is_active: true,
      usage: 0,
    }));
    setSkills([...skills, ...newSkills]);
    setAuditLog((log) => [
      ...log,
      { action: "bulk_import", count: newSkills.length, time: new Date() },
    ]);
    setBulkImport("");
  };

  // Edit skill
  const startEdit = (skill: any) => {
    setEditingId(skill.id);
    setEditName(skill.name);
    setEditCategory(skill.category);
  };
  const saveEdit = (id: number) => {
    setSkills(
      skills.map((s) =>
        s.id === id ? { ...s, name: editName, category: editCategory } : s
      )
    );
    setAuditLog((log) => [
      ...log,
      { action: "edit", skill: editName, time: new Date() },
    ]);
    setEditingId(null);
    setEditName("");
    setEditCategory("");
  };

  // Delete skill
  const handleDelete = (id: number) => {
    if (window.confirm("Delete this skill?")) {
      setSkills(skills.filter((s) => s.id !== id));
      setAuditLog((log) => [
        ...log,
        { action: "delete", skillId: id, time: new Date() },
      ]);
    }
  };

  // Toggle active
  const handleToggleActive = (id: number) => {
    setSkills(
      skills.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    );
    setAuditLog((log) => [
      ...log,
      { action: "toggle_active", skillId: id, time: new Date() },
    ]);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow border max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Skills Management</h2>
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-3 py-2 flex-1"
          placeholder="Search skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="border rounded px-3 py-2 flex-1"
          placeholder="Add new skill"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
        />
        <select
          className="border rounded px-2"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={handleAddSkill}>
          Add
        </button>
      </div>
      <div className="mb-4">
        <textarea
          className="border rounded px-3 py-2 w-full"
          rows={2}
          placeholder="Bulk import skills (one per line)"
          value={bulkImport}
          onChange={(e) => setBulkImport(e.target.value)}
        />
        <button className="btn btn-outline mt-2" onClick={handleBulkImport}>
          Bulk Import
        </button>
      </div>
      <table className="w-full text-left border mb-4">
        <thead>
          <tr>
            <th className="py-2 px-2">Skill</th>
            <th className="py-2 px-2">Category</th>
            <th className="py-2 px-2">Active</th>
            <th className="py-2 px-2">Usage</th>
            <th className="py-2 px-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSkills.map((skill) => (
            <tr key={skill.id} className={skill.is_active ? "" : "opacity-50"}>
              <td className="py-2 px-2">
                {editingId === skill.id ? (
                  <input
                    className="border rounded px-2 py-1"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                ) : (
                  skill.name
                )}
              </td>
              <td className="py-2 px-2">
                {editingId === skill.id ? (
                  <select
                    className="border rounded px-2"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  skill.category
                )}
              </td>
              <td className="py-2 px-2">
                <input
                  type="checkbox"
                  checked={skill.is_active}
                  onChange={() => handleToggleActive(skill.id)}
                />
              </td>
              <td className="py-2 px-2 text-center">{skill.usage}</td>
              <td className="py-2 px-2">
                {editingId === skill.id ? (
                  <>
                    <button
                      className="btn btn-primary btn-xs mr-2"
                      onClick={() => saveEdit(skill.id)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-outline btn-xs"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-outline btn-xs mr-2"
                      onClick={() => startEdit(skill)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline btn-xs"
                      onClick={() => handleDelete(skill.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {filteredSkills.length === 0 && (
            <tr>
              <td colSpan={5} className="text-center py-4 text-gray-400">
                No skills found. Add your first skill!
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Audit Log (mocked)</h3>
        <ul className="text-xs text-gray-500 max-h-32 overflow-y-auto">
          {auditLog
            .slice(-10)
            .reverse()
            .map((log, idx) => (
              <li key={idx}>
                [{log.time.toLocaleString()}] {log.action}{" "}
                {log.skill || log.skillId || log.count || ""}
              </li>
            ))}
          {auditLog.length === 0 && <li>No actions yet.</li>}
        </ul>
      </div>
    </div>
  );
};

export default SkillsManagement;
