-- ================================================================
-- SIGHTSPOKE DATABASE SCHEMA v2.0
-- PostgreSQL 17+ Required
-- AI-Powered Psychological Survey Platform
-- ================================================================

-- ================================================================
-- PART 1: Enable Extensions
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "plpgsql";

-- ================================================================
-- PART 2: Drop Existing Tables (if any) - Clean Setup
-- ================================================================

DROP TABLE IF EXISTS responses CASCADE;
DROP TABLE IF EXISTS participant_chat_logs CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS participant_tokens CASCADE;
DROP TABLE IF EXISTS page_images CASCADE;
DROP TABLE IF EXISTS images CASCADE;
DROP TABLE IF EXISTS quiz_pages CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS layout_templates CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;

-- ================================================================
-- PART 3: Create Tables
-- ================================================================

-- ----------------------------------------------------------------
-- Table 1: admin_users
-- Stores administrator accounts for managing the platform
-- ----------------------------------------------------------------
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE admin_users IS 'Administrator accounts for platform management';
COMMENT ON COLUMN admin_users.password_hash IS 'SHA256 hashed password (bcrypt in production)';
COMMENT ON COLUMN admin_users.is_active IS 'Soft delete flag for admin accounts';

-- ----------------------------------------------------------------
-- Table 2: layout_templates
-- Pre-defined layout templates for image display
-- ----------------------------------------------------------------
CREATE TABLE layout_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    columns INTEGER NOT NULL,
    rows INTEGER NOT NULL,
    css_class VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE layout_templates IS 'Pre-defined grid layouts for image display';
COMMENT ON COLUMN layout_templates.css_class IS 'CSS class for styling the grid (Tailwind compatible)';

-- Insert default layouts
INSERT INTO layout_templates (name, description, columns, rows, css_class) VALUES
    ('2x2 Grid', 'Two columns, two rows grid layout', 2, 2, 'grid-layout-2x2'),
    ('3x2 Grid', 'Three columns, two rows grid layout', 3, 2, 'grid-layout-3x2'),
    ('Vertical Stack', 'Single column, vertical scrolling stack', 1, 4, 'stack-vertical'),
    ('Horizontal Row', 'Multiple columns in a single horizontal row', 4, 1, 'row-horizontal');

-- ----------------------------------------------------------------
-- Table 3: images
-- Stores all image metadata (uploaded + AI-generated)
-- ----------------------------------------------------------------
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    img_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE images IS 'Stores all image metadata (uploaded + AI-generated)';
COMMENT ON COLUMN images.file_path IS 'File path or URL for AI-generated images';
COMMENT ON COLUMN images.title IS 'Image title used by AI for analysis';
COMMENT ON COLUMN images.description IS 'Image description for psychological context';
COMMENT ON COLUMN images.img_metadata IS 'JSON: source, psychological_concept, analysis_context, generated_at';

-- ----------------------------------------------------------------
-- Table 4: quizzes
-- Main quiz container with AI psychological context
-- ----------------------------------------------------------------
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ai_overview TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE quizzes IS 'Main quiz container with AI psychological context';
COMMENT ON COLUMN quizzes.ai_overview IS 'Psychological context for AI chatbot (keeps conversations focused)';
COMMENT ON COLUMN quizzes.is_published IS 'Controls participant access';

-- ----------------------------------------------------------------
-- Table 5: quiz_pages
-- Individual pages with two distinct psychological perspectives
-- ----------------------------------------------------------------
CREATE TABLE quiz_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    time_limit_seconds INTEGER DEFAULT 15,
    layout_template_id INTEGER REFERENCES layout_templates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quiz_id, page_number)
);

COMMENT ON TABLE quiz_pages IS 'Individual pages with two psychological perspectives';
COMMENT ON COLUMN quiz_pages.time_limit_seconds IS '15 seconds default for psychological reflection';
COMMENT ON COLUMN quiz_pages.layout_template_id IS 'References layout_templates for image grid';

-- ----------------------------------------------------------------
-- Table 6: page_images (Junction Table)
-- Many-to-many relationship between pages and images
-- ----------------------------------------------------------------
CREATE TABLE page_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID NOT NULL REFERENCES quiz_pages(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    position_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_id, image_id)
);

COMMENT ON TABLE page_images IS 'Junction table for pages and images (Many-to-Many)';
COMMENT ON COLUMN page_images.display_order IS 'Order in which images are displayed on page';
COMMENT ON COLUMN page_images.position_index IS '0-based position in grid layout';

-- ----------------------------------------------------------------
-- Table 7: participant_tokens
-- Unique anonymous tokens for participant access
-- ----------------------------------------------------------------
CREATE TABLE participant_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    admin_label VARCHAR(255),
    is_used BOOLEAN DEFAULT FALSE,
    is_expired BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE participant_tokens IS 'Anonymous access tokens for participants';
COMMENT ON COLUMN participant_tokens.token IS 'Random 32-character token string';
COMMENT ON COLUMN participant_tokens.admin_label IS 'Internal admin reference (e.g., "Candidate A")';
COMMENT ON COLUMN participant_tokens.expires_at IS 'Token expiry (default: 7 days)';

-- ----------------------------------------------------------------
-- Table 8: responses
-- Stores all participant responses with psychological data
-- ----------------------------------------------------------------
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    participant_token_id UUID NOT NULL REFERENCES participant_tokens(id) ON DELETE CASCADE,
    page_id UUID NOT NULL REFERENCES quiz_pages(id) ON DELETE CASCADE,
    selected_image_id UUID REFERENCES images(id) ON DELETE SET NULL,
    selected_position_index INTEGER,
    latency_ms INTEGER,
    timeout_flag BOOLEAN DEFAULT FALSE,
    time_limit_seconds INTEGER,
    layout_template_id INTEGER REFERENCES layout_templates(id),
    images_displayed JSONB,
    randomized_order JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE responses IS 'Core table: stores all participant responses';
COMMENT ON COLUMN responses.latency_ms IS 'Decision time in milliseconds (critical for behavioral analysis)';
COMMENT ON COLUMN responses.timeout_flag IS 'True if participant didn\'t select before timer expired';
COMMENT ON COLUMN responses.images_displayed IS 'JSON array of all image IDs shown on this page';
COMMENT ON COLUMN responses.randomized_order IS 'JSON array of images in display order';

-- ----------------------------------------------------------------
-- Table 9: participant_chat_logs
-- Stores AI chat conversations with participants
-- ----------------------------------------------------------------
CREATE TABLE participant_chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    participant_token_id UUID NOT NULL REFERENCES participant_tokens(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE participant_chat_logs IS 'AI chat conversations with participants';
COMMENT ON COLUMN participant_chat_logs.message IS 'Chat message content';
COMMENT ON COLUMN participant_chat_logs.sender IS 'Either "participant" or "ai"';

-- ----------------------------------------------------------------
-- Table 10: ai_insights
-- Stores AI-generated psychological insights
-- ----------------------------------------------------------------
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    participant_token_id UUID REFERENCES participant_tokens(id) ON DELETE SET NULL,
    insight_type VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE ai_insights IS 'AI-generated psychological insights and analysis';
COMMENT ON COLUMN ai_insights.insight_type IS 'Types: psychological_analysis, individual_analysis, combined_chat_summary, etc.';
COMMENT ON COLUMN ai_insights.content IS 'JSON: contains analysis, key_findings, most_selected, avg_latency, etc.';

-- ================================================================
-- PART 4: Create Indexes for Performance
-- ================================================================

-- Admin indexes
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);

-- Quiz indexes
CREATE INDEX idx_quizzes_admin_id ON quizzes(admin_id);
CREATE INDEX idx_quizzes_published ON quizzes(is_published);
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at);

-- Quiz pages indexes
CREATE INDEX idx_quiz_pages_quiz_id ON quiz_pages(quiz_id);
CREATE INDEX idx_quiz_pages_page_number ON quiz_pages(page_number);
CREATE INDEX idx_quiz_pages_layout ON quiz_pages(layout_template_id);

-- Page images indexes
CREATE INDEX idx_page_images_page_id ON page_images(page_id);
CREATE INDEX idx_page_images_image_id ON page_images(image_id);
CREATE INDEX idx_page_images_order ON page_images(display_order);

-- Image indexes
CREATE INDEX idx_images_created_at ON images(created_at);
CREATE INDEX idx_images_mime_type ON images(mime_type);
CREATE INDEX idx_images_title ON images(title);

-- Participant tokens indexes
CREATE INDEX idx_participant_tokens_quiz_id ON participant_tokens(quiz_id);
CREATE INDEX idx_participant_tokens_token ON participant_tokens(token);
CREATE INDEX idx_participant_tokens_expires ON participant_tokens(expires_at) 
    WHERE is_used = FALSE AND is_expired = FALSE;
CREATE INDEX idx_participant_tokens_used ON participant_tokens(is_used);

-- Responses indexes
CREATE INDEX idx_responses_quiz_id ON responses(quiz_id);
CREATE INDEX idx_responses_participant_token ON responses(participant_token_id);
CREATE INDEX idx_responses_page_id ON responses(page_id);
CREATE INDEX idx_responses_selected_image ON responses(selected_image_id);
CREATE INDEX idx_responses_submitted_at ON responses(submitted_at);
CREATE INDEX idx_responses_quiz_page ON responses(quiz_id, page_id);
CREATE INDEX idx_responses_timeout ON responses(timeout_flag);
CREATE INDEX idx_responses_latency ON responses(latency_ms);

-- Chat logs indexes
CREATE INDEX idx_chat_logs_quiz_id ON participant_chat_logs(quiz_id);
CREATE INDEX idx_chat_logs_participant ON participant_chat_logs(participant_token_id);
CREATE INDEX idx_chat_logs_created_at ON participant_chat_logs(created_at);
CREATE INDEX idx_chat_logs_sender ON participant_chat_logs(sender);

-- AI insights indexes
CREATE INDEX idx_ai_insights_quiz_id ON ai_insights(quiz_id);
CREATE INDEX idx_ai_insights_participant ON ai_insights(participant_token_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at);

-- ================================================================
-- PART 5: Create Triggers for Auto-Update
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_quizzes_updated_at
    BEFORE UPDATE ON quizzes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_pages_updated_at
    BEFORE UPDATE ON quiz_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at
    BEFORE UPDATE ON images
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON ai_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- PART 6: Insert Default Data
-- ================================================================

-- Layout templates already inserted above

-- Default admin user (password: admin123)
-- SHA256 hash: 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
INSERT INTO admin_users (username, password_hash, is_active) 
VALUES (
    'admin', 
    '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', 
    true
);

-- ================================================================
-- PART 7: Verification Queries
-- ================================================================

-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify layout templates
SELECT * FROM layout_templates;

-- Verify admin user
SELECT id, username, created_at FROM admin_users;

-- Verify table relationships
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ================================================================
-- END OF SCHEMA
-- ================================================================