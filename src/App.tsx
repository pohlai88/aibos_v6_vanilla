import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { SupabaseProvider } from './lib/supabase'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from './components/ui/Toaster'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import AuthPage from './pages/AuthPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ProfilePage from './pages/ProfilePage'

console.log('App.tsx: Component loaded')

// Simple fallback component for debugging
const DebugFallback: React.FC = () => {
  console.log('DebugFallback: Rendering fallback')
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">AIBOS V6</h1>
        <p className="text-gray-600">App is loading...</p>
      </div>
    </div>
  )
}

function App() {
  console.log('App: Rendering main app component')
  
  return (
    <React.Suspense fallback={<DebugFallback />}>
      <SupabaseProvider>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="auth" element={<AuthPage />} />
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </AuthProvider>
      </SupabaseProvider>
    </React.Suspense>
  )
}

export default App 