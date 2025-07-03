/* global console */
import { createClient } from '@supabase/supabase-js'
import React, { createContext, useContext } from 'react'

// Environment variables for Vercel deployment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ivvnmiyfmugkowjwbmni.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2dm5taXlmbXVna293andibW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDI3NDYsImV4cCI6MjA2Njk3ODc0Nn0.l59BmJsJRC0iHseZ71VNAW_teKWrFx4lvExkQI3bgSw'

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  // console.error('Missing Supabase environment variables:', {
  //   url: supabaseUrl ? '✅ Set' : '❌ Missing',
  //   key: supabaseAnonKey ? '✅ Set' : '❌ Missing'
  // })
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

const SupabaseContext = createContext(supabase)

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  )
} 