-- Supabase Database Schema for Questlog Cross-Device Synchronization
-- Run these SQL commands in your Supabase SQL editor

-- Enable Row Level Security (RLS) for all tables
-- This ensures users can only access their own data

-- 1. Quests Table
-- Stores all quest data with full quest objects
CREATE TABLE IF NOT EXISTS public.quests (
    id TEXT PRIMARY KEY,
    creator_address TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    reward TEXT NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 100,
    visibility TEXT NOT NULL DEFAULT 'public',
    requirements JSONB NOT NULL DEFAULT '[]',
    badge_image TEXT NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    quest_data JSONB NOT NULL, -- Full quest object
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. User Progress Table
-- Tracks which quests users have joined and their progress
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    completed_requirements INTEGER[] DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_address, quest_id),
    FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE
);

-- 3. User Badges Table
-- Stores badges earned by users
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_address TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_image TEXT NOT NULL,
    token_id TEXT,
    minted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_address, quest_id),
    FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quests_creator ON public.quests(creator_address);
CREATE INDEX IF NOT EXISTS idx_quests_visibility ON public.quests(visibility);
CREATE INDEX IF NOT EXISTS idx_quests_category ON public.quests(category);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON public.user_progress(user_address);
CREATE INDEX IF NOT EXISTS idx_user_progress_quest ON public.user_progress(quest_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_address);
CREATE INDEX IF NOT EXISTS idx_user_badges_quest ON public.user_badges(quest_id);

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Quests policies
-- Anyone can read public quests
CREATE POLICY "Public quests are viewable by everyone" ON public.quests
    FOR SELECT USING (visibility = 'public');

-- Users can read their own private quests
CREATE POLICY "Users can view their own quests" ON public.quests
    FOR SELECT USING (creator_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can insert their own quests
CREATE POLICY "Users can insert their own quests" ON public.quests
    FOR INSERT WITH CHECK (creator_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can update their own quests
CREATE POLICY "Users can update their own quests" ON public.quests
    FOR UPDATE USING (creator_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- Users can delete their own quests
CREATE POLICY "Users can delete their own quests" ON public.quests
    FOR DELETE USING (creator_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- User Progress policies
-- Users can only access their own progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
    FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own progress" ON public.user_progress
    FOR INSERT WITH CHECK (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own progress" ON public.user_progress
    FOR UPDATE USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can delete their own progress" ON public.user_progress
    FOR DELETE USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- User Badges policies
-- Users can only access their own badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
    FOR SELECT USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own badges" ON public.user_badges
    FOR INSERT WITH CHECK (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can update their own badges" ON public.user_badges
    FOR UPDATE USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can delete their own badges" ON public.user_badges
    FOR DELETE USING (user_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- For development/testing, you can temporarily disable RLS with:
-- ALTER TABLE public.quests DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_progress DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_badges DISABLE ROW LEVEL SECURITY;

-- Functions to update timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update timestamps
CREATE TRIGGER handle_updated_at_quests
    BEFORE UPDATE ON public.quests
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_progress
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
