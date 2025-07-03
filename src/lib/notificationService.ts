import { supabase } from './supabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_type: 'global' | 'user' | 'group' | 'role' | 'organization';
  target_ids?: string[]; // user IDs, group IDs, role IDs, or org IDs
  expires_at?: string;
  created_at: string;
  created_by: string;
  read_by: string[]; // Array of user IDs who have read this notification
  dismissed_by: string[]; // Array of user IDs who have dismissed this notification
  metadata?: Record<string, any>; // Additional data like links, actions, etc.
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  message_template: string;
  type: Notification['type'];
  priority: Notification['priority'];
  target_type: Notification['target_type'];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  notification_types: {
    info: boolean;
    success: boolean;
    warning: boolean;
    error: boolean;
    system: boolean;
  };
  quiet_hours: {
    enabled: boolean;
    start_time: string; // HH:MM format
    end_time: string; // HH:MM format
    timezone: string;
  };
}

export class NotificationService {
  private notificationsTable = 'notifications';
  private templatesTable = 'notification_templates';
  private settingsTable = 'notification_settings';

  // Create a new notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'read_by' | 'dismissed_by'>): Promise<Notification> {
    try {
      const { data, error } = await supabase
        .from(this.notificationsTable)
        .insert({
          ...notification,
          read_by: [],
          dismissed_by: []
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for current user (respects RLS)
  async getUserNotifications(
    limit: number = 20,
    offset: number = 0,
    includeRead: boolean = false
  ): Promise<{ data: Notification[]; count: number }> {
    try {
      let query = supabase
        .from(this.notificationsTable)
        .select('*', { count: 'exact' });

      // Filter by target type and user access
      query = query.or(`target_type.eq.global,target_type.eq.user,target_ids.cs.{${supabase.auth.getUser()?.id}}`);

      if (!includeRead) {
        query = query.not('read_by', 'cs', `{${supabase.auth.getUser()?.id}}`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { data: data || [], count: count || 0 };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const userId = supabase.auth.getUser()?.id;
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from(this.notificationsTable)
        .update({
          read_by: supabase.sql`array_append(read_by, ${userId})`
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark notification as dismissed
  async markAsDismissed(notificationId: string): Promise<void> {
    try {
      const userId = supabase.auth.getUser()?.id;
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from(this.notificationsTable)
        .update({
          dismissed_by: supabase.sql`array_append(dismissed_by, ${userId})`
        })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as dismissed:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      const userId = supabase.auth.getUser()?.id;
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from(this.notificationsTable)
        .update({
          read_by: supabase.sql`array_append(read_by, ${userId})`
        })
        .or(`target_type.eq.global,target_type.eq.user,target_ids.cs.{${userId}}`)
        .not('read_by', 'cs', `{${userId}}`);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get notification templates (admin only)
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    try {
      const { data, error } = await supabase
        .from(this.templatesTable)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notification templates:', error);
      throw error;
    }
  }

  // Create notification template
  async createNotificationTemplate(template: Omit<NotificationTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<NotificationTemplate> {
    try {
      const { data, error } = await supabase
        .from(this.templatesTable)
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification template:', error);
      throw error;
    }
  }

  // Update notification template
  async updateNotificationTemplate(id: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    try {
      const { data, error } = await supabase
        .from(this.templatesTable)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating notification template:', error);
      throw error;
    }
  }

  // Delete notification template
  async deleteNotificationTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.templatesTable)
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification template:', error);
      throw error;
    }
  }

  // Get user notification settings
  async getUserNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const userId = supabase.auth.getUser()?.id;
      if (!userId) return null;

      const { data, error } = await supabase
        .from(this.settingsTable)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  }

  // Update user notification settings
  async updateUserNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const userId = supabase.auth.getUser()?.id;
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from(this.settingsTable)
        .upsert({
          user_id: userId,
          ...settings
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Send notification to specific users
  async sendToUsers(
    userIds: string[],
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    priority: Notification['priority'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<Notification[]> {
    try {
      const notifications = userIds.map(userId => ({
        title,
        message,
        type,
        priority,
        target_type: 'user' as const,
        target_ids: [userId],
        created_by: supabase.auth.getUser()?.id || 'system',
        metadata
      }));

      const { data, error } = await supabase
        .from(this.notificationsTable)
        .insert(notifications)
        .select();

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error sending notifications to users:', error);
      throw error;
    }
  }

  // Send global notification
  async sendGlobal(
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    priority: Notification['priority'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<Notification> {
    try {
      const notification = {
        title,
        message,
        type,
        priority,
        target_type: 'global' as const,
        created_by: supabase.auth.getUser()?.id || 'system',
        metadata
      };

      return await this.createNotification(notification);
    } catch (error) {
      console.error('Error sending global notification:', error);
      throw error;
    }
  }

  // Get unread count for current user
  async getUnreadCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.notificationsTable)
        .select('*', { count: 'exact', head: true })
        .or(`target_type.eq.global,target_type.eq.user,target_ids.cs.{${supabase.auth.getUser()?.id}}`)
        .not('read_by', 'cs', `{${supabase.auth.getUser()?.id}}`);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(callback: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: this.notificationsTable,
          filter: `target_type=eq.global OR target_ids=cs.{${supabase.auth.getUser()?.id}}`
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
}

export const notificationService = new NotificationService(); 