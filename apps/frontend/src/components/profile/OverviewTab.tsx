import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import girlAvatar from "../icons/Avatars.png";
import boyAvatar from "../icons/Avatars (1).png";
import ViewOnlyEye from "../ui/ViewOnlyEye";
import Modal from "../ui/Modal";
import UserEnrichmentSection from "./UserEnrichmentSection";

const DEFAULT_AVATAR = girlAvatar;
const DEFAULT_AVATAR_KEY = "lady";

const OverviewTab: React.FC = () => {
  const { user, userProfile, profileLoading, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<
    "lady" | "man" | "custom"
  >("lady");
  const [fullName, setFullName] = useState("");
  const [customAvatar, setCustomAvatar] = useState<string | null>(null); // preview URL
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAvatarKey, setPendingAvatarKey] = useState<
    "lady" | "man" | null
  >(null);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // TODO: Replace with real admin check
  const isAdmin = user?.role === "admin";

  const avatarList = [
    { key: "lady", src: girlAvatar, alt: "Lady Avatar" },
    { key: "man", src: boyAvatar, alt: "Man Avatar" },
  ];

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        setFullName(userProfile?.full_name || "");
        if (userProfile?.avatar_url) {
          if (userProfile.avatar_url.includes("Avatars.png")) {
            setSelectedAvatar("lady");
          } else if (userProfile.avatar_url.includes("Avatars (1).png")) {
            setSelectedAvatar("man");
          } else {
            setSelectedAvatar("custom");
            setCustomAvatar(userProfile.avatar_url);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user, userProfile]);

  // Get current avatar type for selection state
  const getCurrentAvatarType = () => {
    if (
      userProfile?.avatar_url &&
      !userProfile.avatar_url.includes("Avatars.png") &&
      !userProfile.avatar_url.includes("Avatars (1).png")
    ) {
      return "custom";
    } else if (userProfile?.avatar_url?.includes("Avatars.png")) {
      return "lady";
    } else if (userProfile?.avatar_url?.includes("Avatars (1).png")) {
      return "man";
    } else {
      return "lady"; // Default
    }
  };
  const currentAvatarType = getCurrentAvatarType();

  // Avatar selection with confirmation modal
  const handleAvatarChange = (avatarKey: "lady" | "man") => {
    setPendingAvatarKey(avatarKey);
    setShowConfirmModal(true);
  };
  const confirmAvatarChange = async () => {
    if (!pendingAvatarKey) return;
    setSaving(true);
    try {
      const avatarUrl = pendingAvatarKey === "lady" ? girlAvatar : boyAvatar;
      await updateUserProfile({ avatar_url: avatarUrl });
      setCustomAvatar(null);
      setSelectedAvatar(pendingAvatarKey);
    } catch (error) {
      console.error("Error updating avatar:", error);
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
      setPendingAvatarKey(null);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setCustomAvatar(URL.createObjectURL(file));
      setSelectedAvatar("custom");
    }
  };

  // Handle upload and save
  const handleUploadSave = async () => {
    if (!uploadFile || !user) return;
    setUploading(true);
    try {
      // TODO: Implement Supabase upload and get public URL
      // const publicUrl = await uploadToSupabase(uploadFile, user.id);
      const publicUrl = customAvatar; // placeholder for now
      await updateUserProfile({ avatar_url: publicUrl! });
      setCustomAvatar(publicUrl!);
      setUploadFile(null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  // Cancel upload
  const handleUploadCancel = () => {
    setUploadFile(null);
    setCustomAvatar(userProfile?.avatar_url || null);
    if (userProfile?.avatar_url?.includes("Avatars.png"))
      setSelectedAvatar("lady");
    else if (userProfile?.avatar_url?.includes("Avatars (1).png"))
      setSelectedAvatar("man");
    else setSelectedAvatar("custom");
  };

  // Remove custom photo with modal
  const handleRemovePhoto = () => {
    setShowRemoveModal(true);
  };
  const confirmRemovePhoto = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ avatar_url: DEFAULT_AVATAR });
      setCustomAvatar(null);
      setSelectedAvatar(DEFAULT_AVATAR_KEY);
      setUploadFile(null);
    } catch (error) {
      console.error("Error removing avatar:", error);
    } finally {
      setSaving(false);
      setShowRemoveModal(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateUserProfile({ full_name: fullName });
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Organization Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Organization Overview
          </h2>
          <ViewOnlyEye />
          {isAdmin && (
            <a
              href="#/admin-config"
              className="ml-3 px-3 py-1 rounded bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition"
              title="Edit in Admin Config"
            >
              Edit in Admin Config
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">
              Organization
            </div>
            <div className="text-lg font-semibold text-gray-900">
              De Lettuce Bear Berhad
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Industry</div>
            <div className="text-lg font-semibold text-gray-900">
              Technology & Consulting
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">
              Company Size
            </div>
            <div className="text-lg font-semibold text-gray-900">
              50-100 employees
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Your Role</div>
            <div className="text-lg font-semibold text-gray-900">
              Software Developer
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Department</div>
            <div className="text-lg font-semibold text-gray-900">
              Engineering
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-500">Location</div>
            <div className="text-lg font-semibold text-gray-900">
              Kuala Lumpur, Malaysia
            </div>
          </div>
        </div>
      </div>

      {/* Personal Profile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Personal Profile
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Ready-to-use Avatars */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Choose Avatar
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {avatarList.map((avatar) => (
                <button
                  key={avatar.key}
                  onClick={() =>
                    handleAvatarChange(avatar.key as "lady" | "man")
                  }
                  disabled={saving}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    currentAvatarType === avatar.key
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  } ${
                    saving ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
                  }`}
                >
                  <img
                    src={avatar.src}
                    alt={avatar.alt}
                    className="w-16 h-16 mx-auto rounded-full object-cover"
                  />
                  <div className="mt-2 text-center">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {avatar.key}
                    </div>
                  </div>
                  {saving && currentAvatarType === avatar.key && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center rounded-xl">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
          {/* Right: User Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Upload Your Photo
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center overflow-hidden relative">
                {customAvatar ? (
                  <>
                    <img
                      src={customAvatar}
                      alt="Custom Avatar Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-200 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400 z-10"
                      title="Remove photo"
                      onClick={handleRemovePhoto}
                    >
                      <span className="text-lg font-bold leading-none">×</span>
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400 text-sm font-medium text-center leading-tight w-full px-2">
                    Avatar Preview
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Choose Photo"}
              </button>
              {uploadFile && (
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUploadSave}
                    disabled={uploading}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleUploadCancel}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Max size: 2MB. JPG, PNG, GIF allowed.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Avatar Change */}
      <Modal
        isOpen={showConfirmModal}
        title="Confirm Avatar Change"
        onClose={() => setShowConfirmModal(false)}
        actions={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setShowConfirmModal(false)}
            >
              No
            </button>
            <button className="btn btn-primary" onClick={confirmAvatarChange}>
              Yes
            </button>
          </>
        }
      >
        <p>Do you want to make this your default avatar?</p>
      </Modal>

      {/* Confirmation Modal for Remove Photo */}
      <Modal
        isOpen={showRemoveModal}
        title="Remove Photo"
        onClose={() => setShowRemoveModal(false)}
        actions={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setShowRemoveModal(false)}
            >
              No
            </button>
            <button
              className="btn btn-primary text-red-600"
              onClick={confirmRemovePhoto}
            >
              Yes
            </button>
          </>
        }
      >
        <p>Are you sure you want to remove your uploaded photo?</p>
      </Modal>

      {/* User Enrichment Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Profile Enrichment
        </h2>
        <p className="text-gray-600 mb-6">
          Enrich your profile with additional information that will help your
          colleagues get to know you better and discover your skills and
          interests.
        </p>
        <UserEnrichmentSection />
      </div>
    </div>
  );
};

export default OverviewTab;
