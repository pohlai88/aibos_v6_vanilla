import './env.d.ts';
import React from 'react';

export interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  subscription_tier?: 'free' | 'pro' | 'enterprise'
  updated_at?: string
}

export interface AuthContextType {
  user: User | null
  session: unknown
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

// Re-export profile types
export type { UserProfile, ProfileUpdateData } from '../lib/profileService';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface DashboardStats {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string }>
  color: string
} 