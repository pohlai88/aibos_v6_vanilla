import React, { useState } from "react";
import UserSkillsSection from "./UserSkillsSection";
import { Switch } from "@headlessui/react";

const UserEnrichmentSection = () => {
  const [fullName, setFullName] = useState("");
  const [savingFullName, setSavingFullName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    twitter: "",
    github: "",
    portfolio: "",
    other: "",
  });
  const [showToast, setShowToast] = useState(false);

  const ADMIN_OPPORTUNITIES = [
    {
      key: "mentorship",
      title: "Mentorship",
      description: "Guide or support a colleague.",
    },
    {
      key: "internal_gigs",
      title: "Internal Gigs",
      description: "Temporary assignments in other teams.",
    },
    {
      key: "project_work",
      title: "Project-based Work",
      description: "Join short-term projects across departments.",
    },
    {
      key: "collaboration",
      title: "Cross-team Collaboration",
      description: "Work with other teams on shared goals.",
    },
    {
      key: "shadowing",
      title: "Shadowing",
      description: "Learn by observing experienced colleagues.",
    },
    {
      key: "training",
      title: "Training",
      description: "Participate in internal training sessions.",
    },
    {
      key: "hackathons",
      title: "Hackathons",
      description: "Join company hackathons and innovation days.",
    },
    {
      key: "innovation",
      title: "Innovation Projects",
      description: "Contribute to new ideas and initiatives.",
    },
    {
      key: "community",
      title: "Community Events",
      description: "Help organize or join company events.",
    },
    {
      key: "knowledge",
      title: "Knowledge Sharing",
      description: "Share expertise with the team.",
    },
  ];
  const MAX_ADMIN_OPPS = 10;
  const MAX_CUSTOM_OPPS = 5;

  const [adminOpportunities, setAdminOpportunities] =
    useState(ADMIN_OPPORTUNITIES);
  const [adminOpportunitiesActive, setAdminOpportunitiesActive] = useState(
    Array(ADMIN_OPPORTUNITIES.length).fill(false)
  );
  const [customOpportunities, setCustomOpportunities] = useState<
    { title: string; active: boolean }[]
  >([]);
  const [newCustomOpportunity, setNewCustomOpportunity] = useState("");
  const [editingCustomIdx, setEditingCustomIdx] = useState<number | null>(null);
  const [editingCustomValue, setEditingCustomValue] = useState("");

  // Mocked interests (could be fetched from backend)
  const AVAILABLE_INTERESTS = [
    "Technology",
    "Design",
    "Music",
    "Sports",
    "Travel",
    "Cooking",
    "Reading",
    "Gaming",
    "Photography",
    "Art",
    "Fitness",
    "Movies",
    "Nature",
    "Science",
    "Business",
    "Education",
    "Health",
    "Fashion",
  ];

  const handleInterestToggle = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [platform]: value }));
  };

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
    // TODO: Save to backend
    console.log("Saving enrichment data:", {
      displayName,
      bio,
      interests,
      socialLinks,
    });
  };

  // Save handler for full name (mocked)
  const handleSaveFullName = () => {
    setSavingFullName(true);
    setTimeout(() => {
      setSavingFullName(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }, 1000);
    // TODO: Save to backend
  };

  const handleAdminToggle = (idx: number) => {
    setAdminOpportunitiesActive((a) => a.map((v, i) => (i === idx ? !v : v)));
  };
  const handleCustomToggle = (idx: number) => {
    setCustomOpportunities((arr) =>
      arr.map((op, i) => (i === idx ? { ...op, active: !op.active } : op))
    );
  };
  const handleAddCustom = () => {
    if (
      newCustomOpportunity.trim() &&
      customOpportunities.length < MAX_CUSTOM_OPPS
    ) {
      setCustomOpportunities([
        ...customOpportunities,
        { title: newCustomOpportunity.trim(), active: false },
      ]);
      setNewCustomOpportunity("");
    }
  };
  const handleRemoveCustom = (idx: number) => {
    setCustomOpportunities((arr) => arr.filter((_, i) => i !== idx));
  };
  const handleEditCustom = (idx: number) => {
    setEditingCustomIdx(idx);
    setEditingCustomValue(customOpportunities[idx].title);
  };
  const handleEditCustomSave = () => {
    if (editingCustomIdx !== null && editingCustomValue.trim()) {
      setCustomOpportunities((arr) =>
        arr.map((op, i) =>
          i === editingCustomIdx
            ? { ...op, title: editingCustomValue.trim() }
            : op
        )
      );
      setEditingCustomIdx(null);
      setEditingCustomValue("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          {/* Full Name Field */}
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                This is your official name (visible to admins/HR)
              </p>
            </div>
            <button
              className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition-colors min-w-[120px]"
              onClick={handleSaveFullName}
              disabled={savingFullName}
            >
              {savingFullName ? "Saving..." : "Save Changes"}
            </button>
          </div>
          {/* Display Name Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Display Name
            </label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="How you'd like to be called"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              This is how your name appears to colleagues (different from your
              official full name)
            </p>
          </div>
          {/* Bio Field */}
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 h-24 resize-none"
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-xl font-semibold mb-4">Interests & Hobbies</h2>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_INTERESTS.map((interest) => (
            <button
              key={interest}
              type="button"
              className={`px-3 py-1 rounded-full border text-sm ${
                interests.includes(interest)
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
              }`}
              onClick={() => handleInterestToggle(interest)}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-xl shadow border p-6">
        <h2 className="text-xl font-semibold mb-4">Social Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">LinkedIn</label>
            <input
              type="url"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="https://linkedin.com/in/yourprofile"
              value={socialLinks.linkedin}
              onChange={(e) =>
                handleSocialLinkChange("linkedin", e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Twitter/X</label>
            <input
              type="url"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="https://twitter.com/yourhandle"
              value={socialLinks.twitter}
              onChange={(e) =>
                handleSocialLinkChange("twitter", e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">GitHub</label>
            <input
              type="url"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="https://github.com/yourusername"
              value={socialLinks.github}
              onChange={(e) => handleSocialLinkChange("github", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Portfolio</label>
            <input
              type="url"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="https://yourportfolio.com"
              value={socialLinks.portfolio}
              onChange={(e) =>
                handleSocialLinkChange("portfolio", e.target.value)
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Other</label>
            <input
              type="url"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Any other professional link"
              value={socialLinks.other}
              onChange={(e) => handleSocialLinkChange("other", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Skills Section */}
      <UserSkillsSection />

      {/* Internal Opportunities Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Admin Opportunities Card */}
        <div className="bg-white rounded-xl shadow border p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span className="text-blue-600">Internal Opportunities</span>
            <span className="text-xs bg-blue-50 text-blue-700 rounded px-2 py-0.5 font-medium">Admin</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">Select which internal opportunities you're open to. These options help your team and managers match you with relevant projects, gigs, or mentoring roles.</p>
          <div className="space-y-3">
            {adminOpportunities.map((op, idx) => (
              <div key={op.key} className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 hover:bg-blue-50 transition">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{op.title}</div>
                  <div className="text-xs text-gray-500">{op.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={adminOpportunitiesActive[idx]}
                    onChange={() => handleAdminToggle(idx)}
                    className={`${adminOpportunitiesActive[idx] ? "bg-blue-600" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                  >
                    <span className="sr-only">Toggle {op.title}</span>
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${adminOpportunitiesActive[idx] ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </Switch>
                  <span className={`text-xs font-semibold ml-1 ${adminOpportunitiesActive[idx] ? "text-blue-600" : "text-gray-400"}`}>{adminOpportunitiesActive[idx] ? "Yes" : "No"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Custom Opportunities Card */}
        <div className="bg-white rounded-xl shadow border p-6 flex flex-col">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <span className="text-green-600">My Open Opportunities</span>
            <span className="text-xs bg-green-50 text-green-700 rounded px-2 py-0.5 font-medium">Custom</span>
          </h2>
          <p className="text-sm text-gray-500 mb-4">Add your own open opportunities or interests. These help others discover how you'd like to contribute or grow within the company.</p>
          <div className="space-y-3">
            {customOpportunities.length === 0 && (
              <div className="text-gray-400 text-sm">No custom opportunities added yet.</div>
            )}
            {customOpportunities.map((op, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg px-3 py-2 bg-gray-50 hover:bg-green-50 transition">
                {editingCustomIdx === idx ? (
                  <>
                    <input
                      type="text"
                      value={editingCustomValue}
                      onChange={e => setEditingCustomValue(e.target.value)}
                      className="border rounded px-2 py-1 text-sm mr-2"
                    />
                    <button className="btn btn-primary btn-sm mr-1" onClick={handleEditCustomSave}>Save</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingCustomIdx(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <div className="font-medium text-gray-900 text-sm">{op.title}</div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={op.active}
                        onChange={() => handleCustomToggle(idx)}
                        className={`${op.active ? "bg-green-600" : "bg-gray-300"} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                      >
                        <span className="sr-only">Toggle {op.title}</span>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${op.active ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </Switch>
                      <span className={`text-xs font-semibold ml-1 ${op.active ? "text-green-600" : "text-gray-400"}`}>{op.active ? "Yes" : "No"}</span>
                      <button className="text-blue-500 hover:text-blue-700 text-xs font-medium" onClick={() => handleEditCustom(idx)}>Edit</button>
                      <button className="text-red-500 hover:text-red-700 text-xs font-medium" onClick={() => handleRemoveCustom(idx)}>Remove</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {/* Add Custom Opportunity */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newCustomOpportunity}
              onChange={e => setNewCustomOpportunity(e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Add a new opportunity..."
              maxLength={40}
            />
            <button
              className="btn btn-primary"
              onClick={handleAddCustom}
              disabled={!newCustomOpportunity.trim() || customOpportunities.length >= MAX_CUSTOM_OPPS}
            >
              Add
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2">Max {MAX_CUSTOM_OPPS} custom opportunities.</div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleSave}
        >
          Save All Changes
        </button>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          Profile updated successfully!
        </div>
      )}
    </div>
  );
};

export default UserEnrichmentSection;
