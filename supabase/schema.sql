-- BuildPrompt AI Database Schema
-- Supabase PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced with Clerk)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Clerk user ID
    email TEXT NOT NULL,
    name TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    stripe_customer_id TEXT UNIQUE,
    builds_used_this_month INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);

-- Builds table (stores generated builds)
CREATE TABLE IF NOT EXISTS builds (
    id TEXT PRIMARY KEY, -- BuildPrompt generated ID (bp_xxx)
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL,
    summary TEXT NOT NULL,
    idea TEXT NOT NULL,
    agent TEXT NOT NULL,
    feasibility_score INTEGER CHECK (feasibility_score >= 1 AND feasibility_score <= 10),
    estimated_complexity TEXT CHECK (estimated_complexity IN ('beginner', 'intermediate', 'advanced')),
    tech_stack JSONB,
    guide JSONB NOT NULL,
    prompts JSONB NOT NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    current_as_of TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for builds
CREATE INDEX IF NOT EXISTS idx_builds_user_id ON builds(user_id);
CREATE INDEX IF NOT EXISTS idx_builds_created_at ON builds(created_at DESC);

-- Usage records table (for tracking and billing)
CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    build_id TEXT REFERENCES builds(id) ON DELETE SET NULL,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for usage records
CREATE INDEX IF NOT EXISTS idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_records_created_at ON usage_records(created_at);

-- Function to increment builds count
CREATE OR REPLACE FUNCTION increment_builds_count(user_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE users
    SET builds_used_this_month = builds_used_this_month + 1,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly builds (call via cron)
CREATE OR REPLACE FUNCTION reset_monthly_builds()
RETURNS void AS $$
BEGIN
    UPDATE users SET builds_used_this_month = 0, updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- Builds policies
CREATE POLICY "Users can view own builds" ON builds
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own builds" ON builds
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own builds" ON builds
    FOR DELETE USING (auth.uid()::text = user_id);

-- Usage records policies
CREATE POLICY "Users can view own usage" ON usage_records
    FOR SELECT USING (auth.uid()::text = user_id);

-- Service role bypass (for API operations)
CREATE POLICY "Service role full access users" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access builds" ON builds
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access usage" ON usage_records
    FOR ALL USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts synced with Clerk authentication';
COMMENT ON TABLE builds IS 'Generated build guides and prompts';
COMMENT ON TABLE usage_records IS 'Token usage tracking for billing';
COMMENT ON COLUMN users.subscription_tier IS 'User subscription level: free, pro, or enterprise';
COMMENT ON COLUMN builds.guide IS 'JSON array of build guide steps';
COMMENT ON COLUMN builds.prompts IS 'JSON array of agent-specific prompts';
