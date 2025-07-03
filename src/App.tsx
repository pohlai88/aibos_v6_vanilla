import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { SupabaseProvider } from "./lib/supabase";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import HomePage from "./pages/HomePage";
import DashboardPage from "./modules/Dashboard/DashboardPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { ThemeProvider } from "./contexts/ThemeContext";

import AppShell from "./components/layout/AppShell";

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <SupabaseProvider>
        <AuthProvider>
          {/* Only wrap protected app pages with AppShell. Do NOT show AppShell (header/background) on HomePage or LoginPage. */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ProfilePage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}

export default App;
