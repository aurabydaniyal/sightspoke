-- ================================================================
-- SIGHTSPOKE SEED DATA
-- Sample data for testing and development
-- ================================================================

-- ================================================================
-- 1. Insert Sample Admin User
-- ================================================================
-- Password: admin123
-- BCrypt hash generated for demonstration
INSERT INTO admin_users (username, password_hash, is_active) 
VALUES (
    'admin', 
    '$2b$12$LKJh9vX.E1sL9/KH5XZ5xeKzXp.VZoWrTZxWzL6Mx8nVqPqJ1Q6mK', 
    true
);

-- ================================================================
-- 2. Insert Sample Images
-- ================================================================
-- Note: These are just examples - replace with actual paths
INSERT INTO images (id, filename, file_path, mime_type, metadata) VALUES
    (uuid_generate_v4(), 'mountain1.jpg', '/uploads/mountain1.jpg', 'image/jpeg', '{"width": 800, "height": 600}'),
    (uuid_generate_v4(), 'mountain2.jpg', '/uploads/mountain2.jpg', 'image/jpeg', '{"width": 800, "height": 600}'),
    (uuid_generate_v4(), 'mountain3.jpg', '/uploads/mountain3.jpg', 'image/jpeg', '{"width": 800, "height": 600}'),
    (uuid_generate_v4(), 'mountain4.jpg', '/uploads/mountain4.jpg', 'image/jpeg', '{"width": 800, "height": 600}'),
    (uuid_generate_v4(), 'beach1.jpg', '/uploads/beach1.jpg', 'image/jpeg', '{"width": 800, "height": 600}'),
    (uuid_generate_v4(), 'beach2.jpg', '/uploads/beach2.jpg', 'image/jpeg', '{"width": 800, "height": 600}'),
    (uuid_generate_v4(), 'forest1.jpg', '/uploads/forest1.jpg', 'image/jpeg', '{"width": 800, "height": 600}'),
    (uuid_generate_v4(), 'forest2.jpg', '/uploads/forest2.jpg', 'image/jpeg', '{"width": 800, "height": 600}');

-- ================================================================
-- 3. Insert Sample Quiz
-- ================================================================

-- Create a quiz
INSERT INTO quizzes (id, admin_id, title, description, is_published) 
VALUES (
    uuid_generate_v4(),
    (SELECT id FROM admin_users WHERE username = 'admin'),
    'SightSpoke Sample Quiz',
    'A sample quiz to demonstrate the platform functionality',
    true
);

-- ================================================================
-- 4. Insert Sample Quiz Pages
-- ================================================================

-- We need to get the quiz ID from the inserted quiz
DO $$
DECLARE
    quiz_id UUID;
BEGIN
    -- Get the quiz ID
    SELECT id INTO quiz_id FROM quizzes WHERE title = 'SightSpoke Sample Quiz';
    
    -- Insert pages
    INSERT INTO quiz_pages (quiz_id, page_number, time_limit_seconds, layout_template_id)
    VALUES
        (quiz_id, 1, 10, 1),  -- 2x2 grid, 10 seconds
        (quiz_id, 2, 10, 2),  -- 3x2 grid, 10 seconds
        (quiz_id, 3, 8, 1);   -- 2x2 grid, 8 seconds
    
    -- Add sample image associations (using image IDs from above)
    -- We'll link 4 images to page 1, 4 images to page 2, etc.
    -- This is simplified - in production you'd have proper logic
END $$;

-- ================================================================
-- 4. Verify Data
-- ================================================================

-- Check all tables have data
SELECT 'admin_users' as table_name, COUNT(*) as row_count FROM admin_users
UNION ALL
SELECT 'layout_templates' as table_name, COUNT(*) as row_count FROM layout_templates
UNION ALL
SELECT 'images' as table_name, COUNT(*) as row_count FROM images
UNION ALL
SELECT 'quizzes' as table_name, COUNT(*) as row_count FROM quizzes
UNION ALL
SELECT 'quiz_pages' as table_name, COUNT(*) as row_count FROM quiz_pages;