import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  full_name?: string;
  avatar_url?: string;
}

export class ProfileService {
  private table = 'profiles';

  // Get user profile by ID
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from(this.table)
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Get current user's profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await this.getUserProfile(user.id);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      throw error;
    }
  }

  // Create or update user profile
  async upsertUserProfile(profileData: ProfileUpdateData): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from(this.table)
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }
  }

  // Update avatar URL
  async updateAvatarUrl(avatarUrl: string): Promise<UserProfile> {
    return await this.upsertUserProfile({ avatar_url: avatarUrl });
  }

  // Update full name
  async updateFullName(fullName: string): Promise<UserProfile> {
    return await this.upsertUserProfile({ full_name: fullName });
  }

  // Delete user profile
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.table)
        .delete()
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }

  // Get profile by email (for admin purposes)
  async getProfileByEmail(email: string): Promise<UserProfile | null> {
    try {
      // First get user by email from auth
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) throw authError;

      const user = users?.find(u => u.email === email);
      if (!user) return null;

      return await this.getUserProfile(user.id);
    } catch (error) {
      console.error('Error fetching profile by email:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService(); 