-- ================================================================
-- SIGHTSPOKE DATABASE SCHEMA
-- PostgreSQL 14+ Required
-- ================================================================
-- This file contains the complete database structure for SightSpoke
-- Run this file to create all tables, indexes, and relationships
-- ================================================================

-- ================================================================
-- PART 1: Enable Extensions
-- ================================================================

-- Enable UUID generation (for primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable JSON support (already built-in, but good to verify)
CREATE EXTENSION IF NOT EXISTS "plpgsql";

-- ================================================================
-- PART 2: Drop Existing Tables (if any) - Clean Setup
-- ================================================================

-- Drop in reverse order of dependencies (child tables first)
DROP TABLE IF EXISTS responses CASCADE;
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
-- Stores administrator accounts for managing quizzes
-- ----------------------------------------------------------------
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE admin_users IS 'Stores administrator accounts';
COMMENT ON COLUMN admin_users.password_hash IS 'BCrypt hashed password';
COMMENT ON COLUMN admin_users.is_active IS 'Soft delete flag';

-- ----------------------------------------------------------------
-- Table 2: layout_templates
-- Pre-defined layout templates for displaying images
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

COMMENT ON TABLE layout_templates IS 'Pre-defined layout templates for image display';
COMMENT ON COLUMN layout_templates.css_class IS 'CSS class for styling the grid';

-- ----------------------------------------------------------------
-- Table 3: images
-- Stores uploaded image metadata (actual files are on disk)
-- ----------------------------------------------------------------
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE images IS 'Stores image metadata';
COMMENT ON COLUMN images.file_path IS 'Relative path to stored image file';
COMMENT ON COLUMN images.metadata IS 'Additional image metadata (dimensions, etc.)';

-- ----------------------------------------------------------------
-- Table 4: quizzes
-- Main quiz container that groups pages
-- ----------------------------------------------------------------
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE quizzes IS 'Main quiz container';
COMMENT ON COLUMN quizzes.is_published IS 'Whether quiz is available to participants';

-- ----------------------------------------------------------------
-- Table 5: quiz_pages
-- Individual pages within a quiz, each with its own layout and timer
-- ----------------------------------------------------------------
CREATE TABLE quiz_pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    time_limit_seconds INTEGER DEFAULT 10,
    layout_template_id INTEGER REFERENCES layout_templates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(quiz_id, page_number)
);

COMMENT ON TABLE quiz_pages IS 'Individual pages within a quiz';
COMMENT ON COLUMN quiz_pages.time_limit_seconds IS 'Timer duration for this page';

-- ----------------------------------------------------------------
-- Table 6: page_images (Junction Table)
-- Many-to-many relationship between pages and images
-- ----------------------------------------------------------------
CREATE TABLE page_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES quiz_pages(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL,
    position_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_id, image_id)
);

COMMENT ON TABLE page_images IS 'Junction table for page-image relationship';
COMMENT ON COLUMN page_images.display_order IS 'Order in which images are displayed';
COMMENT ON COLUMN page_images.position_index IS 'Position in grid (0-based index)';

-- ----------------------------------------------------------------
-- Table 7: participant_tokens
-- Unique tokens for anonymous participant access
-- ----------------------------------------------------------------
CREATE TABLE participant_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    admin_label VARCHAR(255),
    is_used BOOLEAN DEFAULT FALSE,
    is_expired BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE participant_tokens IS 'Unique tokens for anonymous participant access';
COMMENT ON COLUMN participant_tokens.token IS 'JWT or UUID token';
COMMENT ON COLUMN participant_tokens.admin_label IS 'Internal admin reference (not shown to users)';

-- ----------------------------------------------------------------
-- Table 8: responses
-- Stores participant responses for each page
-- ----------------------------------------------------------------
CREATE TABLE responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

COMMENT ON TABLE responses IS 'Stores participant responses for each page';
COMMENT ON COLUMN responses.latency_ms IS 'Time taken to make selection in milliseconds';
COMMENT ON COLUMN responses.timeout_flag IS 'True if participant did not make selection';
COMMENT ON COLUMN responses.images_displayed IS 'JSON array of image IDs shown';
COMMENT ON COLUMN responses.randomized_order IS 'JSON array showing randomized order';

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

-- ================================================================
-- PART 5: Create Triggers for Auto-Update
-- ================================================================

-- Function to update updated_at timestamp
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

-- ================================================================
-- PART 6: Insert Default Data
-- ================================================================

-- Insert layout templates
INSERT INTO layout_templates (name, description, columns, rows, css_class) VALUES
    ('2x2 Grid', 'Two columns, two rows grid layout', 2, 2, 'grid-layout-2x2'),
    ('3x2 Grid', 'Three columns, two rows grid layout', 3, 2, 'grid-layout-3x2'),
    ('Vertical Stack', 'Single column, vertical scrolling stack', 1, 4, 'stack-vertical'),
    ('Horizontal Row', 'Multiple columns in a single horizontal row', 4, 1, 'row-horizontal');

-- ================================================================
-- PART 7: Verification Queries (Run after schema creation)
-- ================================================================

-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify layout templates were inserted
SELECT * FROM layout_templates;

-- ================================================================
-- END OF SCHEMA
-- ================================================================