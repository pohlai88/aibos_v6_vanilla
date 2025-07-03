import React, { useState } from "react";
import { Switch } from "@headlessui/react";

// Mocked skills list (replace with API/Supabase fetch)
const SKILLS = [
  "UI/UX Design",
  "Frontend Development",
  "Backend Development",
  "Project Management",
  "Marketing",
  "Sales",
  "Data Analysis",
  "Copywriting",
  "Customer Support",
  "Event Promotion",
  "QA/Testing",
  "DevOps",
  "Cloud Computing",
  "AI/ML",
  "Cybersecurity",
  "Product Management",
  "Business Analysis",
  "Content Creation",
  "Social Media Management",
  "Finance/Accounting",
  "HR/Recruitment",
  "Operations",
  "Leadership",
  "Communication",
  "Problem Solving",
  "Creativity",
  "Other",
];
const PROFICIENCY = ["Beginner", "Intermediate", "Expert"];

const MultiSelectWithOther = ({
  label,
  value,
  onChange,
  proficiency,
  onProficiencyChange,
  privacy,
  onPrivacyChange,
  suggestions,
}) => {
  const [customSkill, setCustomSkill] = useState("");

  const handleSelect = (skill) => {
    if (value.includes(skill)) {
      onChange(value.filter((s) => s !== skill));
      if (onProficiencyChange) onProficiencyChange(skill, undefined);
      if (onPrivacyChange) onPrivacyChange(skill, undefined);
    } else {
      onChange([...value, skill]);
      if (onProficiencyChange) onProficiencyChange(skill, "Beginner");
      if (onPrivacyChange) onPrivacyChange(skill, true);
    }
  };

  const handleCustomSkill = (e) => {
    setCustomSkill(e.target.value);
    if (e.target.value && !value.includes(e.target.value)) {
      onChange([...value.filter((s) => s !== "Other"), e.target.value]);
      if (onProficiencyChange) onProficiencyChange(e.target.value, "Beginner");
      if (onPrivacyChange) onPrivacyChange(e.target.value, true);
    }
  };

  const handleRemove = (skill) => {
    onChange(value.filter((s) => s !== skill));
    if (onProficiencyChange) onProficiencyChange(skill, undefined);
    if (onPrivacyChange) onPrivacyChange(skill, undefined);
  };

  return (
    <div>
      <label className="block font-ui text-xl font-semibold mb-1">
        {label}
      </label>
      {suggestions && suggestions.length > 0 && (
        <div className="mb-2 text-xs text-blue-600 font-ui">
          Suggestions: {suggestions.join(", ")}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-2">
        {SKILLS.map((skill) => (
          <button
            key={skill}
            type="button"
            className={`px-3 py-1 rounded-full border font-ui text-sm transition-colors ${
              value.includes(skill)
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-blue-50"
            }`}
            onClick={() => handleSelect(skill)}
          >
            {skill}
          </button>
        ))}
      </div>
      {value.includes("Other") && (
        <input
          type="text"
          className="mt-2 border rounded px-2 py-1 font-ui text-sm"
          placeholder="Enter custom skill"
          value={customSkill}
          onChange={handleCustomSkill}
        />
      )}
      {/* Selected skills summary, aligned grid */}
      {value.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-2">
          {value.map((skill) => (
            <div
              key={skill}
              className="grid grid-cols-4 items-center bg-gray-50 rounded-lg px-3 py-2 group relative gap-2"
              style={{
                gridTemplateColumns:
                  "minmax(0,1.5fr) minmax(120px,0.8fr) minmax(90px,0.7fr) minmax(90px,0.7fr)",
              }}
            >
              {/* Remove button + Skill name */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-lg font-bold transition"
                  title={`Remove ${skill}`}
                  onClick={() => handleRemove(skill)}
                  tabIndex={0}
                  aria-label={`Remove ${skill}`}
                >
                  ×
                </button>
                <span className="font-ui font-semibold text-sm truncate">
                  {skill}
                </span>
              </div>
              {/* Proficiency dropdown */}
              {onProficiencyChange && (
                <select
                  className="border rounded px-2 py-1 text-xs font-ui bg-white w-full min-w-[100px]"
                  value={proficiency[skill] || "Beginner"}
                  onChange={(e) => onProficiencyChange(skill, e.target.value)}
                >
                  {PROFICIENCY.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              )}
              {/* Show to team label */}
              <span className="text-xs font-ui text-gray-500 text-center">
                Show to team
              </span>
              {/* Yes/No Switch + Yes/No text */}
              {onPrivacyChange && (
                <div className="flex items-center gap-2 justify-center">
                  <Switch
                    checked={privacy[skill] !== false}
                    onChange={(v) => onPrivacyChange(skill, v)}
                    className={`relative inline-flex h-6 w-12 items-center rounded-full border-2 border-gray-300 transition-colors focus:outline-none shadow-sm ${
                      privacy[skill] !== false
                        ? "bg-green-600 border-green-700"
                        : "bg-gray-300"
                    }`}
                  >
                    <span className="sr-only">Show {skill} to team</span>
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        privacy[skill] !== false
                          ? "translate-x-6"
                          : "translate-x-0"
                      }`}
                    />
                  </Switch>
                  <span
                    className={`text-xs font-ui ml-1 ${
                      privacy[skill] !== false
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {privacy[skill] !== false ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserSkillsSection = () => {
  const [skillsImprove, setSkillsImprove] = useState([]);
  const [skillsOffer, setSkillsOffer] = useState([]);
  const [proficiencyImprove, setProficiencyImprove] = useState({});
  const [proficiencyOffer, setProficiencyOffer] = useState({});
  const [privacyImprove, setPrivacyImprove] = useState({});
  const [privacyOffer, setPrivacyOffer] = useState({});
  const [showToast, setShowToast] = useState(false);

  // Mocked suggestions (could be based on department/role)
  const suggestionsImprove = ["AI/ML", "Cloud Computing"];
  const suggestionsOffer = ["Frontend Development", "QA/Testing"];

  // Handlers for proficiency and privacy
  const handleProficiencyImprove = (skill, level) => {
    setProficiencyImprove((prev) => ({ ...prev, [skill]: level }));
  };
  const handleProficiencyOffer = (skill, level) => {
    setProficiencyOffer((prev) => ({ ...prev, [skill]: level }));
  };
  const handlePrivacyImprove = (skill, show) => {
    setPrivacyImprove((prev) => ({ ...prev, [skill]: show }));
  };
  const handlePrivacyOffer = (skill, show) => {
    setPrivacyOffer((prev) => ({ ...prev, [skill]: show }));
  };

  // Save handler (mocked)
  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
    // TODO: Save to backend
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: My Strengths */}
      <div className="bg-white rounded-xl shadow p-6">
        <MultiSelectWithOther
          label="My Strengths"
          value={skillsOffer}
          onChange={setSkillsOffer}
          proficiency={proficiencyOffer}
          onProficiencyChange={handleProficiencyOffer}
          privacy={privacyOffer}
          onPrivacyChange={handlePrivacyOffer}
          suggestions={suggestionsOffer}
        />
      </div>
      {/* Right: Skills to Improve */}
      <div className="bg-white rounded-xl shadow p-6">
        <MultiSelectWithOther
          label="Skills to Improve"
          value={skillsImprove}
          onChange={setSkillsImprove}
          proficiency={proficiencyImprove}
          onProficiencyChange={handleProficiencyImprove}
          privacy={privacyImprove}
          onPrivacyChange={handlePrivacyImprove}
          suggestions={suggestionsImprove}
        />
      </div>
      {/* Save Button below both boxes */}
      <div className="col-span-1 md:col-span-2 flex justify-end mt-4 relative">
        <button className="btn btn-primary" onClick={handleSave}>
          Save Changes
        </button>
        {showToast && (
          <div className="absolute right-0 bottom-12 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in z-10">
            Skills updated!
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSkillsSection;
