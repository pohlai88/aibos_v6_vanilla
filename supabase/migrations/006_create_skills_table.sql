-- 006_create_skills_table.sql
--
-- This migration creates the 'skills' table for the Skills Management and User Enrichment features.
-- It is ready for future use, but you do NOT need to apply it yet. (Apply when backend integration is ready.)
--
-- The table is preloaded with a rich, categorized skills list for BI, analytics, and internal gig matching.
--
-- To apply: run this migration with your Supabase CLI or SQL tool when ready.

-- =========================
-- Table Definition
-- =========================
CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================
-- Preload Skills Data
-- =========================
INSERT INTO skills (name, category) VALUES
  ('UI/UX Design', 'Technical'),
  ('Frontend Development', 'Technical'),
  ('Backend Development', 'Technical'),
  ('Project Management', 'Business'),
  ('Marketing', 'Business'),
  ('Sales', 'Business'),
  ('Data Analysis', 'Technical'),
  ('Copywriting', 'Creative'),
  ('Customer Support', 'Business'),
  ('Event Promotion', 'Business'),
  ('QA/Testing', 'Technical'),
  ('DevOps', 'Technical'),
  ('Cloud Computing', 'Technical'),
  ('AI/ML', 'Technical'),
  ('Cybersecurity', 'Technical'),
  ('Product Management', 'Business'),
  ('Business Analysis', 'Business'),
  ('Content Creation', 'Creative'),
  ('Social Media Management', 'Creative'),
  ('Finance/Accounting', 'Business'),
  ('HR/Recruitment', 'Business'),
  ('Operations', 'Business'),
  ('Leadership', 'Soft Skill'),
  ('Communication', 'Soft Skill'),
  ('Problem Solving', 'Soft Skill'),
  ('Creativity', 'Soft Skill'),
  ('Other', 'Other');

-- =========================
-- End of Migration
-- =========================
-- Apply this migration when backend integration is ready. 