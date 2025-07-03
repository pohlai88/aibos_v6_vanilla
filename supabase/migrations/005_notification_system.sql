-- Migration: Notification System
-- Creates tables for notifications, templates, and settings with RLS

-- ============================================================================
-- NOTIFICATION TABLES
-- ============================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    target_type TEXT NOT NULL CHECK (target_type IN ('global', 'user', 'group', 'role', 'organization')),
    target_ids TEXT[] DEFAULT '{}', -- Array of user IDs, group IDs, role IDs, or org IDs
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    read_by TEXT[] DEFAULT '{}', -- Array of user IDs who have read this notification
    dismissed_by TEXT[] DEFAULT '{}', -- Array of user IDs who have dismissed this notification
    metadata JSONB DEFAULT '{}' -- Additional data like links, actions, etc.
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    target_type TEXT NOT NULL CHECK (target_type IN ('global', 'user', 'group', 'role', 'organization')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    in_app_notifications BOOLEAN DEFAULT true,
    notification_types JSONB DEFAULT '{"info": true, "success": true, "warning": true, "error": true, "system": true}',
    quiet_hours JSONB DEFAULT '{"enabled": false, "start_time": "22:00", "end_time": "08:00", "timezone": "UTC"}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_target_type ON notifications(target_type);
CREATE INDEX IF NOT EXISTS idx_notifications_target_ids ON notifications USING GIN(target_ids);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_by ON notifications USING GIN(read_by);
CREATE INDEX IF NOT EXISTS idx_notifications_dismissed_by ON notifications USING GIN(dismissed_by);

-- Template indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);

-- Settings indexes
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all notification tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Notifications policies
-- Users can view notifications that are:
-- 1. Global notifications
-- 2. Targeted specifically to them
-- 3. Targeted to their organization/group/role
CREATE POLICY "Users can view their notifications" ON notifications
    FOR SELECT USING (
        target_type = 'global' OR
        target_type = 'user' AND auth.uid()::TEXT = ANY(target_ids) OR
        target_type = 'organization' AND auth.uid() IN (
            SELECT user_id FROM user_organizations 
            WHERE organization_id::TEXT = ANY(target_ids) AND status = 'active'
        ) OR
        target_type = 'group' AND auth.uid() IN (
            SELECT user_id FROM employee_profiles 
            WHERE department IN (SELECT name FROM departments WHERE id::TEXT = ANY(target_ids))
        ) OR
        target_type = 'role' AND auth.uid() IN (
            SELECT user_id FROM user_organizations 
            WHERE role IN (SELECT unnest(target_ids)) AND status = 'active'
        )
    );

-- Admins can create notifications
CREATE POLICY "Admins can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT uo.user_id FROM user_organizations uo
            WHERE uo.role IN ('owner', 'admin') AND uo.status = 'active'
        )
    );

-- Users can update their own read/dismissed status
CREATE POLICY "Users can update notification status" ON notifications
    FOR UPDATE USING (
        target_type = 'global' OR
        target_type = 'user' AND auth.uid()::TEXT = ANY(target_ids) OR
        target_type = 'organization' AND auth.uid() IN (
            SELECT user_id FROM user_organizations 
            WHERE organization_id::TEXT = ANY(target_ids) AND status = 'active'
        ) OR
        target_type = 'group' AND auth.uid() IN (
            SELECT user_id FROM employee_profiles 
            WHERE department IN (SELECT name FROM departments WHERE id::TEXT = ANY(target_ids))
        ) OR
        target_type = 'role' AND auth.uid() IN (
            SELECT user_id FROM user_organizations 
            WHERE role IN (SELECT unnest(target_ids)) AND status = 'active'
        )
    );

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications" ON notifications
    FOR DELETE USING (
        auth.uid() IN (
            SELECT uo.user_id FROM user_organizations uo
            WHERE uo.role IN ('owner', 'admin') AND uo.status = 'active'
        )
    );

-- Notification templates policies
-- Admins can manage templates
CREATE POLICY "Admins can manage notification templates" ON notification_templates
    FOR ALL USING (
        auth.uid() IN (
            SELECT uo.user_id FROM user_organizations uo
            WHERE uo.role IN ('owner', 'admin') AND uo.status = 'active'
        )
    );

-- Users can view active templates
CREATE POLICY "Users can view active templates" ON notification_templates
    FOR SELECT USING (is_active = true);

-- Notification settings policies
-- Users can manage their own settings
CREATE POLICY "Users can manage their notification settings" ON notification_settings
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp for templates
CREATE OR REPLACE FUNCTION update_notification_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_notification_template_updated_at();

-- Auto-update updated_at timestamp for settings
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_notification_settings_updated_at();

-- Function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample notification templates
INSERT INTO notification_templates (name, title_template, message_template, type, priority, target_type) VALUES
('System Maintenance', 'System Maintenance - {date}', 'Scheduled maintenance will occur on {date} from {start_time} to {end_time}. Please save your work.', 'warning', 'high', 'global'),
('Welcome Message', 'Welcome to AIBOS!', 'Welcome {user_name}! We''re excited to have you on board. Please complete your profile setup.', 'info', 'medium', 'user'),
('Security Alert', 'Security Alert - {alert_type}', 'A security {alert_type} has been detected. Please review your account activity.', 'error', 'urgent', 'global'),
('Task Reminder', 'Task Reminder: {task_name}', 'You have a pending task "{task_name}" due on {due_date}. Please complete it soon.', 'warning', 'medium', 'user'),
('System Update', 'System Update Available', 'A new system update is available. New features include: {features}.', 'success', 'low', 'global')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE notifications IS 'System notifications with RLS support for targeted delivery';
COMMENT ON TABLE notification_templates IS 'Reusable notification templates for consistent messaging';
COMMENT ON TABLE notification_settings IS 'User-specific notification preferences and settings';
COMMENT ON COLUMN notifications.target_ids IS 'Array of target IDs based on target_type (user IDs, group IDs, etc.)';
COMMENT ON COLUMN notifications.read_by IS 'Array of user IDs who have marked this notification as read';
COMMENT ON COLUMN notifications.dismissed_by IS 'Array of user IDs who have dismissed this notification';
COMMENT ON COLUMN notifications.metadata IS 'Additional JSON data for links, actions, or custom behavior'; 