import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import MoodPicker from "../ui/MoodPicker";
import ThemeToggle from "../ui/ThemeToggle";
import girlAvatar from "../icons/Avatars.png";
import boyAvatar from "../icons/Avatars (1).png";
import { useQuickAddActions } from "../../contexts/QuickAddContext";
import { useAuth } from "../../contexts/AuthContext";
import quickAdd3 from "../icons/quick add 3.png";
import { searchService, SearchResult } from "../../lib/searchService";
import {
  notificationService,
  Notification,
} from "../../lib/notificationService";
import { supabase } from "../../lib/supabase";

const menuItems = [
  { icon: "👤", label: "Profile", to: "/profile" },
  { icon: "⚙️", label: "Account Settings", to: "/settings" },
  {
    icon: "🌗",
    label: "Theme: Light/Dark",
    to: "#",
    action: () => {
      /* TODO: theme toggle */
    },
  },
  { icon: "❓", label: "Help", to: "/help" },
  { icon: "💬", label: "Feedback", to: "/feedback" },
  { icon: "🚪", label: "Logout", to: "/logout" },
];

// SVG overlays
const PartyHat = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    className="absolute left-1/2 -translate-x-1/2 -top-4 z-20"
    style={{ transform: "translate(-50%, 0) rotate(-18deg)" }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon
      points="11,2 20,20 2,20"
      fill="#FBBF24"
      stroke="#F59E42"
      strokeWidth="1.5"
    />
    <circle cx="11" cy="4" r="2" fill="#F472B6" />
  </svg>
);
const WavingHand = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    className="absolute -right-3 top-3 z-20 animate-wave"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 24c2 2 8 2 12 0"
      stroke="#FBBF24"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="24" cy="8" r="6" fill="#FBBF24" />
  </svg>
);
const SadMouth = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 24c2-2 6-2 8 0"
      stroke="#EF4444"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// Blinking eye animation (CSS)
const blinkKeyframes = `@keyframes blink { 0%, 97%, 100% { opacity: 1; } 98%, 99% { opacity: 0; } }`;

const Header: React.FC<{ userEmail?: string }> = ({ userEmail }) => {
  const { user, signOut, userProfile, profileLoading, updateUserProfile } =
    useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const isBirthday = today.getMonth() === 6 && today.getDate() === 3; // July 3 (mock)
  const [avatarHover, setAvatarHover] = useState(false);
  const [logoutHover, setLogoutHover] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<
    "lady" | "man" | "custom"
  >("lady");

  const avatarList = [
    { key: "lady", src: girlAvatar, alt: "Lady Avatar" },
    { key: "man", src: boyAvatar, alt: "Man Avatar" },
  ];
  const moodList = [
    { key: "happy", emoji: "😊" },
    { key: "neutral", emoji: "😐" },
    { key: "sad", emoji: "😞" },
  ];
  const [selectedMood, setSelectedMood] = useState("happy");

  // Add state and handler for Quick Add dropdown
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const quickAddRef = useRef<HTMLDivElement>(null);

  // Add userQuickAdd state for personalized actions
  const { actions: adminActions } = useQuickAddActions();
  const [userQuickAdd, setUserQuickAdd] = useState(() =>
    adminActions.filter((a) => a.enabled).map((a) => a.id)
  );
  const [editMode, setEditMode] = useState(false);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notification Bell state and real data
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Sync selectedAvatar with userProfile.avatar_url (SSOT)
  useEffect(() => {
    if (userProfile?.avatar_url) {
      if (userProfile.avatar_url.includes("Avatars.png")) {
        setSelectedAvatar("lady");
      } else if (userProfile.avatar_url.includes("Avatars (1).png")) {
        setSelectedAvatar("man");
      } else {
        setSelectedAvatar("custom");
      }
    } else {
      setSelectedAvatar("lady"); // Default
    }
  }, [userProfile?.avatar_url]);

  // Search handler with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setSearchLoading(true);
        try {
          const results = await searchService.quickSearch(searchTerm.trim(), 8);
          setSearchResults(results);
          setSearchOpen(true);
        } catch (error) {
          console.error("Search error:", error);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
        setSearchOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Close search dropdown on outside click or Esc
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    }
    function handleSlash(e: KeyboardEvent) {
      if (
        e.key === "/" &&
        !searchOpen &&
        document.activeElement !== searchInputRef.current
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    document.addEventListener("keydown", handleSlash);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
      document.removeEventListener("keydown", handleSlash);
    };
  }, [searchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        quickAddRef.current &&
        !quickAddRef.current.contains(e.target as Node)
      ) {
        setQuickAddOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setQuickAddOpen(false);
    }
    if (quickAddOpen) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [quickAddOpen]);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setNotifOpen(false);
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEsc);
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [notifOpen]);

  // Load notifications
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const { data } = await notificationService.getUserNotifications(
        10,
        0,
        false
      );
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(
        notifications.map((n) => ({
          ...n,
          read_by: [...(n.read_by || []), supabase.auth.getUser()?.id || ""],
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId
            ? {
                ...n,
                read_by: [
                  ...(n.read_by || []),
                  supabase.auth.getUser()?.id || "",
                ],
              }
            : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      system: "🔧",
    };
    return icons[type];
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleSearchResultClick = (result: SearchResult) => {
    setSearchOpen(false);
    setSearchTerm("");
    // Navigate to the result URL
    window.location.href = result.url;
  };

  // Handle avatar selection and save to profile (SSOT)
  const handleAvatarChange = async (avatarKey: "lady" | "man") => {
    try {
      const avatarUrl = avatarKey === "lady" ? girlAvatar : boyAvatar;
      await updateUserProfile({ avatar_url: avatarUrl });
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  // Get current avatar source (SSOT)
  const getCurrentAvatarSrc = () => {
    if (
      userProfile?.avatar_url &&
      !userProfile.avatar_url.includes("Avatars.png") &&
      !userProfile.avatar_url.includes("Avatars (1).png")
    ) {
      return userProfile.avatar_url; // Custom uploaded avatar
    } else if (userProfile?.avatar_url?.includes("Avatars.png")) {
      return girlAvatar;
    } else if (userProfile?.avatar_url?.includes("Avatars (1).png")) {
      return boyAvatar;
    } else {
      return girlAvatar; // System default
    }
  };

  // Check if user has custom avatar
  const hasCustomAvatar =
    userProfile?.avatar_url &&
    !userProfile.avatar_url.includes("Avatars.png") &&
    !userProfile.avatar_url.includes("Avatars (1).png");

  // Get current avatar type for selection state
  const getCurrentAvatarType = () => {
    if (hasCustomAvatar) {
      return "custom";
    } else if (userProfile?.avatar_url?.includes("Avatars.png")) {
      return "lady";
    } else if (userProfile?.avatar_url?.includes("Avatars (1).png")) {
      return "man";
    } else {
      return "lady"; // System default
    }
  };

  const currentAvatarType = getCurrentAvatarType();

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      setMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 w-full">
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        {/* Left: Logo */}
        <div className="flex items-center space-x-2">
          <Link
            to="/dashboard"
            aria-label="Go to dashboard"
            className="brand-logo text-2xl font-bold text-gray-900 font-ui"
          >
            AI-BOS
          </Link>
        </div>
        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64" ref={searchRef}>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
                />
              </svg>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-200 bg-gray-50 text-gray-800 font-ui focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-sm"
              placeholder="Search tasks, people, projects…  /"
              aria-label="Search across AI-BOS"
              tabIndex={0}
              title="Search (press / to focus)"
            />
            {searchLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </span>
            )}

            {/* Search Results Dropdown */}
            {searchOpen && (searchResults.length > 0 || searchLoading) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 max-h-96 overflow-y-auto">
                {searchLoading ? (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <>
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchResultClick(result)}
                        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                        tabIndex={0}
                      >
                        <span className="text-lg mt-0.5">{result.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-xs text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                          )}
                          {result.description && (
                            <div className="text-xs text-gray-400 truncate">
                              {result.description}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 capitalize">
                          {result.type}
                        </span>
                      </button>
                    ))}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          setSearchOpen(false);
                          // Navigate to full search results page
                          window.location.href = `/search?q=${encodeURIComponent(
                            searchTerm
                          )}`;
                        }}
                        className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 text-sm font-medium text-left"
                        tabIndex={0}
                      >
                        View all results for "{searchTerm}"
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-4 py-3 text-gray-500 text-sm">
                    No results found for "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Quick Add Icon Button */}
          <div className="relative">
            <button
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
              title="Quick Add"
              aria-haspopup="true"
              aria-expanded={quickAddOpen}
              aria-controls="quick-add-menu"
              onClick={() => setQuickAddOpen((v) => !v)}
              tabIndex={0}
            >
              <img
                src={quickAdd3}
                alt="Quick Add"
                className="h-7 w-7 object-contain"
              />
            </button>
            {quickAddOpen && (
              <div
                ref={quickAddRef}
                id="quick-add-menu"
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in font-ui"
                role="menu"
                tabIndex={-1}
                style={{ minWidth: "220px" }}
              >
                {/* User's selected actions */}
                {adminActions
                  .filter((a) => userQuickAdd.includes(a.id) && a.enabled)
                  .map((a) => (
                    <div key={a.id} className="flex items-center group">
                      <button
                        className={`w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-blue-50 transition text-[15px]`}
                        role="menuitem"
                        tabIndex={0}
                      >
                        <span className="text-lg">{a.icon}</span> {a.label}
                      </button>
                      {editMode && (
                        <button
                          onClick={() =>
                            setUserQuickAdd(
                              userQuickAdd.filter((id) => id !== a.id)
                            )
                          }
                          className="text-red-400 px-2 py-2 hover:text-red-600"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                {/* Divider */}
                <div className="border-t border-gray-100 my-2" />
                {/* Add / Edit Action pinned at bottom */}
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 transition text-[15px] font-semibold"
                  onClick={() => setEditMode((v) => !v)}
                  role="menuitem"
                  tabIndex={0}
                >
                  <span className="text-lg">＋</span> Add / Edit Action
                </button>
                {editMode && (
                  <div className="px-4 py-2">
                    <div className="text-xs text-gray-500 mb-1">
                      Available Actions
                    </div>
                    <div className="flex flex-col gap-1">
                      {adminActions.filter(
                        (a) => a.enabled && !userQuickAdd.includes(a.id)
                      ).length === 0 && (
                        <div className="text-gray-400 text-xs">
                          No more actions to add.
                        </div>
                      )}
                      {adminActions
                        .filter(
                          (a) => a.enabled && !userQuickAdd.includes(a.id)
                        )
                        .map((a) => (
                          <button
                            key={a.id}
                            onClick={() =>
                              setUserQuickAdd([...userQuickAdd, a.id])
                            }
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-blue-50 text-gray-700 text-sm"
                          >
                            <span className="text-lg">{a.icon}</span> {a.label}
                            <span className="ml-auto text-blue-500 text-xs">
                              Add
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Notification Bell */}
          <div className="relative">
            <button
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition relative"
              title="Notifications (Shift+N)"
              aria-haspopup="true"
              aria-expanded={notifOpen}
              aria-controls="notif-menu"
              onClick={() => setNotifOpen((v) => !v)}
              tabIndex={0}
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
              )}
            </button>
            {notifOpen && (
              <div
                ref={notifRef}
                id="notif-menu"
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in font-ui"
                role="menu"
                tabIndex={-1}
              >
                <div className="px-4 py-2 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-gray-800">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {notificationsLoading ? (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">
                      Loading notifications...
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.slice(0, 5).map((n) => {
                      const isRead = n.read_by?.includes(
                        supabase.auth.getUser()?.id || ""
                      );
                      return (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                            !isRead ? "bg-blue-50" : ""
                          }`}
                          onClick={() => markAsRead(n.id)}
                        >
                          <span className="text-2xl mt-1">
                            {getNotificationIcon(n.type)}
                          </span>
                          <div className="flex-1">
                            <div className="text-[15px] font-medium text-gray-900">
                              {n.title}
                            </div>
                            <div className="text-sm text-gray-600">
                              {n.message}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatTimeAgo(n.created_at)}
                            </div>
                          </div>
                          {!isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">
                      No notifications
                    </div>
                  )}
                </div>
                <div className="border-t border-gray-100 mt-2" />
                <button
                  className="w-full px-4 py-2 text-blue-600 hover:bg-blue-50 text-[15px] font-semibold rounded-b-xl text-left"
                  tabIndex={0}
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
          {/* Avatar/Menu */}
          <div className="flex items-center space-x-4 relative">
            <div
              className="relative w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold cursor-pointer overflow-hidden"
              style={{ position: "relative", overflow: "hidden" }}
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => {
                setAvatarHover(false);
                setLogoutHover(false);
              }}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open user menu"
            >
              {profileLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <img
                    src={getCurrentAvatarSrc()}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  {/* Waving hand on hover */}
                  {avatarHover && !logoutHover && <WavingHand />}
                  {/* Sad mouth on logout hover */}
                  {logoutHover && <SadMouth />}
                </>
              )}
            </div>
            {menuOpen && (
              <div
                ref={menuRef}
                className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-50 animate-fade-in font-ui"
              >
                {/* User Info */}
                <div className="px-6 pb-2">
                  <div className="text-[15px] text-gray-800 font-semibold mb-1 font-ui text-left">
                    {userProfile?.full_name || user?.email || "User"}
                  </div>
                  <div className="flex flex-col gap-0.5 text-[14px] text-gray-700 font-ui text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📧</span> Email:{" "}
                      <span className="font-normal">
                        {user?.email || "Not available"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🆔</span> User ID:{" "}
                      <span className="font-normal">
                        {user?.id?.slice(0, 8) || "Not available"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📅</span> Member since:{" "}
                      <span className="font-normal">
                        {user?.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "Not available"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🎭</span> Mood:{" "}
                      <span className="font-normal">
                        {moodList.find((m) => m.key === selectedMood)?.emoji}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Quick Actions 2x2 grid */}
                <div className="px-6 pb-2">
                  <div className="text-[15px] text-gray-800 font-semibold mb-1 font-ui text-left">
                    Quick Actions
                  </div>
                  <div className="w-full flex justify-center">
                    <div className="grid grid-cols-2 gap-2 w-full bg-gray-50 rounded-xl shadow-sm p-2 items-center justify-center">
                      <button
                        className="flex flex-col items-center justify-center gap-1 px-0 py-2 rounded bg-blue-100 text-blue-700 font-normal text-[13px] hover:bg-blue-200 transition h-14"
                        style={{ minWidth: "90px" }}
                        onClick={() => alert("Add Task")}
                      >
                        <span className="text-xl">➕</span>Add Task
                      </button>
                      <button
                        className="flex flex-col items-center justify-center gap-1 px-0 py-2 rounded bg-green-100 text-green-700 font-normal text-[13px] hover:bg-green-200 transition h-14"
                        style={{ minWidth: "90px" }}
                        onClick={() => alert("Start Meeting")}
                      >
                        <span className="text-xl">🗓</span>Start Meeting
                      </button>
                      <button
                        className="flex flex-col items-center justify-center gap-1 px-0 py-2 rounded bg-purple-100 text-purple-700 font-normal text-[13px] hover:bg-purple-200 transition h-14"
                        style={{ minWidth: "90px" }}
                        onClick={() => alert("New Note")}
                      >
                        <span className="text-xl">📝</span>New Note
                      </button>
                      <button
                        className="flex flex-col items-center justify-center gap-1 px-0 py-2 rounded bg-pink-100 text-pink-700 font-normal text-[13px] hover:bg-pink-200 transition h-14"
                        style={{ minWidth: "90px" }}
                        onClick={() => alert("Upload File")}
                      >
                        <span className="text-xl">📤</span>Upload File
                      </button>
                    </div>
                  </div>
                </div>
                {/* Avatar & Mood selection (vertical, grouped, optimized) */}
                <div className="px-6 pb-2">
                  <div className="flex items-center gap-8 bg-gray-50 rounded-xl shadow-sm p-3 min-h-[110px]">
                    {/* Avatars vertical, larger */}
                    <div className="flex flex-col gap-3 items-center flex-1 justify-center">
                      {avatarList.map((a) => (
                        <button
                          key={a.key}
                          onClick={() =>
                            handleAvatarChange(a.key as "lady" | "man")
                          }
                          disabled={profileLoading}
                          className={`w-14 h-14 rounded-full border-2 ${
                            currentAvatarType === a.key
                              ? "border-blue-500"
                              : "border-transparent"
                          } overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm ${
                            profileLoading
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:scale-105"
                          }`}
                        >
                          <img
                            src={a.src}
                            alt={a.alt}
                            className="w-full h-full object-cover"
                          />
                          {profileLoading && currentAvatarType === a.key && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </button>
                      ))}
                      {/* Custom Avatar Option */}
                      {hasCustomAvatar ? (
                        <button
                          onClick={() => {
                            /* Navigate to profile for management */
                          }}
                          disabled={profileLoading}
                          className={`w-14 h-14 rounded-full border-2 ${
                            currentAvatarType === "custom"
                              ? "border-blue-500"
                              : "border-transparent"
                          } overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-400 transition shadow-sm ${
                            profileLoading
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:scale-105"
                          }`}
                        >
                          <img
                            src={userProfile?.avatar_url}
                            alt="Your Photo"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            window.location.href = "/profile";
                          }}
                          disabled={profileLoading}
                          className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition"
                          title="Upload Your Photo"
                        >
                          <span className="text-lg">📷</span>
                        </button>
                      )}
                    </div>
                    {/* Mood selection vertical, centered */}
                    <div className="flex flex-col gap-2 items-start flex-1 justify-center">
                      {moodList.map((m) => (
                        <button
                          key={m.key}
                          onClick={() => setSelectedMood(m.key)}
                          className={`flex items-center gap-2 text-2xl rounded-full px-2 py-1 transition ${
                            selectedMood === m.key
                              ? "ring-2 ring-blue-400 bg-blue-50"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          <span>{m.emoji}</span>
                          <span className="text-[15px] font-normal text-gray-700">
                            {m.key === "happy"
                              ? "Happy"
                              : m.key === "neutral"
                              ? "Neutral"
                              : "Sad"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-100 my-2" />
                {/* Nav links (no Account Settings) */}
                <nav className="flex flex-col font-ui">
                  <Link
                    to="/profile"
                    className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-50 transition text-[15px] gap-3 text-left"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="text-xl">👤</span>
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/help"
                    className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-50 transition text-[15px] gap-3 text-left"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="text-xl">❓</span>
                    <span>Help</span>
                  </Link>
                  <Link
                    to="/feedback"
                    className="flex items-center px-6 py-2 text-gray-700 hover:bg-gray-50 transition text-[15px] gap-3 text-left"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="text-xl">💬</span>
                    <span>Feedback</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-6 py-2 text-gray-700 hover:bg-gray-50 transition text-[15px] gap-3 text-left"
                    onMouseEnter={() => setLogoutHover(true)}
                    onMouseLeave={() => setLogoutHover(false)}
                  >
                    <span className="text-xl">🚪</span>
                    <span>Logout</span>
                  </button>
                </nav>
                {/* Daily Tip/Quote */}
                <div className="px-6 pt-2 pb-1 flex items-start gap-2 text-[14px] text-blue-700 font-ui text-left">
                  <span className="text-lg">🌟</span>
                  <span>
                    Remember: Life's complex enough. Take a breath.{" "}
                    <span className="inline-block">🌿</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
